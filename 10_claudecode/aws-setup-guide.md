# AWS 構築手順書 — Day 1

最終更新: 2026-05-05 / リージョン: `ap-northeast-1`（東京）/ アカウント: `802604429874`

---

## 0. この手順書の読み方

- **対象読者**: Day 1 の開発者本人。AWS の基本（IAM・コンソール操作）が分かる前提。
- **構成**: Phase 0（最短で動かす）→ Phase 1（CDK で本番化）の2段構え。
- **ポリシー**: コンソール手順は「2026年5月時点の最新UI」のラベル名で記載。古いブログ記事と異なる箇所があるので注意。

### 全体像

```
Phase 0 (1〜2日)                Phase 1 (1週間)
┌─────────────────────┐         ┌──────────────────────────────┐
│ ローカル Next.js     │         │ Amplify Hosting (Next.js)    │
│ + Bedrock APIキー    │   →    │ + Cognito + DynamoDB + S3    │
│ + ElevenLabs        │         │ + API GW (REST/WS) + Lambda  │
│ + localStorage      │         │ + SES + EventBridge + CDK    │
└─────────────────────┘         └──────────────────────────────┘
```

---

## 1. アカウント・リージョン準備

### 1-1. リージョン固定

すべての作業を `ap-northeast-1`（東京）で行う。コンソール右上のリージョンセレクタが東京になっていることを操作のたびに確認すること。

| サービス | 利用リージョン | 備考 |
|---|---|---|
| Bedrock (Nova 2 Lite) | ap-northeast-1 を呼び出し元、推論プロファイルは `global.amazon.nova-2-lite-v1:0` | クロスリージョン推論で実行リージョンは自動選択 |
| Transcribe Streaming | ap-northeast-1 | ja-JP は Tokyo ネイティブ対応 |
| Cognito / DynamoDB / S3 / Lambda / API Gateway / SES | ap-northeast-1 | すべて同一リージョン |
| Amplify Hosting | ap-northeast-1 | Gen 2 対応 |

### 1-2. 開発用 IAM ユーザー作成

1. IAM → Users → **Create user**
2. ユーザー名: `day-one-dev`
3. **Provide user access to the AWS Management Console** にチェック → 自分用パスワード生成
4. パーミッション: 開発用なので `AdministratorAccess` でOK（本番では絞ること）
5. 作成後、AWS CLI 用のアクセスキーは**作らない**（このプロジェクトでは Bedrock APIキー or IAM ロールで完結する）

### 1-3. ローカル AWS CLI（任意・あれば便利）

CLI を使う場合のみ：
```bash
brew install awscli
aws configure --profile day-one-dev
# Region: ap-northeast-1
# Output: json
```

このプロジェクトの Phase 0 では AWS CLI は必須ではない。Bedrock APIキーで HTTPS 直叩きするため。

---

## 2. Phase 0：対話パイプラインを動かす（最短ルート）

ゴール: ブラウザで「Day 1記録 → 自分の声サンプル録音 → 質問発話 → 過去の自分の声で返答」が動く。

### 2-1. Bedrock のモデルアクセス（実は自動）

**重要な変更点**: 2025年後半から **Amazon 製モデル（Nova シリーズ含む）はデフォルトで利用可能**になった。以前必要だった「Request access」は Amazon モデルでは不要。

確認手順：

1. AWS コンソール → Bedrock（リージョン: 東京）
2. 左メニュー → **Model catalog**
3. 検索ボックスに `Nova 2 Lite` → 結果から **Amazon Nova 2 Lite** を開く
4. ページ上部に **"Access granted"** と緑色で表示されていればOK
5. 表示されていない場合のみ **Modify model access** から有効化

> Anthropic Claude を将来使う場合は、初回利用時に「ユースケースフォーム」の入力が必要。Amazon モデルだけならこれは関係ない。

### 2-2. Bedrock 推論プロファイルの確認

Nova 2 Lite はオンデマンド単独呼び出し不可で、**クロスリージョン推論プロファイル経由でのみ呼べる**。

1. Bedrock コンソール → 左メニュー → **Cross-region inference**
2. リストから `global.amazon.nova-2-lite-v1:0` を選択
3. このアカウントで「Active」になっていることを確認
4. ARN をコピー（`arn:aws:bedrock:us-east-1:802604429874:inference-profile/global.amazon.nova-2-lite-v1:0` のような形式）→ Phase 1 の IAM ポリシーで使う

検証コマンド（curl で動作確認、APIキーは次節で発行したものを使う）：
```bash
curl -X POST "https://bedrock-runtime.ap-northeast-1.amazonaws.com/model/global.amazon.nova-2-lite-v1:0/converse" \
  -H "Authorization: Bearer $BEDROCK_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "messages":[{"role":"user","content":[{"text":"こんにちは"}]}],
    "inferenceConfig":{"maxTokens":100}
  }'
```

`200 OK` で `output.message.content[0].text` が返ってくれば成功。

### 2-3. Bedrock 長期 APIキー（ABSK）の発行

> **2026年5月時点のコンソール最新パス**:
> IAM → Users → `day-one-dev` → **Security credentials** タブ → 下部の **"API keys for Amazon Bedrock"** セクション → **Generate API key**

1. **Key type**: `Long-term`（短期は最大12時間、開発用は長期）
2. **Expiration**: 開発用なら `90 days` を強く推奨。`Never expires` は内部的に100年だがハッカソン用途では避ける
3. **Tags**: `project=day-one`, `env=dev`
4. 生成された `ABSK...` で始まる132文字の文字列を **その場で安全な場所（パスワードマネージャ）にコピー**。再表示不可
5. コピー後 **`.env.local` 以外の場所には絶対に貼らない**（Slack・Git・チャット履歴に残ると即漏洩）

> **既知の制約**: 1 IAM ユーザーにつき長期キーは2本まで。ローテート時は新キー発行 → 動作確認 → 旧キー削除 の順。

### 2-4. ElevenLabs 契約

クローンボイスは ElevenLabs Voice Cloning API を使う。Voice Cloning は **Starter プラン以上**が必須（Free では不可）。

1. https://elevenlabs.io でサインアップ
2. **Starter プラン $5/月** に加入（クレカ登録）
3. プロフィールアイコン → **API keys** → **Create API Key**
4. スコープは `voices_write`, `text_to_speech` を最低限有効化
5. `sk_...` キーをコピー

### 2-5. ローカル環境構築

```bash
cd /Users/fumiya/work/10_hackathon/02_AWS_hackathon2026/01_day1
mkdir -p day-one && cd day-one

pnpm create next-app@latest frontend \
  --typescript --app --tailwind --eslint --src-dir --import-alias "@/*"

cd frontend
pnpm add zod
```

`.env.local` を作成（ファイルは `.gitignore` 済みであること要確認）：
```
AWS_REGION=ap-northeast-1
BEDROCK_MODEL_ID=global.amazon.nova-2-lite-v1:0
BEDROCK_API_KEY=ABSK発行したキー全文

ELEVENLABS_API_KEY=sk_ElevenLabsキー全文
```

### 2-6. 動作確認用ヘルスエンドポイント

`src/app/api/_health/route.ts`:
```ts
export async function GET() {
  return Response.json({
    region: process.env.AWS_REGION,
    modelId: process.env.BEDROCK_MODEL_ID,
    bedrockKeyLoaded: !!process.env.BEDROCK_API_KEY,
    elevenLabsKeyLoaded: !!process.env.ELEVENLABS_API_KEY,
  });
}
```

`pnpm dev` → `http://localhost:3000/api/_health` で全て `true` ならOK。

### 2-7. Phase 0 完了条件

- [ ] Bedrock コンソールで Nova 2 Lite が "Access granted"
- [ ] curl で Converse API が 200 を返す
- [ ] ElevenLabs API キー取得済み
- [ ] `_health` で全フラグが true
- [ ] アプリ実装：記録フォーム → クローン録音 → 対話画面 → 音声再生（実装は別途）

ここまで完了したら Phase 0 のインフラ準備は完了。Next.js 側のアプリ実装に進む。

---

## 3. Phase 1：AWS 本番構成

Phase 0 で動作確認できた後に着手。ここからは **CDK で IaC 化**する。手動コンソール操作は最小限にする（Bedrock モデルアクセス・SES サンドボックス解除など、CDK で扱えないものだけ手動）。

### 3-1. CDK プロジェクト初期化

```bash
cd /Users/fumiya/work/10_hackathon/02_AWS_hackathon2026/01_day1/day-one
mkdir infra && cd infra

# CDK CLI をプロジェクトローカルに（グローバルインストールは推奨されない）
pnpm add -D aws-cdk@latest aws-cdk-lib constructs typescript ts-node @types/node

npx cdk init app --language typescript

# bootstrap（アカウント+リージョン初回のみ）
npx cdk bootstrap aws://802604429874/ap-northeast-1
```

> CDK v2 は `aws-cdk-lib` 単一パッケージに集約済み（v1 のような `@aws-cdk/aws-xxx` は使わない）。

### 3-2. Cognito User Pool（Managed Login 新UI）

**重要な変更点**: 2024年後半から、新規 User Pool はデフォルトで **Managed Login（新UI）**になった。Hosted UI（旧）は既存プールでのみ。Managed Login は no-code ブランディングエディタ・パスキー対応・OTP対応が標準装備。

CDK 例（`infra/lib/auth-stack.ts`）:
```ts
import { UserPool, UserPoolClient, AccountRecovery } from "aws-cdk-lib/aws-cognito";

const userPool = new UserPool(this, "DayOneUserPool", {
  userPoolName: "day-one-users",
  selfSignUpEnabled: true,
  signInAliases: { email: true },
  autoVerify: { email: true },
  passwordPolicy: { minLength: 10, requireDigits: true, requireSymbols: true },
  accountRecovery: AccountRecovery.EMAIL_ONLY,
  customAttributes: {
    accountType: new StringAttribute({ minLen: 1, maxLen: 16, mutable: false }),
    organizationId: new StringAttribute({ minLen: 0, maxLen: 64, mutable: true }),
  },
});

const userPoolClient = new UserPoolClient(this, "WebClient", {
  userPool,
  authFlows: { userSrp: true },
  oAuth: {
    callbackUrls: ["http://localhost:3000/auth/callback", "https://prod-domain/auth/callback"],
    logoutUrls: ["http://localhost:3000", "https://prod-domain"],
  },
});
```

**Google ソーシャルログイン**は CDK で `UserPoolIdentityProviderGoogle` を追加すれば自動で Managed Login のサインイン画面に Google ボタンが出る。

**Managed Login のドメイン**: User Pool 作成後、コンソール → User Pool → **Branding → Domain** で `day-one-{random}.auth.ap-northeast-1.amazoncognito.com` を設定（無料）。または独自ドメイン。

### 3-3. DynamoDB テーブル

7テーブル構成（設計書 components.md 準拠）：

```ts
import { Table, AttributeType, BillingMode } from "aws-cdk-lib/aws-dynamodb";

const usersTable = new Table(this, "Users", {
  tableName: "day-one-users",
  partitionKey: { name: "userId", type: AttributeType.STRING },
  billingMode: BillingMode.PAY_PER_REQUEST,  // ハッカソン規模ならオンデマンド固定
});

const recordsTable = new Table(this, "DayOneRecords", {
  partitionKey: { name: "userId", type: AttributeType.STRING },
  sortKey: { name: "recordId", type: AttributeType.STRING },
  billingMode: BillingMode.PAY_PER_REQUEST,
});

// VoiceModels, ConversationSessions, RemindSchedules, FormTemplates, Organizations を同様に
```

オンデマンド料金: 書き込み $1.25/100万リクエスト、読み込み $0.25/100万リクエスト（東京）。MVP 規模なら月数十円。

### 3-4. S3 バケット

```ts
import { Bucket, BucketEncryption, HttpMethods } from "aws-cdk-lib/aws-s3";

const mediaBucket = new Bucket(this, "MediaBucket", {
  bucketName: `day-one-media-${this.account}`,
  encryption: BucketEncryption.S3_MANAGED,  // SSE-S3
  versioned: true,
  cors: [{
    allowedMethods: [HttpMethods.PUT, HttpMethods.GET],
    allowedOrigins: ["http://localhost:3000", "https://prod-domain"],
    allowedHeaders: ["*"],
    maxAge: 3000,
  }],
  blockPublicAccess: BlockPublicAccess.BLOCK_ALL,  // すべて Presigned URL 経由
});
```

Presigned URL 発行は Lambda 側で `@aws-sdk/s3-request-presigner` を使う。

### 3-5. Lambda（共通ロール設計）

```ts
import { Function, Runtime, Code } from "aws-cdk-lib/aws-lambda";
import { Role, ServicePrincipal, PolicyStatement } from "aws-cdk-lib/aws-iam";

const aiPipelineRole = new Role(this, "AiPipelineRole", {
  assumedBy: new ServicePrincipal("lambda.amazonaws.com"),
  managedPolicies: [
    ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole"),
  ],
});

// Bedrock 呼び出し権限（Phase 0 の APIキーをやめて IAM 認証に切替）
aiPipelineRole.addToPolicy(new PolicyStatement({
  actions: ["bedrock:InvokeModel", "bedrock:InvokeModelWithResponseStream", "bedrock:Converse", "bedrock:ConverseStream"],
  resources: [
    `arn:aws:bedrock:*::foundation-model/amazon.nova-2-lite-v1:0`,
    `arn:aws:bedrock:*:${this.account}:inference-profile/global.amazon.nova-2-lite-v1:0`,
  ],
}));

// Transcribe Streaming
aiPipelineRole.addToPolicy(new PolicyStatement({
  actions: ["transcribe:StartStreamTranscription"],
  resources: ["*"],
}));

// DynamoDB
recordsTable.grantReadWriteData(aiPipelineRole);
sessionsTable.grantReadWriteData(aiPipelineRole);

// S3
mediaBucket.grantReadWrite(aiPipelineRole);

// Secrets Manager（ElevenLabs キー）
elevenLabsSecret.grantRead(aiPipelineRole);
```

> **Phase 1 では Bedrock APIキー（ABSK）は使わない**。Lambda 実行ロールに `bedrock:InvokeModel` を付与すれば SDK が SigV4 で自動署名する。

### 3-6. API Gateway REST + WebSocket

#### REST API（Day 1記録の CRUD など）

```ts
import { RestApi, LambdaIntegration } from "aws-cdk-lib/aws-apigateway";
import { CognitoUserPoolsAuthorizer } from "aws-cdk-lib/aws-apigateway";

const api = new RestApi(this, "DayOneApi", { restApiName: "day-one-api" });
const authorizer = new CognitoUserPoolsAuthorizer(this, "Authz", { cognitoUserPools: [userPool] });

const records = api.root.addResource("records");
records.addMethod("POST", new LambdaIntegration(createRecordFn), { authorizer });
records.addMethod("GET", new LambdaIntegration(listRecordsFn), { authorizer });
```

#### WebSocket API（音声対話）

```ts
import { WebSocketApi, WebSocketStage } from "aws-cdk-lib/aws-apigatewayv2";
import { WebSocketLambdaIntegration } from "aws-cdk-lib/aws-apigatewayv2-integrations";

const wsApi = new WebSocketApi(this, "TalkWs", {
  connectRouteOptions: { integration: new WebSocketLambdaIntegration("Connect", connectFn) },
  disconnectRouteOptions: { integration: new WebSocketLambdaIntegration("Disconnect", disconnectFn) },
  defaultRouteOptions: { integration: new WebSocketLambdaIntegration("Message", messageFn) },
});

new WebSocketStage(this, "TalkStage", { webSocketApi: wsApi, stageName: "v1", autoDeploy: true });

// $connect で Cognito JWT を Lambda Authorizer 検証
// $default で音声チャンク受信 → AI Pipeline → postToConnection で返却
```

> **WebSocket の認証**: REQUEST 型 Lambda Authorizer を `$connect` ルートに付与し、クエリストリングで渡される JWT を検証する（WebSocket は接続時にだけ認証する）。

### 3-7. SES（ap-northeast-1 サンドボックス解除）

**重要な変更点**: SES のサンドボックス解除は**リージョン単位**で個別に申請する必要がある。Tokyo（ap-northeast-1）で本番送信したいなら東京で申請。

#### 手順

1. SES コンソール（東京）→ **Identities** → **Create identity**
2. **Domain** を選択 → 送信元ドメイン（例: `day-one.app`）を入力
3. **Easy DKIM** 有効化 → 表示される 3 本の CNAME を Route 53（または使用中の DNS）に追加
4. 数分後 DKIM ステータスが Verified になる
5. **From アドレス**としても使う場合、SPF レコードも追加: `v=spf1 include:amazonses.com ~all`
6. **Configuration sets** → 作成（バウンス・苦情通知用）
7. **Account dashboard** → 上部黄色バナー「Your account is in the sandbox」→ **Request production access**
8. 申請フォーム記入：
   - **Mail type**: Transactional
   - **Website URL**: 仮でOK
   - **Use case description**: 「Day 1 サービスのリマインダー・通知メール送信。明示的に opt-in したユーザーのみに送信。クローンボイス生成完了通知、リマインドメール、招待メールが対象。バウンス・苦情を監視し、自動的にサプレッションリストに追加する」
   - **Bounce/Complaint handling**: SNS トピックを作って Configuration set に紐付ける
9. 約24時間で承認メール

#### CDK 部分

ドメイン Identity と Configuration set のみ CDK で管理：
```ts
import { EmailIdentity, Identity } from "aws-cdk-lib/aws-ses";

const sesIdentity = new EmailIdentity(this, "SesIdentity", {
  identity: Identity.domain("day-one.app"),
});
```

サンドボックス解除自体はコンソール／API 申請（CDK 化不可）。

### 3-8. EventBridge Scheduler（リマインド）

```ts
import { Schedule, ScheduleExpression } from "aws-cdk-lib/aws-scheduler-alpha";  // alpha モジュール
import { LambdaInvoke } from "aws-cdk-lib/aws-scheduler-targets-alpha";

new Schedule(this, "DailyRemindCheck", {
  schedule: ScheduleExpression.cron({ hour: "9", minute: "0", timeZone: TimeZone.ASIA_TOKYO }),
  target: new LambdaInvoke(remindCheckFn, {}),
});
```

> 個別リマインドはユーザーごとに動的に作るので、Lambda 内から `@aws-sdk/client-scheduler` でプログラム的に Schedule を作成する設計にする。

### 3-9. Secrets Manager（ElevenLabs APIキー）

```ts
import { Secret } from "aws-cdk-lib/aws-secretsmanager";

const elevenLabsSecret = new Secret(this, "ElevenLabsApiKey", {
  secretName: "day-one/elevenlabs/api-key",
  description: "ElevenLabs API key",
});
// 値はコンソールから手動投入。CDK のコードに値を書かない。

elevenLabsSecret.grantRead(aiPipelineRole);
```

デプロイ後、コンソール → Secrets Manager → 該当シークレット → **Retrieve secret value** → **Edit** で `sk_...` を投入。

> コスト削減したいなら **SSM Parameter Store の SecureString** で代替（無料）。
> ```ts
> new StringParameter(this, "ElevenKey", { parameterName: "/day-one/elevenlabs/api-key", stringValue: "REPLACE_ME", tier: ParameterTier.STANDARD });
> ```

### 3-10. Amplify Hosting（Next.js）

#### コンソール手順（最も速い）

1. Amplify コンソール（東京）→ **Create new app** → **Host web app**
2. ソース: GitHub を選択 → リポジトリ・ブランチを選ぶ
3. ビルド設定: Next.js を自動検出。`amplify.yml` が無ければ自動生成。
4. **Service role**: 自動作成許可
5. 環境変数:
   - `AWS_REGION=ap-northeast-1`
   - `BEDROCK_MODEL_ID=global.amazon.nova-2-lite-v1:0`
   - `NEXT_PUBLIC_USER_POOL_ID=ap-northeast-1_xxxxxxxxx`
   - `NEXT_PUBLIC_USER_POOL_CLIENT_ID=xxxxxxxxxxxxxxxxxx`
   - `NEXT_PUBLIC_API_BASE=https://xxxxx.execute-api.ap-northeast-1.amazonaws.com`
   - `NEXT_PUBLIC_WS_URL=wss://xxxxx.execute-api.ap-northeast-1.amazonaws.com/v1`
6. デプロイ → 数分で `https://main.xxxxxx.amplifyapp.com/` が払い出される

#### Amplify Gen 2 を使う場合（オプション）

`frontend/amplify/` ディレクトリを追加し、TypeScript で Auth・Data を宣言する。Cognito も Amplify が自動構築する。本プロジェクトは **インフラを CDK 側で先に作る方針**なので Amplify Gen 2 のフルバックエンドモードは使わず、**Hosting だけ Amplify を使う**のが整合性高い。

---

## 4. デプロイ手順

```bash
cd day-one/infra
pnpm install
npx cdk synth                                  # CloudFormation 生成確認
npx cdk diff                                   # 差分確認
npx cdk deploy --all --require-approval never  # 一括デプロイ
```

初回は IAM 関連の確認が出るので `--require-approval never` を外して一度確認するのが安全。

### 出力値の取り回し

CDK Stack の `CfnOutput` で以下を出力する：
- `UserPoolId`, `UserPoolClientId`
- `RestApiUrl`, `WebSocketUrl`
- `MediaBucketName`

`cdk deploy` の終了時に出力されるので、Amplify の環境変数や `.env.local`（本番用）にコピー。

---

## 5. 動作確認・コスト確認

### 動作確認

| 確認項目 | 手順 |
|---|---|
| Bedrock 呼び出し | Lambda コンソール → AI pipeline 関数 → Test → サンプル event で実行 → CloudWatch Logs で応答確認 |
| Cognito | Amplify サイト → Sign up → メール認証 → ログイン |
| DynamoDB | コンソール → Items → 記録作成後にレコードが増えるか |
| S3 アップロード | フロントから録音 → Network タブで Presigned URL 200 OK |
| WebSocket 対話 | フロントの対話画面で接続確立 → 音声送信 → 音声返信 |
| SES | サンドボックス時は検証済みアドレスのみ送受信可、本番化後はその他へも |

### CloudWatch Billing アラーム（必須）

1. Billing → Budgets → **Create budget**
2. **Cost budget** → 月額 `$50` でアラート
3. メール通知設定

### 想定月額（MVP・少人数利用）

| サービス | 想定 |
|---|---|
| Bedrock Nova 2 Lite | $1〜5（対話 1000 ターン分） |
| ElevenLabs Starter | $5（固定） |
| Lambda | $0〜1 |
| API Gateway | $0〜2 |
| DynamoDB On-demand | $0〜1 |
| S3 | $0.5 |
| Cognito | 無料枠（MAU 50,000まで） |
| SES | $0.10/1000通 |
| Amplify Hosting | $0.5〜2 |
| **合計** | **$10〜20/月** |

---

## 6. トラブルシューティング

| 症状 | 原因 | 対処 |
|---|---|---|
| `Invocation of model ID amazon.nova-2-lite-v1:0 with on-demand throughput isn't supported` | 推論プロファイル未指定 | `global.amazon.nova-2-lite-v1:0` を使う |
| `The provided model identifier is invalid.` | `apac.` プレフィックスを使ってる | `global.` に変更 |
| `AccessDeniedException` (Bedrock) | IAM ロールに `bedrock:InvokeModel` 権限なし、または推論プロファイルARN未許可 | ポリシーに inference-profile ARN を追加 |
| Cognito 確認メールが届かない | SES サンドボックス | 開発時は Cognito の組み込みメール送信を使う（1日50通制限）。本番は SES 経由に切替 |
| WebSocket 接続が即切れる | $connect で Authorizer が拒否 | CloudWatch Logs で Authorizer の判定理由確認 |
| Amplify ビルドが Next.js Server Actions で失敗 | Amplify は SSR 対応済みだが Compute 設定要確認 | `amplify.yml` で `framework: next-ssr` を明示 |
| CDK deploy が `Bootstrap stack version` エラー | bootstrap が古い | `npx cdk bootstrap` を再実行 |

---

## 7. リファレンス

### コンソール直リンク（東京リージョン）

- Bedrock Model catalog: https://ap-northeast-1.console.aws.amazon.com/bedrock/home?region=ap-northeast-1#/model-catalog
- Bedrock Cross-region inference: https://ap-northeast-1.console.aws.amazon.com/bedrock/home?region=ap-northeast-1#/inference-profiles
- IAM Users (APIキー発行): https://us-east-1.console.aws.amazon.com/iam/home#/users
- Cognito User Pools: https://ap-northeast-1.console.aws.amazon.com/cognito/v2/idp/user-pools
- DynamoDB Tables: https://ap-northeast-1.console.aws.amazon.com/dynamodbv2/home?region=ap-northeast-1#tables
- API Gateway: https://ap-northeast-1.console.aws.amazon.com/apigateway/main/apis?region=ap-northeast-1
- SES: https://ap-northeast-1.console.aws.amazon.com/ses/home?region=ap-northeast-1
- Secrets Manager: https://ap-northeast-1.console.aws.amazon.com/secretsmanager/listsecrets?region=ap-northeast-1
- Amplify: https://ap-northeast-1.console.aws.amazon.com/amplify/home?region=ap-northeast-1

### 一次ドキュメント

- [Amazon Nova 2 Lite モデルカード](https://docs.aws.amazon.com/bedrock/latest/userguide/model-card-amazon-nova-2-lite.html)
- [Bedrock APIキー生成手順](https://docs.aws.amazon.com/bedrock/latest/userguide/api-keys-generate.html)
- [Bedrock Converse API リファレンス](https://docs.aws.amazon.com/bedrock/latest/APIReference/API_runtime_Converse.html)
- [Bedrock 推論プロファイル](https://docs.aws.amazon.com/bedrock/latest/userguide/cross-region-inference.html)
- [Cognito Managed Login](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pools-managed-login.html)
- [SES 本番アクセス申請](https://docs.aws.amazon.com/ses/latest/dg/request-production-access.html)
- [API Gateway WebSocket Authorizer](https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-websocket-api-lambda-auth.html)
- [Amplify Gen 2 (Next.js App Router)](https://docs.amplify.aws/nextjs/start/quickstart/nextjs-app-router-client-components/)
- [AWS CDK v2 ガイド](https://docs.aws.amazon.com/cdk/v2/guide/home.html)
- [Transcribe Streaming (ja-JP)](https://docs.aws.amazon.com/transcribe/latest/dg/streaming.html)
- [ElevenLabs Voice Cloning API](https://elevenlabs.io/docs/api-reference/voices/add)

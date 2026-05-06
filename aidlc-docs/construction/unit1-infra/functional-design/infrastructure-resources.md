# Unit 1 インフラ基盤 — リソース定義

## 設計決定サマリ

| 項目 | 決定内容 |
|---|---|
| **IaC ツール** | AWS CDK（TypeScript） |
| **デプロイリージョン** | ap-northeast-1（東京） |
| **環境** | 1アカウント・dev 環境のみ |
| **DynamoDB** | オンデマンド（PAY_PER_REQUEST） |
| **Cognito 認証** | メール＋パスワードのみ（Google ログインは後から追加） |
| **SES** | サンドボックスモード（検証済みメールアドレスで送信） |
| **Amplify** | CDK で管理（GitHub Personal Access Token が必要）|

---

## CDK スタック構成

```
infra/
├── bin/
│   └── day1.ts              # CDK アプリエントリポイント
└── lib/
    ├── day1-stack.ts         # メインスタック（全リソースを統合）
    ├── dynamodb-stack.ts     # DynamoDB テーブル定義
    ├── s3-stack.ts           # S3 バケット定義
    ├── cognito-stack.ts      # Cognito User Pool 定義
    ├── api-gateway-stack.ts  # API Gateway（REST + WebSocket）スタブ
    ├── ses-stack.ts          # SES 設定
    └── eventbridge-stack.ts  # EventBridge Scheduler 設定
```

---

## DynamoDB テーブル定義

### テーブル一覧

| テーブル名 | パーティションキー | ソートキー | 用途 |
|---|---|---|---|
| `day1-users` | `userId` (String) | — | ユーザープロフィール |
| `day1-records` | `userId` (String) | `recordId` (String) | Day 1 記録 |
| `day1-voice-models` | `userId` (String) | `voiceModelId` (String) | クローンボイスモデル |
| `day1-conversations` | `sessionId` (String) | `timestamp` (String) | 対話セッション履歴 |
| `day1-reminders` | `userId` (String) | `reminderId` (String) | リマインドスケジュール |
| `day1-form-templates` | `templateId` (String) | — | フォーマットテンプレート |
| `day1-organizations` | `organizationId` (String) | — | 企業アカウント情報 |

### 共通設定
- **キャパシティモード**: PAY_PER_REQUEST（オンデマンド）
- **暗号化**: AWS マネージドキー（デフォルト）
- **ポイントインタイムリカバリ**: 有効
- **削除ポリシー**: RETAIN（誤削除防止）

### GSI（グローバルセカンダリインデックス）

**day1-records テーブル**:
- GSI: `organizationId-createdAt-index`
  - パーティションキー: `organizationId`
  - ソートキー: `createdAt`
  - 用途: 企業単位での記録一覧取得

**day1-conversations テーブル**:
- GSI: `userId-timestamp-index`
  - パーティションキー: `userId`
  - ソートキー: `timestamp`
  - 用途: ユーザー別の対話履歴取得

---

## S3 バケット定義

### バケット: `day1-media-{accountId}-{region}`

**設定**:
- **バージョニング**: 有効
- **暗号化**: SSE-S3（AES-256）
- **パブリックアクセス**: すべてブロック
- **CORS 設定**: フロントエンドからの直接アップロード（Presigned URL）を許可
- **ライフサイクルルール**: 未完了マルチパートアップロードを7日後に削除

**ディレクトリ構造**:
```
day1-media/
├── users/{userId}/records/{recordId}/recordings/   # クローンボイス用音声（recordIdごとに分離）
├── users/{userId}/records/{recordId}/photos/       # 写真（JPEG/PNG）
├── users/{userId}/records/{recordId}/videos/       # 動画（MP4）
└── users/{userId}/voice-models/{voiceModelId}/     # ElevenLabs Voice ID メタデータ（JSON）
```

**設計の意図**:
- `recordId` をパスに含めることで、1ユーザーが複数の Day 1 記録（入社初日・ダイエット開始・受験決意など）を持つ場合でも、各記録の録音ファイルが混在しない
- 企業アカウントの場合も `userId` で従業員ごとに分離されるため、他の従業員の録音にアクセスできない

**CORS 設定**:
```json
{
  "AllowedOrigins": ["https://*.amplifyapp.com", "http://localhost:3000"],
  "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
  "AllowedHeaders": ["*"],
  "MaxAgeSeconds": 3000
}
```

---

## Amazon Cognito 定義

### User Pool: `day1-user-pool`

**設定**:
- **サインイン方法**: メールアドレス
- **パスワードポリシー**: 最小8文字・大文字・小文字・数字を含む
- **MFA**: オプション（SMS または TOTP）
- **メール検証**: 必須（Cognito 組み込みメール送信）
- **自己サインアップ**: 有効（BtoC）

**カスタム属性**:
- `custom:accountType` — `btob` / `btoc`
- `custom:organizationId` — BtoB ユーザーの企業 ID

### User Pool Client: `day1-web-client`

**設定**:
- **認証フロー**: USER_PASSWORD_AUTH, REFRESH_TOKEN_AUTH
- **トークン有効期限**: アクセストークン 1時間 / リフレッシュトークン 30日

### Identity Pool: `day1-identity-pool`

**設定**:
- Cognito User Pool と連携
- 認証済みユーザーに S3 アクセス権限を付与

---

## API Gateway 定義（スタブ）

### REST API: `day1-rest-api`

**設定**:
- **エンドポイントタイプ**: REGIONAL
- **ステージ**: `dev`
- **CORS**: 有効（フロントエンドオリジンを許可）
- **認証**: Cognito Authorizer

**リソース（スタブ）**:
```
/users
/records
/voice
/templates
/reminders
/conversations
/organizations
```

### WebSocket API: `day1-websocket-api`

**設定**:
- **ルート**: `$connect`, `$disconnect`, `$default`
- **ステージ**: `dev`
- **認証**: Lambda Authorizer（JWT 検証）

---

## Amazon SES 設定

**モード**: サンドボックス（MVP 期間中）

**検証済みメールアドレス**:
- `imazato.work.aws@gmail.com`（送信元・受信テスト用）

**送信設定**:
- 送信元アドレス: `noreply@day1.app`（将来的に独自ドメイン取得後に設定）
- MVP 期間中は検証済みアドレスへのみ送信可能

**将来対応**:
- 独自ドメイン取得後に SES ドメイン検証を実施
- サンドボックス解除申請（本番移行時）

---

## Amazon EventBridge Scheduler 設定

**スケジューラーグループ**: `day1-reminders`

**設定**:
- リマインド Lambda を呼び出すスケジュールルールを動的に作成
- スケジュール形式: cron 式または rate 式
- ターゲット: 通知 Lambda（Unit 3 で実装）

---

## IAM ロール・ポリシー

### Lambda 実行ロール: `day1-lambda-role`

**付与する権限**:
- DynamoDB: 全テーブルへの CRUD
- S3: `day1-media-*` バケットへの読み書き
- Cognito: ユーザー管理 API
- SES: メール送信
- Bedrock: Nova 2 Lite の InvokeModel
- Transcribe: StartStreamTranscription
- EventBridge: スケジュール作成・削除
- CloudWatch Logs: ログ書き込み

### API Gateway 実行ロール: `day1-apigateway-role`

**付与する権限**:
- Lambda: InvokeFunction
- CloudWatch Logs: ログ書き込み

---

## Amplify ホスティング（CDK 管理）

**CDK で管理する理由**：Cognito の User Pool ID・Client ID 等を CDK の出力値として Amplify 環境変数に自動注入できるため、手動コピーが不要で整合性が保たれる。

**事前準備**:
- GitHub Personal Access Token（repo スコープ）を AWS Secrets Manager に保存
  ```
  aws secretsmanager create-secret \
    --name day1/github-token \
    --secret-string "ghp_xxxxxxxxxxxx"
  ```

**CDK 定義**:
```typescript
// infra/lib/amplify-stack.ts
import * as amplify from 'aws-cdk-lib/aws-amplify';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';

const githubToken = secretsmanager.Secret.fromSecretNameV2(
  this, 'GitHubToken', 'day1/github-token'
);

const amplifyApp = new amplify.App(this, 'Day1App', {
  sourceCodeProvider: new amplify.GitHubSourceCodeProvider({
    owner: 'ima-work-git',
    repository: 'day-one',
    oauthToken: githubToken.secretValue,
  }),
  environmentVariables: {
    NEXT_PUBLIC_USER_POOL_ID: cognitoStack.userPool.userPoolId,
    NEXT_PUBLIC_USER_POOL_CLIENT_ID: cognitoStack.userPoolClient.userPoolClientId,
    NEXT_PUBLIC_API_URL: apiGatewayStack.restApiUrl,
    NEXT_PUBLIC_WS_URL: apiGatewayStack.webSocketApiUrl,
    NEXT_PUBLIC_REGION: 'ap-northeast-1',
  },
});

const mainBranch = amplifyApp.addBranch('main');
```

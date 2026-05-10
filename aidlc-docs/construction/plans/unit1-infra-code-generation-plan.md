# Unit 1 インフラ基盤 — Code Generation Plan

## 対象ユニット
Unit 1: インフラ基盤（Infrastructure Foundation）

## 実装するストーリー
Unit 1 は直接対応するユーザーストーリーはないが、全ストーリーの実行基盤を提供する。

## コード配置
- **アプリケーションコード**: `infra/`（ワークスペースルート）
- **ドキュメント**: `aidlc-docs/construction/unit1-infra/code/`

---

## 実行チェックリスト

### Step 1: プロジェクト構造セットアップ
- [ ] 1.1 `infra/` ディレクトリ作成
- [ ] 1.2 `package.json` 作成（CDK 依存関係）
  - `"aws-cdk-lib": "^2.251.0"`
  - `"@aws-cdk/aws-amplify-alpha": "^2.251.0-alpha.0"`（GitHub 連携に必要）
  - `"constructs": "^10.0.0"`
- [ ] 1.3 `tsconfig.json` 作成
- [ ] 1.4 `cdk.json` 作成
- [ ] 1.5 `.gitignore` 更新（node_modules 等）

### Step 2: CDK エントリポイント
- [ ] 2.1 `infra/bin/day1.ts` 作成

### Step 3: DynamoDB スタック
- [ ] 3.1 `infra/lib/stacks/dynamodb-stack.ts` 作成
  - 7テーブル定義（Users・Records・VoiceModels・Conversations・Reminders・FormTemplates・Organizations）
  - GSI 定義（organizationId-createdAt-index・userId-timestamp-index）
  - PITR・RETAIN・オンデマンド設定

### Step 4: S3 スタック
- [ ] 4.1 `infra/lib/stacks/s3-stack.ts` 作成
  - メディアバケット定義
  - CORS・バージョニング・ライフサイクル設定

### Step 5: Cognito スタック
- [ ] 5.1 `infra/lib/stacks/cognito-stack.ts` 作成
  - User Pool 定義（メール認証・カスタム属性）
  - User Pool Client 定義

### Step 6: IAM スタック
- [ ] 6.1 `infra/lib/stacks/iam-stack.ts` 作成
  - Lambda 実行ロール定義
  - 各サービスへの最小権限ポリシー（DynamoDB・S3・Cognito・SES・Bedrock・Transcribe・Secrets Manager・EventBridge）

### Step 7: API Gateway スタック（スタブ）
- [ ] 7.1 `infra/lib/stacks/api-gateway-stack.ts` 作成
  - REST API 定義（リソーススタブ）
  - WebSocket API 定義（ルートスタブ）
  - Cognito Authorizer 設定

### Step 8: Lambda スタック（スタブ）
- [ ] 8.1 `infra/lib/stacks/lambda-stack.ts` 作成
  - 10個の Lambda 関数定義（スタブ）
  - メモリ・タイムアウト設定
  - 環境変数設定

### Step 9: SES スタック
- [ ] 9.1 `infra/lib/stacks/ses-stack.ts` 作成
  - メールアドレス検証設定

### Step 10: EventBridge スタック
- [ ] 10.1 `infra/lib/stacks/eventbridge-stack.ts` 作成
  - スケジューラーグループ定義

### Step 11: Amplify スタック
- [ ] 11.1 `infra/lib/stacks/amplify-stack.ts` 作成
  - GitHub 連携設定
  - 環境変数自動注入

### Step 12: Lambda 共通コンストラクト
- [ ] 12.1 `infra/lib/constructs/lambda-function.ts` 作成

### Step 13: メインスタック統合
- [ ] 13.1 `infra/lib/day1-stack.ts` 作成（全スタックを統合）

### Step 14: Lambda スタブ実装
- [ ] 14.1 `backend/api/handlers/` 配下に各 Lambda のスタブ作成
  - user-handler.ts
  - recording-handler.ts
  - voice-handler.ts
  - template-handler.ts
  - reminder-handler.ts
  - conversation-handler.ts
  - notification-handler.ts
  - ws-connect-handler.ts
  - ws-disconnect-handler.ts
  - ws-message-handler.ts

### Step 15: ドキュメント生成
- [ ] 15.1 `aidlc-docs/construction/unit1-infra/code/code-summary.md` 作成

---

## 依存関係
- Unit 2・3・4 はこの Unit 1 の完了後に実装開始
- Lambda スタブは Unit 2・3 で実際の実装に置き換える

# Unit 1 インフラ基盤 — Code Summary

## 生成されたファイル一覧

### CDK インフラ（`infra/`）

| ファイル | 内容 |
|---|---|
| `infra/package.json` | CDK 依存関係（aws-cdk-lib ^2.251.0・@aws-cdk/aws-amplify-alpha） |
| `infra/tsconfig.json` | TypeScript 設定 |
| `infra/cdk.json` | CDK アプリ設定 |
| `infra/bin/day1.ts` | CDK エントリポイント |
| `infra/lib/day1-stack.ts` | メインスタック（全スタックを統合） |
| `infra/lib/stacks/dynamodb-stack.ts` | DynamoDB 7テーブル定義 |
| `infra/lib/stacks/s3-stack.ts` | S3 メディアバケット定義 |
| `infra/lib/stacks/cognito-stack.ts` | Cognito User Pool 定義 |
| `infra/lib/stacks/iam-stack.ts` | Lambda 実行ロール・最小権限ポリシー |
| `infra/lib/stacks/api-gateway-stack.ts` | REST API + WebSocket API スタブ |
| `infra/lib/stacks/lambda-stack.ts` | Lambda 10関数定義 |
| `infra/lib/stacks/ses-stack.ts` | SES 設定 |
| `infra/lib/stacks/eventbridge-stack.ts` | EventBridge Scheduler グループ |
| `infra/lib/stacks/amplify-stack.ts` | Amplify ホスティング（GitHub 連携） |
| `infra/lib/constructs/lambda-function.ts` | Lambda 共通コンストラクト |

### Lambda スタブ（`backend/`）

| ファイル | 担当ユニット |
|---|---|
| `backend/api/handlers/user-handler.ts` | Unit 3 で実装 |
| `backend/api/handlers/recording-handler.ts` | Unit 3 で実装 |
| `backend/api/handlers/voice-handler.ts` | Unit 2 で実装 |
| `backend/api/handlers/template-handler.ts` | Unit 3 で実装 |
| `backend/api/handlers/reminder-handler.ts` | Unit 3 で実装 |
| `backend/api/handlers/conversation-handler.ts` | Unit 2 で実装 |
| `backend/api/handlers/notification-handler.ts` | Unit 3 で実装 |
| `backend/websocket/ws-connect-handler.ts` | Unit 2 で実装 |
| `backend/websocket/ws-disconnect-handler.ts` | Unit 2 で実装 |
| `backend/websocket/ws-message-handler.ts` | Unit 2 で実装（AI パイプライン） |

## デプロイ手順

```bash
# 1. Secrets Manager にシークレットを登録（初回のみ）
aws secretsmanager create-secret --name day1/github-token --secret-string "ghp_xxx"
aws secretsmanager create-secret --name day1/elevenlabs-api-key --secret-string "sk_xxx"

# 2. CDK セットアップ
cd infra
npm install
cdk bootstrap aws://ACCOUNT_ID/ap-northeast-1

# 3. デプロイ
cdk deploy --all

# 4. SES メールアドレス検証
aws ses verify-email-identity --email-address imazato.work.aws@gmail.com
```

## 次のステップ
- Unit 2（AI 対話パイプライン）: `backend/websocket/ws-message-handler.ts` と `backend/api/handlers/voice-handler.ts` を実装
- Unit 3（記録・ユーザー管理）: `backend/api/handlers/` 配下の残りのハンドラを実装
- Unit 4（フロントエンド）: `frontend/` ディレクトリを作成して Next.js を実装

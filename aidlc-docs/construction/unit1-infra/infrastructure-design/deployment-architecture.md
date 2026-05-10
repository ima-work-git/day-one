# Unit 1 インフラ基盤 — Deployment Architecture

## デプロイ構成図

```
[開発者]
    |
    | git push → main ブランチ
    v
[GitHub: ima-work-git/day-one]
    |
    | Webhook
    v
[AWS Amplify]                    [AWS CDK]
  Next.js ビルド・デプロイ          cdk deploy
    |                                |
    v                                v
[Amplify Hosting]          [CloudFormation スタック]
  https://*.amplifyapp.com      全 AWS リソース作成
```

## AWS リソース構成図

```
ap-northeast-1（東京）
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  [Amplify Hosting]                                      │
│  Next.js フロントエンド                                   │
│       |                                                 │
│       | HTTPS                                           │
│       v                                                 │
│  [API Gateway REST]          [API Gateway WebSocket]    │
│  /users /records /voice ...  wss://...                  │
│       |                           |                     │
│       v                           v                     │
│  [Lambda 関数群]            [Lambda WS ハンドラ]         │
│  (各エンドポイント)          (connect/disconnect/msg)    │
│       |                           |                     │
│       +───────────────────────────+                     │
│                    |                                    │
│         ┌──────────┼──────────┐                         │
│         v          v          v                         │
│    [DynamoDB]    [S3]    [Cognito]                       │
│    7テーブル    メディア    認証                          │
│                                                         │
│  [SES]  [EventBridge]  [Secrets Manager]  [Bedrock]     │
│  メール   スケジューラ    APIキー管理       Nova 2 Lite   │
│                                                         │
│  [Transcribe]  [ElevenLabs API（外部）]                  │
│  STT           クローンボイス・TTS                       │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## デプロイ手順

### 初回セットアップ

```bash
# 1. Secrets Manager にシークレットを登録
aws secretsmanager create-secret \
  --name day1/github-token \
  --secret-string "ghp_xxxxxxxxxxxx"

aws secretsmanager create-secret \
  --name day1/elevenlabs-api-key \
  --secret-string "sk_xxxxxxxxxxxx"

# 2. CDK ブートストラップ（初回のみ）
cd infra
npm install
cdk bootstrap aws://ACCOUNT_ID/ap-northeast-1

# 3. CDK デプロイ
cdk deploy --all

# 4. SES メールアドレス検証（サンドボックスモード）
aws ses verify-email-identity \
  --email-address imazato.work.aws@gmail.com
```

### 通常デプロイ

```bash
cd infra
cdk deploy --all
```

### フロントエンドデプロイ
- `main` ブランチへの push で Amplify が自動ビルド・デプロイ
- CDK の `cdk deploy` で Amplify 環境変数が自動更新される

## 環境変数の流れ

```
CDK deploy
    ↓
CloudFormation が各リソースを作成
    ↓
Cognito User Pool ID・Client ID が確定
API Gateway URL が確定
S3 バケット名が確定
    ↓
Amplify Stack が環境変数として自動注入
    ↓
Next.js ビルド時に NEXT_PUBLIC_* として利用可能
```

## コスト見積もり（MVP 期間・月額）

| サービス | 想定使用量 | 月額概算 |
|---|---|---|
| Lambda | 100万リクエスト/月 | ~$0.20 |
| DynamoDB | 1GB ストレージ・100万 R/W | ~$1.00 |
| S3 | 10GB ストレージ | ~$0.23 |
| API Gateway | 100万リクエスト | ~$3.50 |
| Cognito | 〜1,000 MAU | 無料枠内 |
| SES | 1,000通/月 | ~$0.10 |
| Amplify | ビルド・ホスティング | ~$1.00 |
| Bedrock Nova 2 Lite | 100万トークン/月 | ~$0.40 |
| ElevenLabs | Starter プラン | $5.00 |
| **合計** | | **~$11/月** |

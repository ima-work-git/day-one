# Unit 1 インフラ基盤 — Infrastructure Design

## AWS サービスマッピング

| 論理コンポーネント | AWS サービス | 設定 |
|---|---|---|
| IaC | AWS CDK（TypeScript） | `infra/` ディレクトリ |
| フロントエンドホスティング | AWS Amplify | GitHub 連携・自動デプロイ |
| REST API | Amazon API Gateway（REST） | REGIONAL エンドポイント・dev ステージ |
| WebSocket API | Amazon API Gateway（WebSocket） | dev ステージ |
| バックエンド処理 | AWS Lambda（Node.js） | 各機能ごとに個別 Lambda |
| データベース | Amazon DynamoDB | オンデマンドキャパシティ・PITR 有効 |
| メディアストレージ | Amazon S3 | SSE-S3・パブリックアクセスブロック |
| 認証 | Amazon Cognito User Pool | メール認証・カスタム属性 |
| メール通知 | Amazon SES | サンドボックスモード（MVP） |
| スケジューラー | Amazon EventBridge Scheduler | リマインド実行 |
| シークレット管理 | AWS Secrets Manager | GitHub Token・ElevenLabs API Key |
| IAM | AWS IAM | Lambda 実行ロール・最小権限 |

---

## CDK スタック構成

```
infra/
├── bin/
│   └── day1.ts                    # CDK アプリエントリポイント
└── lib/
    ├── day1-stack.ts              # メインスタック（全スタックを統合）
    ├── stacks/
    │   ├── dynamodb-stack.ts      # DynamoDB テーブル定義
    │   ├── s3-stack.ts            # S3 バケット定義
    │   ├── cognito-stack.ts       # Cognito User Pool 定義
    │   ├── api-gateway-stack.ts   # API Gateway（REST + WebSocket）
    │   ├── lambda-stack.ts        # Lambda 関数定義（スタブ）
    │   ├── ses-stack.ts           # SES 設定
    │   ├── eventbridge-stack.ts   # EventBridge Scheduler
    │   ├── iam-stack.ts           # IAM ロール・ポリシー
    │   └── amplify-stack.ts       # Amplify ホスティング
    └── constructs/
        └── lambda-function.ts     # Lambda 共通コンストラクト
```

---

## DynamoDB テーブル設計

### テーブル一覧

| テーブル名 | PK | SK | GSI | PITR |
|---|---|---|---|---|
| `day1-users` | `userId` | — | — | ✅ |
| `day1-records` | `userId` | `recordId` | `organizationId-createdAt-index` | ✅ |
| `day1-voice-models` | `userId` | `voiceModelId` | — | ✅ |
| `day1-conversations` | `sessionId` | `timestamp` | `userId-timestamp-index` | ✅ |
| `day1-reminders` | `userId` | `reminderId` | — | ✅ |
| `day1-form-templates` | `templateId` | — | — | ✅ |
| `day1-organizations` | `organizationId` | — | — | ✅ |

### 共通設定
```typescript
billingMode: BillingMode.PAY_PER_REQUEST,
pointInTimeRecovery: true,
removalPolicy: RemovalPolicy.RETAIN,
encryption: TableEncryption.AWS_MANAGED,
```

---

## S3 バケット設計

### バケット: `day1-media-{accountId}-{region}`

```typescript
versioned: true,
encryption: BucketEncryption.S3_MANAGED,
blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
removalPolicy: RemovalPolicy.RETAIN,
cors: [{
  allowedOrigins: ['https://*.amplifyapp.com', 'http://localhost:3000'],
  allowedMethods: [HttpMethods.GET, HttpMethods.PUT, HttpMethods.POST, HttpMethods.DELETE],
  allowedHeaders: ['*'],
  maxAge: 3000,
}],
lifecycleRules: [{
  abortIncompleteMultipartUploadAfter: Duration.days(7),
}],
```

**ディレクトリ構造**:
```
day1-media/
├── users/{userId}/records/{recordId}/recordings/
├── users/{userId}/records/{recordId}/photos/
├── users/{userId}/records/{recordId}/videos/
└── users/{userId}/voice-models/{voiceModelId}/
```

---

## Cognito 設計

### User Pool: `day1-user-pool`

```typescript
selfSignUpEnabled: true,
signInAliases: { email: true },
passwordPolicy: {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireDigits: true,
},
mfa: Mfa.OPTIONAL,
accountRecovery: AccountRecovery.EMAIL_ONLY,
customAttributes: {
  accountType: new StringAttribute({ mutable: false }),
  organizationId: new StringAttribute({ mutable: true }),
},
```

### User Pool Client: `day1-web-client`
```typescript
authFlows: {
  userPassword: true,
  userSrp: true,
},
accessTokenValidity: Duration.hours(1),
refreshTokenValidity: Duration.days(30),
```

---

## API Gateway 設計

### REST API: `day1-rest-api`
```typescript
endpointTypes: [EndpointType.REGIONAL],
deployOptions: { stageName: 'dev' },
defaultCorsPreflightOptions: {
  allowOrigins: Cors.ALL_ORIGINS,
  allowMethods: Cors.ALL_METHODS,
},
```

**リソース（Lambda スタブ）**:
```
/users        → UserLambda
/records      → RecordingLambda
/voice        → VoiceLambda
/templates    → TemplateLambda
/reminders    → ReminderLambda
/conversations → ConversationLambda
/organizations → OrganizationLambda
```

### WebSocket API: `day1-websocket-api`
```typescript
routeSelectionExpression: '$request.body.action',
routes: {
  $connect:    ConnectLambda,
  $disconnect: DisconnectLambda,
  $default:    MessageLambda,
}
```

---

## Lambda 設計

### Lambda 関数一覧

| 関数名 | メモリ | タイムアウト | 用途 |
|---|---|---|---|
| `day1-user-lambda` | 256MB | 10秒 | ユーザー管理 |
| `day1-recording-lambda` | 256MB | 10秒 | Day 1 記録 CRUD |
| `day1-voice-lambda` | 1024MB | 30秒 | クローンボイス生成 |
| `day1-template-lambda` | 256MB | 10秒 | フォーマットテンプレート |
| `day1-reminder-lambda` | 128MB | 10秒 | リマインド管理 |
| `day1-conversation-lambda` | 512MB | 15秒 | 対話セッション |
| `day1-notification-lambda` | 128MB | 10秒 | SES メール送信 |
| `day1-ws-connect-lambda` | 256MB | 10秒 | WebSocket 接続 |
| `day1-ws-disconnect-lambda` | 256MB | 10秒 | WebSocket 切断 |
| `day1-ws-message-lambda` | 1024MB | 30秒 | AI 対話処理 |

### 共通環境変数
```typescript
environment: {
  REGION: 'ap-northeast-1',
  USERS_TABLE: dynamodbStack.usersTable.tableName,
  RECORDS_TABLE: dynamodbStack.recordsTable.tableName,
  VOICE_MODELS_TABLE: dynamodbStack.voiceModelsTable.tableName,
  CONVERSATIONS_TABLE: dynamodbStack.conversationsTable.tableName,
  REMINDERS_TABLE: dynamodbStack.remindersTable.tableName,
  TEMPLATES_TABLE: dynamodbStack.templatesTable.tableName,
  ORGANIZATIONS_TABLE: dynamodbStack.organizationsTable.tableName,
  MEDIA_BUCKET: s3Stack.mediaBucket.bucketName,
  USER_POOL_ID: cognitoStack.userPool.userPoolId,
  ELEVENLABS_API_KEY_SECRET: 'day1/elevenlabs-api-key',
}
```

---

## IAM ロール設計

### Lambda 実行ロール: `day1-lambda-role`

```typescript
// DynamoDB
dynamodbStack.allTables.forEach(table => {
  table.grantReadWriteData(lambdaRole);
});

// S3
s3Stack.mediaBucket.grantReadWrite(lambdaRole);

// Cognito
lambdaRole.addToPolicy(new PolicyStatement({
  actions: ['cognito-idp:*'],
  resources: [cognitoStack.userPool.userPoolArn],
}));

// SES
lambdaRole.addToPolicy(new PolicyStatement({
  actions: ['ses:SendEmail', 'ses:SendRawEmail'],
  resources: ['*'],
}));

// Bedrock（クロスリージョン推論 - Nova 2 Lite は us.amazon.nova-lite-v2:0 プロファイル経由）
lambdaRole.addToPolicy(new PolicyStatement({
  actions: ['bedrock:InvokeModel', 'bedrock:InvokeModelWithResponseStream'],
  resources: [
    // クロスリージョン推論プロファイル（ap-northeast-1 から US リージョンの Nova 2 Lite を利用）
    'arn:aws:bedrock:ap-northeast-1:*:inference-profile/us.amazon.nova-lite-v2:0',
  ],
}));

// Transcribe
lambdaRole.addToPolicy(new PolicyStatement({
  actions: ['transcribe:StartStreamTranscription'],
  resources: ['*'],
}));

// Secrets Manager
lambdaRole.addToPolicy(new PolicyStatement({
  actions: ['secretsmanager:GetSecretValue'],
  resources: ['arn:aws:secretsmanager:ap-northeast-1:*:secret:day1/*'],
}));

// EventBridge
lambdaRole.addToPolicy(new PolicyStatement({
  actions: ['scheduler:CreateSchedule', 'scheduler:DeleteSchedule', 'scheduler:UpdateSchedule'],
  resources: ['*'],
}));
```

---

## Amplify 設計

```typescript
const amplifyApp = new amplify.App(this, 'Day1App', {
  sourceCodeProvider: new amplify.GitHubSourceCodeProvider({
    owner: 'ima-work-git',
    repository: 'day-one',
    oauthToken: SecretValue.secretsManager('day1/github-token'),
  }),
  // 注意: GitHub 連携には @aws-cdk/aws-amplify-alpha パッケージが必要
  // npm install @aws-cdk/aws-amplify-alpha
  environmentVariables: {
    NEXT_PUBLIC_REGION: 'ap-northeast-1',
    NEXT_PUBLIC_USER_POOL_ID: cognitoStack.userPool.userPoolId,
    NEXT_PUBLIC_USER_POOL_CLIENT_ID: cognitoStack.userPoolClient.userPoolClientId,
    NEXT_PUBLIC_REST_API_URL: apiGatewayStack.restApi.url,
    NEXT_PUBLIC_WS_API_URL: apiGatewayStack.webSocketApi.apiEndpoint,
    NEXT_PUBLIC_MEDIA_BUCKET: s3Stack.mediaBucket.bucketName,
  },
});
amplifyApp.addBranch('main');
```

---

## Secrets Manager 設計

| シークレット名 | 内容 | 用途 |
|---|---|---|
| `day1/github-token` | GitHub Personal Access Token | Amplify CDK 連携 |
| `day1/elevenlabs-api-key` | ElevenLabs API Key | クローンボイス生成・TTS |

**事前準備コマンド**:
```bash
aws secretsmanager create-secret \
  --name day1/github-token \
  --secret-string "ghp_xxxxxxxxxxxx"

aws secretsmanager create-secret \
  --name day1/elevenlabs-api-key \
  --secret-string "sk_xxxxxxxxxxxx"
```

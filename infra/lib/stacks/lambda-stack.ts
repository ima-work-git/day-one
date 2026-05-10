import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { Construct } from 'constructs';
import { Day1Lambda } from '../constructs/lambda-function';

interface LambdaStackProps extends cdk.NestedStackProps {
  lambdaRole: iam.Role;
  allTables: dynamodb.Table[];
  mediaBucket: s3.Bucket;
  userPool: cognito.UserPool;
  userPoolClient: cognito.UserPoolClient;
}

export class LambdaStack extends cdk.NestedStack {
  public readonly userLambda: lambda.Function;
  public readonly recordingLambda: lambda.Function;
  public readonly voiceLambda: lambda.Function;
  public readonly templateLambda: lambda.Function;
  public readonly reminderLambda: lambda.Function;
  public readonly conversationLambda: lambda.Function;
  public readonly notificationLambda: lambda.Function;
  public readonly wsConnectLambda: lambda.Function;
  public readonly wsDisconnectLambda: lambda.Function;
  public readonly wsMessageLambda: lambda.Function;

  constructor(scope: Construct, id: string, props: LambdaStackProps) {
    super(scope, id, props);

    const [
      usersTable, recordsTable, voiceModelsTable, conversationsTable,
      remindersTable, formTemplatesTable, organizationsTable,
    ] = props.allTables;

    // 共通環境変数
    const commonEnv = {
      REGION: 'ap-northeast-1',
      USERS_TABLE: usersTable.tableName,
      RECORDS_TABLE: recordsTable.tableName,
      VOICE_MODELS_TABLE: voiceModelsTable.tableName,
      CONVERSATIONS_TABLE: conversationsTable.tableName,
      REMINDERS_TABLE: remindersTable.tableName,
      TEMPLATES_TABLE: formTemplatesTable.tableName,
      ORGANIZATIONS_TABLE: organizationsTable.tableName,
      MEDIA_BUCKET: props.mediaBucket.bucketName,
      USER_POOL_ID: props.userPool.userPoolId,
      USER_POOL_CLIENT_ID: props.userPoolClient.userPoolClientId,
      ELEVENLABS_API_KEY_SECRET: 'day1/elevenlabs-api-key',
      BEDROCK_INFERENCE_PROFILE: `arn:aws:bedrock:ap-northeast-1:${cdk.Aws.ACCOUNT_ID}:inference-profile/us.amazon.nova-lite-v2:0`,
    };

    // ユーザー管理 Lambda
    this.userLambda = new Day1Lambda(this, 'UserLambda', {
      functionName: 'day1-user-lambda',
      handler: 'user-handler.handler',
      codePath: '../backend/api/handlers',
      role: props.lambdaRole,
      memorySize: 256,
      timeout: cdk.Duration.seconds(10),
      environment: commonEnv,
      description: 'Day 1 User Management Lambda',
    }).function;

    // Day 1 記録 CRUD Lambda
    this.recordingLambda = new Day1Lambda(this, 'RecordingLambda', {
      functionName: 'day1-recording-lambda',
      handler: 'recording-handler.handler',
      codePath: '../backend/api/handlers',
      role: props.lambdaRole,
      memorySize: 256,
      timeout: cdk.Duration.seconds(10),
      environment: commonEnv,
      description: 'Day 1 Recording CRUD Lambda',
    }).function;

    // クローンボイス生成 Lambda（ElevenLabs 呼び出し）
    this.voiceLambda = new Day1Lambda(this, 'VoiceLambda', {
      functionName: 'day1-voice-lambda',
      handler: 'voice-handler.handler',
      codePath: '../backend/api/handlers',
      role: props.lambdaRole,
      memorySize: 1024,
      timeout: cdk.Duration.seconds(30),
      environment: commonEnv,
      description: 'Day 1 Voice Cloning Lambda',
    }).function;

    // フォーマットテンプレート Lambda
    this.templateLambda = new Day1Lambda(this, 'TemplateLambda', {
      functionName: 'day1-template-lambda',
      handler: 'template-handler.handler',
      codePath: '../backend/api/handlers',
      role: props.lambdaRole,
      memorySize: 256,
      timeout: cdk.Duration.seconds(10),
      environment: commonEnv,
      description: 'Day 1 Form Template Lambda',
    }).function;

    // リマインド管理 Lambda
    this.reminderLambda = new Day1Lambda(this, 'ReminderLambda', {
      functionName: 'day1-reminder-lambda',
      handler: 'reminder-handler.handler',
      codePath: '../backend/api/handlers',
      role: props.lambdaRole,
      memorySize: 128,
      timeout: cdk.Duration.seconds(10),
      environment: commonEnv,
      description: 'Day 1 Reminder Management Lambda',
    }).function;

    // 対話セッション Lambda
    this.conversationLambda = new Day1Lambda(this, 'ConversationLambda', {
      functionName: 'day1-conversation-lambda',
      handler: 'conversation-handler.handler',
      codePath: '../backend/api/handlers',
      role: props.lambdaRole,
      memorySize: 512,
      timeout: cdk.Duration.seconds(15),
      environment: commonEnv,
      description: 'Day 1 Conversation Session Lambda',
    }).function;

    // 通知 Lambda（SES メール送信）
    this.notificationLambda = new Day1Lambda(this, 'NotificationLambda', {
      functionName: 'day1-notification-lambda',
      handler: 'notification-handler.handler',
      codePath: '../backend/api/handlers',
      role: props.lambdaRole,
      memorySize: 128,
      timeout: cdk.Duration.seconds(10),
      environment: {
        ...commonEnv,
        SES_FROM_EMAIL: 'imazato.work.aws@gmail.com',
      },
      description: 'Day 1 Notification Lambda (SES)',
    }).function;

    // WebSocket 接続 Lambda
    this.wsConnectLambda = new Day1Lambda(this, 'WsConnectLambda', {
      functionName: 'day1-ws-connect-lambda',
      handler: 'ws-connect-handler.handler',
      codePath: '../backend/websocket',
      role: props.lambdaRole,
      memorySize: 256,
      timeout: cdk.Duration.seconds(10),
      environment: commonEnv,
      description: 'Day 1 WebSocket Connect Lambda',
    }).function;

    // WebSocket 切断 Lambda
    this.wsDisconnectLambda = new Day1Lambda(this, 'WsDisconnectLambda', {
      functionName: 'day1-ws-disconnect-lambda',
      handler: 'ws-disconnect-handler.handler',
      codePath: '../backend/websocket',
      role: props.lambdaRole,
      memorySize: 256,
      timeout: cdk.Duration.seconds(10),
      environment: commonEnv,
      description: 'Day 1 WebSocket Disconnect Lambda',
    }).function;

    // WebSocket メッセージ Lambda（AI 対話処理）
    this.wsMessageLambda = new Day1Lambda(this, 'WsMessageLambda', {
      functionName: 'day1-ws-message-lambda',
      handler: 'ws-message-handler.handler',
      codePath: '../backend/websocket',
      role: props.lambdaRole,
      memorySize: 1024,
      timeout: cdk.Duration.seconds(30),
      environment: commonEnv,
      description: 'Day 1 WebSocket Message Lambda (AI Pipeline)',
    }).function;
  }
}

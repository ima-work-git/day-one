import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { Construct } from 'constructs';

interface IamStackProps extends cdk.NestedStackProps {
  allTables: dynamodb.Table[];
  mediaBucket: s3.Bucket;
  userPool: cognito.UserPool;
}

export class IamStack extends cdk.NestedStack {
  public readonly lambdaRole: iam.Role;

  constructor(scope: Construct, id: string, props: IamStackProps) {
    super(scope, id, props);

    this.lambdaRole = new iam.Role(this, 'LambdaRole', {
      roleName: 'day1-lambda-role',
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
    });

    // DynamoDB: 全テーブルへの CRUD
    props.allTables.forEach(table => {
      table.grantReadWriteData(this.lambdaRole);
    });

    // S3: メディアバケットへの読み書き
    props.mediaBucket.grantReadWrite(this.lambdaRole);

    // Cognito: ユーザー管理 API
    this.lambdaRole.addToPolicy(new iam.PolicyStatement({
      actions: [
        'cognito-idp:AdminCreateUser',
        'cognito-idp:AdminGetUser',
        'cognito-idp:AdminUpdateUserAttributes',
        'cognito-idp:AdminDeleteUser',
        'cognito-idp:ListUsers',
        'cognito-idp:AdminSetUserPassword',
        'cognito-idp:AdminConfirmSignUp',
      ],
      resources: [props.userPool.userPoolArn],
    }));

    // SES: メール送信
    this.lambdaRole.addToPolicy(new iam.PolicyStatement({
      actions: ['ses:SendEmail', 'ses:SendRawEmail'],
      resources: ['*'],
    }));

    // Bedrock: Nova 2 Lite クロスリージョン推論プロファイル経由
    this.lambdaRole.addToPolicy(new iam.PolicyStatement({
      actions: ['bedrock:InvokeModel', 'bedrock:InvokeModelWithResponseStream'],
      resources: [
        `arn:aws:bedrock:ap-northeast-1:${cdk.Aws.ACCOUNT_ID}:inference-profile/us.amazon.nova-lite-v2:0`,
      ],
    }));

    // Transcribe: ストリーミング音声認識
    this.lambdaRole.addToPolicy(new iam.PolicyStatement({
      actions: ['transcribe:StartStreamTranscription'],
      resources: ['*'],
    }));

    // Secrets Manager: APIキー取得
    this.lambdaRole.addToPolicy(new iam.PolicyStatement({
      actions: ['secretsmanager:GetSecretValue'],
      resources: [`arn:aws:secretsmanager:ap-northeast-1:${cdk.Aws.ACCOUNT_ID}:secret:day1/*`],
    }));

    // EventBridge Scheduler: リマインドスケジュール管理
    this.lambdaRole.addToPolicy(new iam.PolicyStatement({
      actions: [
        'scheduler:CreateSchedule',
        'scheduler:DeleteSchedule',
        'scheduler:UpdateSchedule',
        'scheduler:GetSchedule',
        'iam:PassRole',
      ],
      resources: ['*'],
    }));

    // API Gateway WebSocket: クライアントへの送信
    this.lambdaRole.addToPolicy(new iam.PolicyStatement({
      actions: ['execute-api:ManageConnections'],
      resources: ['*'],
    }));
  }
}

import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { DynamoDbStack } from './stacks/dynamodb-stack';
import { S3Stack } from './stacks/s3-stack';
import { CognitoStack } from './stacks/cognito-stack';
import { IamStack } from './stacks/iam-stack';
import { ApiGatewayStack } from './stacks/api-gateway-stack';
import { LambdaStack } from './stacks/lambda-stack';
import { SesStack } from './stacks/ses-stack';
import { EventBridgeStack } from './stacks/eventbridge-stack';
import { AmplifyStack } from './stacks/amplify-stack';

export class Day1Stack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // 1. DynamoDB テーブル
    const dynamoDb = new DynamoDbStack(this, 'DynamoDb');

    // 2. S3 バケット
    const s3 = new S3Stack(this, 'S3');

    // 3. Cognito User Pool
    const cognito = new CognitoStack(this, 'Cognito');

    // 4. IAM ロール（DynamoDB・S3・Cognito に依存）
    const iam = new IamStack(this, 'Iam', {
      allTables: dynamoDb.allTables,
      mediaBucket: s3.mediaBucket,
      userPool: cognito.userPool,
    });

    // 5. API Gateway（Cognito に依存）
    const apiGateway = new ApiGatewayStack(this, 'ApiGateway', {
      userPool: cognito.userPool,
    });

    // 6. Lambda 関数（IAM・DynamoDB・S3・Cognito に依存）
    const lambdas = new LambdaStack(this, 'Lambda', {
      lambdaRole: iam.lambdaRole,
      allTables: dynamoDb.allTables,
      mediaBucket: s3.mediaBucket,
      userPool: cognito.userPool,
      userPoolClient: cognito.userPoolClient,
    });

    // 7. SES 設定
    new SesStack(this, 'Ses');

    // 8. EventBridge Scheduler（Lambda に依存）
    new EventBridgeStack(this, 'EventBridge', {
      notificationLambda: lambdas.notificationLambda,
    });

    // 9. Amplify ホスティング（Cognito・API Gateway に依存）
    new AmplifyStack(this, 'Amplify', {
      userPool: cognito.userPool,
      userPoolClient: cognito.userPoolClient,
      restApiUrl: apiGateway.restApiUrl,
      webSocketApiUrl: apiGateway.webSocketApiUrl,
      mediaBucketName: s3.mediaBucket.bucketName,
    });

    // スタック出力
    new cdk.CfnOutput(this, 'UserPoolId', {
      value: cognito.userPool.userPoolId,
      description: 'Cognito User Pool ID',
    });
    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: cognito.userPoolClient.userPoolClientId,
      description: 'Cognito User Pool Client ID',
    });
    new cdk.CfnOutput(this, 'MediaBucketName', {
      value: s3.mediaBucket.bucketName,
      description: 'S3 Media Bucket Name',
    });
  }
}

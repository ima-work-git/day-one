import * as cdk from 'aws-cdk-lib';
import * as amplify from '@aws-cdk/aws-amplify-alpha';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { Construct } from 'constructs';

interface AmplifyStackProps extends cdk.NestedStackProps {
  userPool: cognito.UserPool;
  userPoolClient: cognito.UserPoolClient;
  restApiUrl: string;
  webSocketApiUrl: string;
  mediaBucketName: string;
}

export class AmplifyStack extends cdk.NestedStack {
  constructor(scope: Construct, id: string, props: AmplifyStackProps) {
    super(scope, id, props);

    const amplifyApp = new amplify.App(this, 'Day1App', {
      appName: 'day1',
      sourceCodeProvider: new amplify.GitHubSourceCodeProvider({
        owner: 'ima-work-git',
        repository: 'day-one',
        oauthToken: cdk.SecretValue.secretsManager('day1/github-token'),
      }),
      environmentVariables: {
        NEXT_PUBLIC_REGION: 'ap-northeast-1',
        NEXT_PUBLIC_USER_POOL_ID: props.userPool.userPoolId,
        NEXT_PUBLIC_USER_POOL_CLIENT_ID: props.userPoolClient.userPoolClientId,
        NEXT_PUBLIC_REST_API_URL: props.restApiUrl,
        NEXT_PUBLIC_WS_API_URL: props.webSocketApiUrl,
        NEXT_PUBLIC_MEDIA_BUCKET: props.mediaBucketName,
      },
      buildSpec: cdk.aws_codebuild.BuildSpec.fromObjectToYaml({
        version: '1.0',
        frontend: {
          phases: {
            preBuild: {
              commands: ['cd frontend', 'npm ci'],
            },
            build: {
              commands: ['npm run build'],
            },
          },
          artifacts: {
            baseDirectory: 'frontend/.next',
            files: ['**/*'],
          },
          cache: {
            paths: ['frontend/node_modules/**/*'],
          },
        },
      }),
    });

    amplifyApp.addBranch('main', {
      autoBuild: true,
      stage: 'PRODUCTION',
    });

    new cdk.CfnOutput(this, 'AmplifyAppId', {
      value: amplifyApp.appId,
      exportName: 'Day1AmplifyAppId',
    });
  }
}

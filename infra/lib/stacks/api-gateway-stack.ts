import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as apigatewayv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { Construct } from 'constructs';

interface ApiGatewayStackProps extends cdk.NestedStackProps {
  userPool: cognito.UserPool;
}

export class ApiGatewayStack extends cdk.NestedStack {
  public readonly restApi: apigateway.RestApi;
  public readonly webSocketApi: apigatewayv2.CfnApi;
  public readonly restApiUrl: string;
  public readonly webSocketApiUrl: string;

  constructor(scope: Construct, id: string, props: ApiGatewayStackProps) {
    super(scope, id, props);

    // REST API
    this.restApi = new apigateway.RestApi(this, 'RestApi', {
      restApiName: 'day1-rest-api',
      description: 'Day 1 REST API',
      endpointTypes: [apigateway.EndpointType.REGIONAL],
      deployOptions: {
        stageName: 'dev',
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: false,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization', 'X-Amz-Date', 'X-Api-Key'],
      },
    });

    // Cognito Authorizer
    const authorizer = new apigateway.CognitoUserPoolsAuthorizer(this, 'CognitoAuthorizer', {
      cognitoUserPools: [props.userPool],
      authorizerName: 'day1-cognito-authorizer',
    });

    // REST API リソース（スタブ - Lambda は Unit 2/3 で実装）
    const resources = [
      'users', 'records', 'voice', 'templates',
      'reminders', 'conversations', 'organizations',
    ];
    resources.forEach(resourceName => {
      this.restApi.root.addResource(resourceName);
    });

    this.restApiUrl = this.restApi.url;

    // WebSocket API（スタブ - Lambda は Unit 2 で実装）
    this.webSocketApi = new apigatewayv2.CfnApi(this, 'WebSocketApi', {
      name: 'day1-websocket-api',
      protocolType: 'WEBSOCKET',
      routeSelectionExpression: '$request.body.action',
    });

    // WebSocket ステージ
    const webSocketStage = new apigatewayv2.CfnStage(this, 'WebSocketStage', {
      apiId: this.webSocketApi.ref,
      stageName: 'dev',
      autoDeploy: true,
    });

    this.webSocketApiUrl = `wss://${this.webSocketApi.ref}.execute-api.ap-northeast-1.amazonaws.com/dev`;

    // CloudFormation 出力
    new cdk.CfnOutput(this, 'RestApiUrl', {
      value: this.restApiUrl,
      exportName: 'Day1RestApiUrl',
    });
    new cdk.CfnOutput(this, 'WebSocketApiUrl', {
      value: this.webSocketApiUrl,
      exportName: 'Day1WebSocketApiUrl',
    });
  }
}

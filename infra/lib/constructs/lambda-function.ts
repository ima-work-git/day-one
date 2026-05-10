import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export interface Day1LambdaProps {
  functionName: string;
  handler: string;
  codePath: string;
  role: iam.IRole;
  memorySize?: number;
  timeout?: cdk.Duration;
  environment?: { [key: string]: string };
  description?: string;
}

export class Day1Lambda extends Construct {
  public readonly function: lambda.Function;

  constructor(scope: Construct, id: string, props: Day1LambdaProps) {
    super(scope, id);

    this.function = new lambda.Function(this, 'Function', {
      functionName: props.functionName,
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: props.handler,
      code: lambda.Code.fromAsset(props.codePath),
      role: props.role,
      memorySize: props.memorySize ?? 256,
      timeout: props.timeout ?? cdk.Duration.seconds(10),
      environment: props.environment ?? {},
      description: props.description,
      tracing: lambda.Tracing.ACTIVE,
    });
  }
}

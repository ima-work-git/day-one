import * as cdk from 'aws-cdk-lib';
import * as ses from 'aws-cdk-lib/aws-ses';
import { Construct } from 'constructs';

export class SesStack extends cdk.NestedStack {
  constructor(scope: Construct, id: string, props?: cdk.NestedStackProps) {
    super(scope, id, props);

    // 検証済みメールアドレス（サンドボックスモード）
    // 注意: CDK では SES メールアドレス検証を直接管理できないため、
    // デプロイ後に以下のコマンドで手動検証が必要:
    // aws ses verify-email-identity --email-address imazato.work.aws@gmail.com
    //
    // 本番移行時はサンドボックス解除申請が必要

    new cdk.CfnOutput(this, 'SesSetupNote', {
      value: 'Run: aws ses verify-email-identity --email-address imazato.work.aws@gmail.com',
      description: 'SES email verification command (run after deploy)',
    });
  }
}

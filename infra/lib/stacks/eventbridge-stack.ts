import * as cdk from 'aws-cdk-lib';
import * as scheduler from 'aws-cdk-lib/aws-scheduler';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';

interface EventBridgeStackProps extends cdk.NestedStackProps {
  notificationLambda: lambda.Function;
}

export class EventBridgeStack extends cdk.NestedStack {
  public readonly schedulerRole: iam.Role;

  constructor(scope: Construct, id: string, props: EventBridgeStackProps) {
    super(scope, id, props);

    // スケジューラーグループ
    new scheduler.CfnScheduleGroup(this, 'RemindersScheduleGroup', {
      name: 'day1-reminders',
    });

    // EventBridge Scheduler が Lambda を呼び出すための IAM ロール
    this.schedulerRole = new iam.Role(this, 'SchedulerRole', {
      roleName: 'day1-scheduler-role',
      assumedBy: new iam.ServicePrincipal('scheduler.amazonaws.com'),
    });

    props.notificationLambda.grantInvoke(this.schedulerRole);

    new cdk.CfnOutput(this, 'SchedulerGroupName', {
      value: 'day1-reminders',
      exportName: 'Day1SchedulerGroupName',
    });
  }
}

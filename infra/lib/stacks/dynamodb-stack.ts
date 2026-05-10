import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

export class DynamoDbStack extends cdk.NestedStack {
  public readonly usersTable: dynamodb.Table;
  public readonly recordsTable: dynamodb.Table;
  public readonly voiceModelsTable: dynamodb.Table;
  public readonly conversationsTable: dynamodb.Table;
  public readonly remindersTable: dynamodb.Table;
  public readonly formTemplatesTable: dynamodb.Table;
  public readonly organizationsTable: dynamodb.Table;
  public readonly allTables: dynamodb.Table[];

  constructor(scope: Construct, id: string, props?: cdk.NestedStackProps) {
    super(scope, id, props);

    const commonProps: Partial<dynamodb.TableProps> = {
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
    };

    // Users テーブル
    this.usersTable = new dynamodb.Table(this, 'UsersTable', {
      ...commonProps,
      tableName: 'day1-users',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
    });

    // DayOneRecords テーブル
    this.recordsTable = new dynamodb.Table(this, 'RecordsTable', {
      ...commonProps,
      tableName: 'day1-records',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'recordId', type: dynamodb.AttributeType.STRING },
    });
    // GSI: 企業単位での記録一覧取得
    this.recordsTable.addGlobalSecondaryIndex({
      indexName: 'organizationId-createdAt-index',
      partitionKey: { name: 'organizationId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // VoiceModels テーブル
    this.voiceModelsTable = new dynamodb.Table(this, 'VoiceModelsTable', {
      ...commonProps,
      tableName: 'day1-voice-models',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'voiceModelId', type: dynamodb.AttributeType.STRING },
    });

    // ConversationSessions テーブル
    this.conversationsTable = new dynamodb.Table(this, 'ConversationsTable', {
      ...commonProps,
      tableName: 'day1-conversations',
      partitionKey: { name: 'sessionId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.STRING },
    });
    // GSI: ユーザー別の対話履歴取得
    this.conversationsTable.addGlobalSecondaryIndex({
      indexName: 'userId-timestamp-index',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // RemindSchedules テーブル
    this.remindersTable = new dynamodb.Table(this, 'RemindersTable', {
      ...commonProps,
      tableName: 'day1-reminders',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'reminderId', type: dynamodb.AttributeType.STRING },
    });

    // FormTemplates テーブル
    this.formTemplatesTable = new dynamodb.Table(this, 'FormTemplatesTable', {
      ...commonProps,
      tableName: 'day1-form-templates',
      partitionKey: { name: 'templateId', type: dynamodb.AttributeType.STRING },
    });

    // Organizations テーブル
    this.organizationsTable = new dynamodb.Table(this, 'OrganizationsTable', {
      ...commonProps,
      tableName: 'day1-organizations',
      partitionKey: { name: 'organizationId', type: dynamodb.AttributeType.STRING },
    });

    this.allTables = [
      this.usersTable,
      this.recordsTable,
      this.voiceModelsTable,
      this.conversationsTable,
      this.remindersTable,
      this.formTemplatesTable,
      this.organizationsTable,
    ];
  }
}

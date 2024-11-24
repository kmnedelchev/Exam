import * as cdk from 'aws-cdk-lib';
import { AttributeType, BillingMode, StreamViewType, Table } from 'aws-cdk-lib/aws-dynamodb';
import { FilterCriteria, FilterRule, Runtime, StartingPosition } from 'aws-cdk-lib/aws-lambda';
import { DynamoEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Bucket, EventType } from 'aws-cdk-lib/aws-s3';
import { LambdaDestination } from 'aws-cdk-lib/aws-s3-notifications';
import { Subscription, SubscriptionProtocol, Topic } from 'aws-cdk-lib/aws-sns';
import { Construct } from 'constructs';

export class ExamStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // S3 Bucket
    const ExamBucket = new Bucket(this, 'ExamBucket', {
      autoDeleteObjects: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });
    
    // SNS Topic
    const ExamErrorTopic = new Topic(this, 'ExamErrorTopic', {
      topicName: 'ExamErrorTopic'
    });

    new Subscription(this, 'ExamErrorSubscription', {
      topic: ExamErrorTopic,
      protocol: SubscriptionProtocol.EMAIL,
      endpoint: 'km.nedelchev@gmail.com'
    });

    //hristo.zhelev@yahoo.com

    // DynamoDB Table
    const ExamErrorTable = new Table(this, 'ExamErrorTable', {
      partitionKey: {
      name: 'id',
      type: AttributeType.STRING
    },
      billingMode: BillingMode.PAY_PER_REQUEST,
      timeToLiveAttribute: 'ttl',
      stream: StreamViewType.NEW_AND_OLD_IMAGES,
    });

    // Lambdas
    const ExamOnUploadFunction = new NodejsFunction(this, 'ExamOnUploadFunction', {
      runtime: Runtime.NODEJS_20_X,
      handler: 'handler',
      entry: `${__dirname}/../src/ExamOnUploadFunction.ts`,
      environment: {
        TABLE_NAME: ExamErrorTable.tableName,
        TOPIC_ARN: ExamErrorTopic.topicArn,
      }
    });

    const ExamCleanupFunction = new NodejsFunction(this, 'ExamCleanupFunction', {
      runtime: Runtime.NODEJS_20_X,
      handler: 'handler',
      entry: `${__dirname}/../src/ExamCleanupFunction.ts`,
      environment: {
        TABLE_NAME: ExamErrorTable.tableName,
        TOPIC_ARN: ExamErrorTopic.topicArn
      }
    });

    // Permissions:
    ExamBucket.grantRead(ExamOnUploadFunction);
    ExamErrorTopic.grantPublish(ExamOnUploadFunction);
    ExamErrorTable.grantReadWriteData(ExamOnUploadFunction);
    ExamErrorTopic.grantPublish(ExamCleanupFunction);
    ExamErrorTable.grantReadWriteData(ExamCleanupFunction);

    // Trigger for cleanup
    // ExamCleanupFunction.addEventSource(new DynamoEventSource(ExamErrorTable, {
    //   startingPosition: StartingPosition.LATEST,
    //   batchSize: 5,
    //   filters: [
    //     FilterCriteria.filter({
    //       eventName: FilterRule.isEqual('REMOVE'),
    //     })
    //   ]
    // }));

    ExamCleanupFunction.addEventSource(new DynamoEventSource(ExamErrorTable, {
      startingPosition: StartingPosition.LATEST,
      batchSize: 5,
      filters: [
        FilterCriteria.filter({
          eventName: FilterRule.isEqual('INSERT'),
        })
      ]
    }));

    // Event that triggers the ExamOnUploadFunction function (Read S3 data function)
    ExamBucket.addEventNotification(EventType.OBJECT_CREATED,
      new LambdaDestination(ExamOnUploadFunction)
    );
  }
}




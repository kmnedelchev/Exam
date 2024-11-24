import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import * as Exam from '../lib/exam-stack';
import 'jest-cdk-snapshot';

test('SnapShot', () => {
  const app = new cdk.App();
    // WHEN
  const stack = new Exam.ExamStack(app, 'MyTestStack');
    // THEN
  const template = Template.fromStack(stack);

  expect(stack).toMatchCdkSnapshot();
//   template.hasResourceProperties('AWS::SQS::Queue', {
//     VisibilityTimeout: 300
//   });
});

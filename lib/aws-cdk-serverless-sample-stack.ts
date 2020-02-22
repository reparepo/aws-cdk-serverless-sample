import * as lambda from '@aws-cdk/aws-lambda';
import * as apigateway from '@aws-cdk/aws-apigateway';
import * as cdk from '@aws-cdk/core';

export class AwsCdkServerlessSampleStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    const handler = new lambda.Function(this, 'MyFunc', {
      runtime: lambda.Runtime.PYTHON_3_7,
      handler: 'index.handler',
      code: new lambda.InlineCode(`
import json
def handler(event, context):
      return {
        'statusCode': 200,
        'body': json.dumps('Hello CDK from Lambda!')
      }`),
    });

    new apigateway.LambdaRestApi(this, 'API', { handler })
  }
}
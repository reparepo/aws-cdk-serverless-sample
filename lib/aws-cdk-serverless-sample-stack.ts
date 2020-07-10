import * as lambda from '@aws-cdk/aws-lambda';
import * as apig from '@aws-cdk/aws-apigatewayv2';
import * as cdk from '@aws-cdk/core';
import * as codepipeline_actions from '@aws-cdk/aws-codepipeline-actions'
import * as codepipeline from '@aws-cdk/aws-codepipeline';
import { SimpleSynthAction, CdkPipeline } from '@aws-cdk/pipelines';

const env = {
  region: process.env.CDK_DEFAULT_REGION,
  account: process.env.CDK_DEFAULT_ACCOUNT,
};

const REGIONS_TO_DEPLOY = [
  'ap-northeast-1',
  'us-east-1',
  'us-west-2',
]

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

    const api = new apig.HttpApi(this, 'Api', {
      defaultIntegration: new apig.LambdaProxyIntegration({
        handler
      })
    })

    new cdk.CfnOutput(this, 'ApiURL', { value: api.url! })
  }
}


/**
 * Your application
 *
 * May consist of one or more Stacks
 */
class MyApplication extends cdk.Stage {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StageProps) {
    super(scope, id, props);

    new AwsCdkServerlessSampleStack(this, 'AwsCdkServerlessSampleStack');
  }
}

/**
 * stack to hold the pipeline
 */
export class MyPipelineStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const sourceArtifact = new codepipeline.Artifact();
    const cloudAssemblyArtifact = new codepipeline.Artifact();

    const pipeline = new CdkPipeline(this, 'Pipeline', {
      pipelineName: 'MyAppPipeline',
      cloudAssemblyArtifact,


      sourceAction: new codepipeline_actions.GitHubSourceAction({
        actionName: 'GitHub',
        output: sourceArtifact,
        oauthToken: cdk.SecretValue.secretsManager('my-github-token', { jsonField: 'token' }),
        trigger: codepipeline_actions.GitHubTrigger.POLL,
        // Replace these with your actual GitHub project name
        owner: 'pahud',
        repo: 'aws-cdk-serverless-sample',
      }),

      synthAction: SimpleSynthAction.standardNpmSynth({
        sourceArtifact,
        cloudAssemblyArtifact,
        installCommand: 'npm ci',
        synthCommand: 'npx cdk synth',
      }),
    });

    parallelDeployments(this, 'Deploy', 
      REGIONS_TO_DEPLOY.map(region => {
        return new MyApplication(this, `Deploy-${region}`, {
          env: {
            account: process.env.CDK_DEFAULT_ACCOUNT,
            region,
          }
        })
      })
    )
    // parallelDeployments(this, 'Deploy', [
    //   new MyApplication(this, 'Deploy-ap-northeast-1', {
    //       env: {
    //         account: process.env.CDK_DEFAULT_ACCOUNT,
    //         region: 'ap-northeast-1',
    //       }
    //     })
    // ])

    function parallelDeployments(scope: cdk.Construct, id: string, appStages: cdk.Stage[]) {
      const deployStage = pipeline.addStage(id);
      for (const stage of appStages) {
          const asm = stage.synth()
          for (const stack of asm.stacks) {
            deployStage.addStackArtifactDeployment(stack, { runOrder: 1 })
          }
      }
    }
  }
}

import * as codepipeline from '@aws-cdk/aws-codepipeline';
import * as codepipeline_actions from '@aws-cdk/aws-codepipeline-actions';
import * as cdk from '@aws-cdk/core';
import { SimpleSynthAction, CdkPipeline } from '@aws-cdk/pipelines';
import { MyStack } from './main';

const env = {
  region: process.env.CDK_DEFAULT_REGION,
  account: process.env.CDK_DEFAULT_ACCOUNT,
};

const REGIONS_TO_DEPLOY = [
  'ap-northeast-1',
  'us-east-1',
  'us-west-2',
];

/**
 * Your application
 *
 * May consist of one or more Stacks
 */
class MyApplication extends cdk.Stage {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StageProps) {
    super(scope, id, props);

    new MyStack(this, 'AwsCdkServerlessSampleStack', { env });
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

    parallelDeployments(
      REGIONS_TO_DEPLOY.map(region => {
        return new MyApplication(this, `Deploy-${region}`, {
          env: {
            account: process.env.CDK_DEFAULT_ACCOUNT,
            region,
          },
        });
      }),
    );

    function parallelDeployments(appStages: cdk.Stage[]) {
      const deployStage = pipeline.addStage(id);
      for (const stage of appStages) {
        const asm = stage.synth();
        for (const stack of asm.stacks) {
          deployStage.addStackArtifactDeployment(stack, { runOrder: 1 });
        }
      }
    }
  }
}

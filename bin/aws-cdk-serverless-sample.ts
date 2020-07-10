#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { AwsCdkServerlessSampleStack, MyPipelineStack } from '../lib';

const app = new cdk.App();

const env = {
  region: process.env.CDK_DEFAULT_REGION,
  account: process.env.CDK_DEFAULT_ACCOUNT,
};

new AwsCdkServerlessSampleStack(app, 'AwsCdkServerlessSampleStack', { env });
new MyPipelineStack(app, 'PipelineStack', { env });


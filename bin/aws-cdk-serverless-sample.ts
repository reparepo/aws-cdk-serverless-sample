#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { AwsCdkServerlessSampleStack } from '../lib/aws-cdk-serverless-sample-stack';

const app = new cdk.App();
new AwsCdkServerlessSampleStack(app, 'AwsCdkServerlessSampleStack');

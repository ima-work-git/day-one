#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { Day1Stack } from '../lib/day1-stack';

const app = new cdk.App();

new Day1Stack(app, 'Day1Stack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'ap-northeast-1',
  },
  description: 'Day 1 - Infrastructure Foundation Stack',
});

app.synth();

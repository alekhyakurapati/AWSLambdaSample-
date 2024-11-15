#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { EcaasVipSubscriberStack, EcaasVipSubscriberStackProps } from '../lib/ecaas-vip-subscriber-stack';
import { generateResourceName, getContext, getEnvVars } from '../lib/util';

const app = new cdk.App();
const context = getContext(app);
const { ACCOUNT, REGION } = getEnvVars();

const stackProps: EcaasVipSubscriberStackProps = {
    env: {
        account: ACCOUNT,
        region: REGION,
    },
    ...context,
};

new EcaasVipSubscriberStack(app, generateResourceName('EcaasVipSubscriberStack'), stackProps);

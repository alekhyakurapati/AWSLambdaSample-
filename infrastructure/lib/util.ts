import { App } from 'aws-cdk-lib';

export interface ECaaSVipSubscriberContext {
    vpcId: string;
    secretsManagerArn: string;
    awsAccountId: string;
    vipProxySearchEndpoint: string;
    vipProxyCreateEndpoint: string
    vipProxyUpdateEndpoint: string
    vipProxyAuthTokenEndpoint: string;
    vipProxySecretName: string;
    secretsManagerArnVipProxy: string;
    sesRole: string;
    emailBody: string;
    emailSubject: string;
    recipientEmails: string;
    sendEmailQueue: string;
    sendEmailQueueArn: string;
    subscriberApp: string;
    integrationHubArn: string;
    integrationHubAccountId: string;
    sendEmailQueueUrl: string;
    retryCount: string;
    maxTimeOut: string;
    minTimeOut: string;
}

export const getEnvVars = () => {
    return {
        ACCOUNT: process.env.CDK_DEPLOY_ACCOUNT || process.env.CDK_DEFAULT_ACCOUNT,
        REGION: process.env.CDK_DEPLOY_REGION || process.env.CDK_DEFAULT_REGION,
        STAGE: process.env.CDK_STAGE || 'dev',
        PROJECT_CODE: process.env.PROJECT_CODE || '',
    };
};

export const generateResourceName = (baseName: string): string => {
    const { PROJECT_CODE, STAGE } = getEnvVars();
    return `${PROJECT_CODE ?? ''}-${baseName}-${STAGE ?? ''}`
        .replace(/-{2,}/g, '-')
        .replace(/^-/, '')
        .replace(/-$/, '');
};

export function getContext(app: App): ECaaSVipSubscriberContext {
    const cdkStage = app.node.tryGetContext('stage') || 'dev';
    return app.node.tryGetContext(cdkStage) as ECaaSVipSubscriberContext;
}

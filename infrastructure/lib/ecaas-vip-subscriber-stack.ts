import { Duration, Stack, StackProps } from 'aws-cdk-lib';
import * as events from 'aws-cdk-lib/aws-events';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as eventtargets from 'aws-cdk-lib/aws-events-targets';
import * as iam from 'aws-cdk-lib/aws-iam';
import { join } from 'path';
import { Construct } from 'constructs';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as destinations from 'aws-cdk-lib/aws-lambda-destinations';
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { generateResourceName } from './util';
import { EventBus, CfnEventBusPolicy } from 'aws-cdk-lib/aws-events';

export interface EcaasVipSubscriberStackProps extends StackProps {
    vpcId: string;
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

export class EcaasVipSubscriberStack extends Stack {
    constructor(scope: Construct, id: string, props: EcaasVipSubscriberStackProps) {
        const {
            vpcId,
            awsAccountId,
            vipProxySearchEndpoint,
            vipProxyCreateEndpoint,
            vipProxyUpdateEndpoint,
            vipProxyAuthTokenEndpoint,
            vipProxySecretName,
            secretsManagerArnVipProxy,
            sesRole,
            emailBody,
            emailSubject,
            recipientEmails,
            sendEmailQueue,
            sendEmailQueueArn,
            subscriberApp,
            integrationHubArn,
            integrationHubAccountId,
            sendEmailQueueUrl,
            retryCount,
            maxTimeOut,
            minTimeOut,
            ...stackProps
        } = props;
        super(scope, id, stackProps);

        const deadLetterQueue = new sqs.Queue(this, generateResourceName('ECaaS-Vip-Subscriber-DLQ'));
        const eventBus = EventBus.fromEventBusArn(this, 'Existing_Event_Bus', integrationHubArn);
        new CfnEventBusPolicy(this, generateResourceName('AllowEventsFromIntegrationPlatformPolicy'), {
            statementId: generateResourceName('allow_integration_account_to_put_events'),
            action: 'events:PutEvents',
            eventBusName: eventBus.eventBusName,
            principal: integrationHubAccountId,
        });

        const rule = new events.Rule(this, 'rule', {
            eventPattern: {
                source: ['wel.operations.reservoir-management.sangomar-pas', 'wel.operations.reservoir-management.pyrenees-pas',
                        'wel.operations.reservoir-management.macedon-pas'],
                detailType: ['DefermentChange'],
                detail: {
                    Metadata: {
                        Version: ['1'],
                    },
                },
            },
        });

        const lambdaVpc = ec2.Vpc.fromLookup(this, generateResourceName('VipLambdaVpc'), {
            vpcId: vpcId,
        });

        // Role for lambda function
        const lambdaRole = new iam.Role(this, generateResourceName('lambdaRole'), {
            assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
        });

        //Managed policy for the lambda function
        lambdaRole.addManagedPolicy(
            iam.ManagedPolicy.fromManagedPolicyArn(
                this,
                'LambdaBasicPolicy',
                'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
            ),
        );

        //Managed policy for the lambda function
        lambdaRole.addManagedPolicy(
            iam.ManagedPolicy.fromManagedPolicyArn(
                this,
                'LambdaVPC',
                'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole',
            ),
        );

        //Lambda function
        const lambdaFunction = new NodejsFunction(this, generateResourceName('VipSubscriberLambda'), {
            description: 'ECaaS Subscriber lambda to send event to VIP(Jira)',
            runtime: lambda.Runtime.NODEJS_18_X,
            entry: join(__dirname, '../../lambdas/src/request-handler.ts'),
            timeout: Duration.seconds(30),
            memorySize: 256,
            environment: {
                AWS_ACCOUNT_ID: awsAccountId,
                DLQ_NAME: deadLetterQueue.queueName,
                VIP_PROXY_SEARCH_ENDPOINT: vipProxySearchEndpoint,
                VIP_PROXY_CREATE_ENDPOINT: vipProxyCreateEndpoint,
                VIP_PROXY_UPDATE_ENDPOINT: vipProxyUpdateEndpoint,
                VIP_PROXY_AUTH_TOKEN_ENDPOINT: vipProxyAuthTokenEndpoint,
                VIP_PROXY_SECRET_NAME: vipProxySecretName,
                EMAIL_SUBJECT: emailSubject,
                SEND_EMAIL_QUEUE: sendEmailQueue,
                SEND_EMAIL_QUEUE_ARN: sendEmailQueueArn,
                EMAIL_RECIPIENTS: recipientEmails,
                EMAIL_BODY: emailBody,
                EMAIL_SES_ROLE: sesRole,
                SUBSCRIBER_APP: subscriberApp,
                SEND_EMAIL_QUEUE_URL: sendEmailQueueUrl,
                RETRY_COUNT: retryCount,
                MAX_TIMEOUT: maxTimeOut,
                MIN_TIMEOUT: minTimeOut,
            },
            vpc: lambdaVpc,
            role: lambdaRole,
            onFailure: new destinations.SqsDestination(deadLetterQueue),
            initialPolicy: [
                new PolicyStatement({
                    effect: Effect.ALLOW,
                    actions: ['secretsmanager:GetSecretValue'],
                    resources: [secretsManagerArnVipProxy],
                }),
                new PolicyStatement({
                    effect: Effect.ALLOW,
                    actions: ['sqs:SendMessage'],
                    resources: [sendEmailQueueArn],
                }),
            ],
        });

        rule.addTarget(
            new eventtargets.LambdaFunction(lambdaFunction, {
                maxEventAge: Duration.hours(2),
            }),
        );
    }
}

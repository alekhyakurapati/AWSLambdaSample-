import { SendMessageCommand, SQSClient } from '@aws-sdk/client-sqs';
import { logger } from '../services/logger';

export const sendEmail = async (request: object) => {
    logger.info(`Request to send email notification, ${JSON.stringify(request)}`);
    try {
        const params = {
            MessageBody: JSON.stringify(request),
            QueueUrl: process.env.SEND_EMAIL_QUEUE_URL,
            MessageGroupId: 'VipEcaasSubscriberQueueGroup',
        };
        const client = new SQSClient({});
        const command = new SendMessageCommand(params);
        const response = await client.send(command);
        logger.info(`Send Email Response: ${JSON.stringify(response)}`);
        return response;
    } catch (error) {
        logger.error(error);
        throw new Error('Error in sending email notification');
    }
};

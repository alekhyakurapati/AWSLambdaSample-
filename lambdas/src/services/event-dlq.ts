import { SendMessageCommand, SQSClient } from '@aws-sdk/client-sqs';
import { EventBridgeEvent } from 'aws-lambda';
import { logger } from '../services/logger';

export const eventDlq = async (event: EventBridgeEvent<any, any>) => {
    logger.info(`Event to add in DLQ, ${event}`);
    try {
        const params = {
            MessageBody: JSON.stringify(event),
            QueueUrl: `https://sqs.${process.env.AWS_REGION}.amazonaws.com/${process.env.AWS_ACCOUNT_ID}/${process.env.DLQ_NAME}`,
        };
        const client = new SQSClient({});
        const command = new SendMessageCommand(params);
        const response = await client.send(command);
        logger.info(`DLQ response: ${JSON.stringify(response)}`);
        return response;
    } catch (error) {
        throw new Error('Error in adding event to DLQ');
    }
};

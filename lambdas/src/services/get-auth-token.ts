import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { logger } from './logger';

export const getCredentialsFromSecretManager = async (clientCredentialsSecretName: string) => {
    logger.info('Request to get access token from secret manager');
    const client = new SecretsManagerClient({
        region: process.env.AWS_REGION,
    });
    let response;
    try {
        response = await client.send(
            new GetSecretValueCommand({
                SecretId: clientCredentialsSecretName,
                VersionStage: 'AWSCURRENT',
            }),
        );
        const accessToken = response.SecretString ? JSON.parse(response.SecretString) : '';
        if (accessToken === '' || accessToken === null) {
            throw new Error('Invalid access token');
        }
        logger.info('Received access token from secrets manager');
        return accessToken;
    } catch (error) {
        logger.error('Error in receiving access token from secrets manager');
        throw error;
    }
};
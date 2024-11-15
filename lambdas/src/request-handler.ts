import { EventBridgeEvent } from 'aws-lambda';
import {
    SearchDeferment,
    SearchDefermentResponse,
    HandlerResponse,
} from './interfaces/ecaas-subscriber-interface';
import {
    VipDefermentRequest,
    ClientCredentials,
} from './interfaces/ecaas-subscriber-interface';
import { requestDeferment } from './mappers/vip-deferment-request-mapper';
import { titleCase } from './mappers/common-mapper';
import fetch from 'node-fetch';
import retry from 'async-retry';
import { logger } from './services/logger';
import { eventDlq } from './services/event-dlq';
import { getCredentialsFromSecretManager } from './services/get-auth-token';
import { sendEmail } from './services/send-email-queue';

export const handler = async (event: EventBridgeEvent<any, any>): Promise<HandlerResponse> => {
    logger.info(`Event received from Integration Hub, ${JSON.stringify(event)}`);
    try {
        if (!event.detail.Data.EVENT_NO) {
            throw new Error('Invalid Event - Missing Event Number/PAS Deferment ID');
        }

        const clientCredentials: ClientCredentials = await getCredentialsFromSecretManager(
            process.env.VIP_PROXY_SECRET_NAME || '',
        );
        
        const urlParams = new URLSearchParams();
        urlParams.append('grant_type', 'client_credentials');
        urlParams.append('client_id', clientCredentials.client_id);
        urlParams.append('client_secret', clientCredentials.client_secret);
        urlParams.append('scope', 'profile');
        const accessToken = await getVipProxyAccessToken(urlParams);
        
        if (!accessToken) {
            throw new Error('Error in receiving access token from VIP Proxy Server end point');
        }
        const deferment = await searchDeferment(`SNG-${event.detail.Data.EVENT_NO.toString()}`, accessToken);
        const defRequest = await defermentRequest(event);
        if (deferment == 'Deferment not exist') {
            await createDeferment(defRequest, accessToken);
        } else {
            await updateDeferment(defRequest, deferment, accessToken);
        }
        const response: HandlerResponse = {
            statusCode: '200',
            body: 'VIP endpoint is successfuly updated',
        };
        return response;
    } catch (error) {
        logger.error(error);
        const response: HandlerResponse = {
            statusCode: '200',
            body: 'Error in inserting deferment data in VIP',
        };
        if (error instanceof Error) {
            if (error.message.includes('Invalid')) {
                await eventDlq(event);
                await sendEmail(createEmailBody());
                response.statusCode = '400';
            } else if (error.message.includes('VIP Server')){
                await eventDlq(event);
                await sendEmail(createEmailBody());
                response.statusCode = '500';
            } else {
                throw error;
            }
        }
        return response;
    }
};


export const getVipProxyAccessToken = async (params: URLSearchParams): Promise<string> => {
    logger.info('Request to get access token from VIP Proxy');
    const authEndpoint = process.env.VIP_PROXY_AUTH_TOKEN_ENDPOINT || '';
    return await retry(async (bail: (error: Error) => void, attempt: number) => {
        logger.info(`Attempt ${attempt} to get access token from VIP Proxy`);
        const response =  await fetch(authEndpoint, {
            method: 'POST',
            body: params,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });

        if (response.ok) {
            const data = await response.json();
            if (!data) {
                throw new Error('Error in getting access token from VIP Proxy Server');
            }
            logger.info('Received access token from VIP Proxy');
            return data.access_token;
        }  else if (response.status >= 500 && response.status < 600) {
            // Retry for 5xx errors
            throw new Error('Error in getting access token from VIP Proxy Server');
          }  else if (response.status >= 400 && response.status <= 451) {
            // Don't retry on 4XX errors
            bail(new Error('Invalid Request - Authorization'));
          }
   
      }, {
        retries: process.env.RETRY_COUNT ? parseInt(process.env.RETRY_COUNT) : 3,
        minTimeout: process.env.MIN_TIMEOUT ? parseInt(process.env.MIN_TIMEOUT) : 1000,
        maxTimeout: process.env.MAX_TIMEOUT ? parseInt(process.env.MAX_TIMEOUT) : 5000,
        onRetry: (error, attempt) => {
            logger.warn(`Retry attempt ${attempt} failed: ${error.message}`);
        },
      });
  
};
export const searchDeferment = async (eventNumber: string, auth: any): Promise<string> => {
    logger.info('Request to search deferment in VIP');
    const url = process.env.VIP_PROXY_SEARCH_ENDPOINT || '';
    const requestBody: SearchDeferment = {
        jql: `cf[23535] = ${eventNumber}`,
        maxResults: '1',
    };
    logger.info(`Search Deferment Request, ${JSON.stringify(requestBody)}`);
    const params = {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${auth.access_token || ''}`,
            'X-Workato-Access-Profile-Key': '7ee254b90be4217e777c138d277adac84bb7ea8b8bd409799cfd6cb35dab3dfb',
        },
    };

    return await retry(async (bail: (error: Error) => void, attempt: number) => {
        logger.info(`Attempt ${attempt} to search deferment in VIP`);
        const response = await fetch(url, params);
        if (response.status === 200) {
            const data: SearchDefermentResponse = await response.json();
            logger.info(`Received response from VIP for search deferment,  ${data}`);
            return data.total !== 0 ? data.issues[0].id : 'Deferment not exist';
        } else if (response.status >= 500 && response.status < 600) {
             // Retry for 5xx errors
             throw new Error('Error in searching deferment event from VIP Server');
        }  else if (response.status >= 400 && response.status <= 431) {
             // Don't retry on 4XX errors
            bail(new Error('Invalid Deferment Request - VIP'));
        } 
        throw new Error('Unexpected error in searching deferment event from VIP Server');
    },  {
        retries: process.env.RETRY_COUNT ? parseInt(process.env.RETRY_COUNT) : 3,
        minTimeout: process.env.MIN_TIMEOUT ? parseInt(process.env.MIN_TIMEOUT) : 1000,
        maxTimeout: process.env.MAX_TIMEOUT ? parseInt(process.env.MAX_TIMEOUT) : 5000,
        onRetry: (error, attempt) => {
            logger.warn(`Retry attempt ${attempt} failed: ${error.message}`);
        },
      });
};

export const createDeferment = async (request: VipDefermentRequest, auth: any) => {
    logger.info(`Create Deferment Request, ${JSON.stringify(request)}`);
    const url = process.env.VIP_PROXY_CREATE_ENDPOINT || '';
    const params = {
        method: 'POST',
        body: JSON.stringify(request),
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${auth.access_token}`,
            'X-Workato-Access-Profile-Key': '7ee254b90be4217e777c138d277adac84bb7ea8b8bd409799cfd6cb35dab3dfb',
        },
    };
    return await retry(async (bail: (error: Error) => void, attempt: number) => {
        logger.info(`Attempt ${attempt} to search deferment in VIP`);
        const response = await fetch(url, params);
        if (response.status === 201) {
            const data = await response.json();
            logger.info(`Create Deferment Response, ${data}`);
            return data;
        }  else if (response.status >= 500 && response.status < 600) {
            // Retry for 5xx errors
            throw new Error('Error in receiving response for create deferment - VIP Server');
       }  else if (response.status >= 400 && response.status <= 431) {
           bail(new Error('Error in receiving response for create deferment - VIP'));
       }
       throw new Error('Unexpected error in create deferment from VIP Server');
     },  {
            retries: process.env.RETRY_COUNT ? parseInt(process.env.RETRY_COUNT) : 3,
            minTimeout: process.env.MIN_TIMEOUT ? parseInt(process.env.MIN_TIMEOUT) : 1000,
            maxTimeout: process.env.MAX_TIMEOUT ? parseInt(process.env.MAX_TIMEOUT) : 5000,
            onRetry: (error, attempt) => {
                logger.warn(`Retry attempt ${attempt} failed: ${error.message}`);
            },
      });
};


export const updateDeferment = async (request: VipDefermentRequest, issueId: string, auth: any) => {
    logger.info(`Update Deferment Request, ${JSON.stringify(request)}`);
    const url = `${process.env.VIP_PROXY_UPDATE_ENDPOINT}/${issueId}`;
    const params = {
        method: 'PUT',
        body: JSON.stringify(request),
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${auth.access_token}`,
            'X-Workato-Access-Profile-Key': '7ee254b90be4217e777c138d277adac84bb7ea8b8bd409799cfd6cb35dab3dfb',
        },
    };
    return await retry(async (bail: (error: Error) => void, attempt: number) => {
        logger.info(`Attempt ${attempt} to search deferment in VIP`);
        const response = await fetch(url, params);
        if (response.status === 204) {
            logger.info(`Update Deferment Response, ${response.status}`);
        } else if (response.status >= 500 && response.status < 600) {
            // Retry for 5xx errors
            throw new Error('Error in receiving response for update deferment - VIP Server');
       }  else if (response.status >= 400 && response.status <= 431) {
           bail(new Error('Invalid Update Deferment Request - VIP'));
       }
       throw new Error('Unexpected error in update deferment event from VIP Server');
    },  {
        retries: process.env.RETRY_COUNT ? parseInt(process.env.RETRY_COUNT) : 3,
        minTimeout: process.env.MIN_TIMEOUT ? parseInt(process.env.MIN_TIMEOUT) : 1000,
        maxTimeout: process.env.MAX_TIMEOUT ? parseInt(process.env.MAX_TIMEOUT) : 5000,
        onRetry: (error, attempt) => {
            logger.warn(`Retry attempt ${attempt} failed: ${error.message}`);
        },
  });   
};

const defermentRequest = async (event: EventBridgeEvent<any, any>): Promise<VipDefermentRequest> => {
    logger.info('Preparing request for deferment event');
    const request: VipDefermentRequest = requestDeferment(event);
    if (event.detail.Data.lossCategory) {
        request.fields.customfield_23537 = {
            value: event.detail.Data.lossCategory,
        };
    }
    if (event.detail.Data.lossSubCategory) {
        request.fields.customfield_23544 = {
            value: event.detail.Data.lossSubCategory,
        };
    }
    if (event.detail.Data.lossType) {
        request.fields.customfield_23525 = {
            value: titleCase(event.detail.Data.lossType),
        };
    }
    if (event.detail.Data.tripSlowdown) {
        request.fields.customfield_23557 = {
            value: titleCase(event.detail.Data.tripSlowdown),
        };
    }

   if (event.detail.Data.pasAsset) {
        request.fields.customfield_14920 = {
            value: titleCase(event.detail.Data.pasAsset),
        };
    }
   
    return request;
};


function createEmailBody() {
    const emailData = process.env.EMAIL_BODY ?? '';
    const recipientEmails = process.env.EMAIL_RECIPIENTS?.split('; ') ?? [];
    const SESRole = process.env.EMAIL_SES_ROLE ?? '';
    const emailSubject = process.env.EMAIL_SUBJECT ?? '';
    const subscriberApp = process.env.SUBSCRIBER_APP ?? '';
    return {
        SESRole,
        emailData,
        emailSubject,
        recipientEmails,
        subscriberApp,
    };
    
}

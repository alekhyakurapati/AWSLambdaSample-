import { EventBridgeEvent } from 'aws-lambda';
import { VipDefermentRequest } from '../interfaces/ecaas-subscriber-interface';
import { Dateformatter } from './common-mapper';
import { logger } from '../services/logger';

export const requestDeferment = (event: EventBridgeEvent<any, any>): VipDefermentRequest => {
    logger.info('Request mapper - VipDefermentRequest');
    const request: VipDefermentRequest = {
        fields: {
            project: {
                key: 'VIP',
            },
            issuetype: {
                name: 'Deferment',
            },
            summary: event.detail.Data.summary ?? '',
            customfield_23518: event.detail.Data.affectedArea,
            customfield_23507: event.detail.Data.defermentEventTitle,
            customfield_23551: event.detail.Data.rootCauseComments,
            customfield_16700: Dateformatter(event.detail.Data.startDate),
            customfield_18808: Dateformatter(event.detail.Data.endDate),
            customfield_23535: event.detail.Data.pasDefermentId,
            customfield_23530: event.detail.Data.rootCauseFloc,
            reporter: {
                name: event.detail.Data.lastUpdatedBy,
            },
            customfield_23541: event.detail.Data.lng,
            customfield_23517: event.detail.Data.pipelineGas,
            customfield_23515: event.detail.Data.propane,
            customfield_23534: event.detail.Data.condensate,
            customfield_23502: event.detail.Data.exportGas,
            customfield_23523: event.detail.Data.dryGas,
            customfield_23559: event.detail.Data.oilSm3, 
            customfield_23545: event.detail.Data.butane,
            customfield_23509: event.detail.Data.exportLiquids,
            customfield_23561: event.detail.Data.boe,
            customfield_23529: event.detail.Data.cause,
            customfield_23511: event.detail.Data.subCause,
        },
    };
    return request;
};

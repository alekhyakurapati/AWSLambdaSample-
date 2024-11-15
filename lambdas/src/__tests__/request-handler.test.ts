import { logger } from '../services/logger';
import { handler, searchDeferment, createDeferment, updateDeferment } from '../request-handler';
import { EventBridgeEvent } from 'aws-lambda';
import { eventDlq } from '../services/event-dlq';
import { getCredentialsFromSecretManager } from '../services/get-auth-token';
import fetch, { Response } from 'node-fetch';

jest.mock('node-fetch');
jest.mock('../services/event-dlq');
jest.mock('../services/get-auth-token');
const mockAuthfunction = getCredentialsFromSecretManager as jest.MockedFunction<typeof getCredentialsFromSecretManager>;
const mockFetchFunction = fetch as jest.MockedFunction<typeof fetch>;

describe('Testing get-auth-token', () => {
    beforeEach(() => {
        jest.spyOn(logger, 'info').mockImplementation();
        jest.spyOn(logger, 'error').mockImplementation();
    });

    const mockRequest: EventBridgeEvent<any, any> = {
        version: '0',
        id: '56c7cd67-a19f-52de-bda2-76cebe724039',
        'detail-type': 'myEvent',
        source: 'myCustomEvent',
        account: '739632194968',
        time: '2023-09-12T05:07:21Z',
        region: 'ap-southeast-2',
        resources: [],
        detail: {
            EVENT_NO: 'PL242000',
            DAYTIME: '2023-09-04T00:00:00',
            END_DATE: null,
            EVENT_TYPE: 'Trip',
            ZWS_DEFER_EVENT_TITLE: 'replace power cable',
            SCHEDULED: false,
            OBJECT_TYPE: 'WELL',
            ACTIVE_PHASES: 'PROD',
            REASON_CODE_1: 'REAS_1_WELL',
            REASON_CODE_2: 'REAS_2_WELL_GALI',
            ZWS_LOSS_TYPE: 'ACTUAL',
            REASON_CODE_3: 'Planned',
            REASON_CODE_4: 'Planned maintenance, intervention, turnaround',
            ZWS_ROOT_CAUSE_FLOC: null,
            REASON_CODE_5: 'REAS_5_ELEC',
            REASON_CODE_6: 'REAS_6_ELEC_ELEC',
            COND_LOSS_METHOD: null,
            OIL_LOSS_METHOD: null,
            WATER_LOSS_METHOD: null,
            GAS_LOSS_METHOD: null,
            WATER_INJ_LOSS_METHOD: null,
            STEAM_INJ_LOSS_METHOD: null,
            GAS_INJ_LOSS_METHOD: null,
            CO2_INJ_LOSS_METHOD: null,
            DILUENT_LOSS_METHOD: null,
            GAS_LIFT_LOSS_METHOD: null,
            OIL_LOSS_MASS_METHOD: null,
            GAS_LOSS_MASS_METHOD: null,
            COND_LOSS_MASS_METHOD: null,
            WATER_LOSS_MASS_METHOD: null,
            OIL_LOSS_VOLUME: 65,
            GAS_LOSS_VOLUME: 35,
            COND_LOSS_VOLUME: null,
            WATER_LOSS_VOLUME: 6,
            WATER_INJ_LOSS_VOLUME: null,
            STEAM_INJ_LOSS_VOLUME: null,
            GAS_INJ_LOSS_VOLUME: null,
            DILUENT_LOSS_VOLUME: null,
            GAS_LIFT_LOSS_VOLUME: null,
            OIL_LOSS_MASS: null,
            GAS_LOSS_MASS: null,
            COND_LOSS_MASS: null,
            WATER_LOSS_MASS: null,
            WATER_INJ_LOSS_MASS: null,
            STEAM_INJ_LOSS_MASS: null,
            GAS_INJ_LOSS_MASS: null,
            GAS_LIFT_LOSS_MASS: null,
            DEFERMENT_TYPE: 'SINGLE',
            DAY: '2023-09-04T00:00:00',
            END_DAY: null,
            CLASS_NAME: 'DEFERMENT_EVENT',
            COMMENTS: null,
            DEFER_OBJECT_ID: '041E2C4D485B3987E0630100007FD453',
        },
    };

    it('Return error because event number is null', async () => {
        mockRequest.detail.EVENT_NO = null;
        await handler(mockRequest);
        expect(eventDlq).toHaveBeenCalled();
    });

    it('Successfully search the deferment in VIP', async () => {
        const auth = {
            access_token: 'abc',
        };
        const json = jest.fn() as jest.MockedFunction<any>;
        json.mockResolvedValue({ total: 0 });
        const response = new Response();
        response.status = 200;
        response.json = json;
        mockAuthfunction.mockImplementation(() => Promise.resolve(auth));
        mockFetchFunction.mockImplementation(() => Promise.resolve(response));
        const result = await searchDeferment(mockRequest.detail.EVENT_NO, auth);
        expect(result).toBe('Deferment not exist');
    });

    it('Return error for search deferment because status code is not 200', async () => {
        const auth = {
            access_token: 'abc',
        };
        const json = jest.fn() as jest.MockedFunction<any>;
        json.mockResolvedValue({ total: 0 });
        const response = new Response();
        response.status = 400;
        response.json = json;
        mockAuthfunction.mockImplementation(() => Promise.resolve(auth));
        mockFetchFunction.mockImplementation(() => Promise.resolve(response));
        expect(searchDeferment(mockRequest.detail.EVENT_NO, auth)).rejects.toThrow('Invalid Deferment Request - VIP');
    });

    it('Return error for search deferment because status code is not 200', async () => {
        const auth = {
            access_token: 'abc',
        };
        const json = jest.fn() as jest.MockedFunction<any>;
        json.mockResolvedValue({ total: 0 });
        const response = new Response();
        response.status = 400;
        response.json = json;
        mockAuthfunction.mockImplementation(() => Promise.resolve(auth));
        mockFetchFunction.mockImplementation(() => Promise.resolve(response));
        expect(searchDeferment(mockRequest.detail.EVENT_NO, auth)).rejects.toThrow('Invalid Deferment Request - VIP');
    });

    it('Return error for create deferment because status code is not 201', async () => {
        const auth = {
            access_token: 'abc',
        };
        const json = jest.fn() as jest.MockedFunction<any>;
        json.mockResolvedValue({ total: 0 });
        const response = new Response();
        response.status = 400;
        response.json = json;
        mockAuthfunction.mockImplementation(() => Promise.resolve(auth));
        mockFetchFunction.mockImplementation(() => Promise.resolve(response));
        expect(createDeferment(mockRequest.detail, auth)).rejects.toThrow('Invalid Create Deferment Request - VIP');
    });

    it('Successfully create the deferment in VIP', async () => {
        const auth = {
            access_token: 'abc',
        };
        const json = jest.fn() as jest.MockedFunction<any>;
        json.mockResolvedValue({ total: 0 });
        const response = new Response();
        response.status = 201;
        response.json = json;
        mockAuthfunction.mockImplementation(() => Promise.resolve(auth));
        mockFetchFunction.mockImplementation(() => Promise.resolve(response));
        expect(createDeferment(mockRequest.detail, auth)).resolves.toBeTruthy();
    });

    it('Successfully udpate the deferment in VIP', async () => {
        const auth = {
            access_token: 'abc',
        };
        const json = jest.fn() as jest.MockedFunction<any>;
        json.mockResolvedValue({ total: 0 });
        const response = new Response();
        response.status = 204;
        response.json = json;
        mockAuthfunction.mockImplementation(() => Promise.resolve(auth));
        mockFetchFunction.mockImplementation(() => Promise.resolve(response));
        expect(updateDeferment(mockRequest.detail, '123', auth)).resolves.toBe(undefined);
    });

    it('Return error for updating the deferment because status code is not 204', async () => {
        const auth = {
            access_token: 'abc',
        };
        const json = jest.fn() as jest.MockedFunction<any>;
        json.mockResolvedValue({ total: 0 });
        const response = new Response();
        response.status = 400;
        response.json = json;
        mockAuthfunction.mockImplementation(() => Promise.resolve(auth));
        mockFetchFunction.mockImplementation(() => Promise.resolve(response));
        expect(updateDeferment(mockRequest.detail, '123', auth)).rejects.toThrow(
            'Invalid Update Deferment Request - VIP',
        );
    });
});

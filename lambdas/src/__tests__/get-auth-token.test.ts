import { logger } from '../services/logger';
import { getCredentialsFromSecretManager } from '../services/get-auth-token';

describe('Testing get-auth-token', () => {
    beforeEach(() => {
        jest.spyOn(logger, 'info').mockImplementation();
        jest.spyOn(logger, 'error').mockImplementation();
    });

    it('Throws error because of wrong secret name', async () => {
        const clientCredentialsSecretName = 'abc';
        expect(getCredentialsFromSecretManager(clientCredentialsSecretName)).rejects.toThrowError();
    });

});

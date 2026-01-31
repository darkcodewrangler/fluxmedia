import { describe } from 'vitest';
import { R2Provider } from '../r2-provider';
import { createProviderContractTests } from '@fluxmedia/core/testing';

describe('R2Provider', () => {
    createProviderContractTests('R2', () => {
        return new R2Provider({
            accountId: 'test-account',
            bucket: 'test-bucket',
            accessKeyId: 'test-key',
            secretAccessKey: 'test-secret',
            publicUrl: 'https://test-bucket.r2.dev',
        });
    });
});

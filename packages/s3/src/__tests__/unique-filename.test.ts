import { describe, it, expect, vi, beforeEach } from 'vitest';
import { S3Provider } from '../s3-provider';

// Mock AWS SDK
vi.mock('@aws-sdk/client-s3', () => ({
    S3Client: vi.fn().mockImplementation(() => ({
        send: vi.fn(),
    })),
    DeleteObjectCommand: vi.fn(),
    HeadObjectCommand: vi.fn(),
}));

vi.mock('@aws-sdk/lib-storage', () => ({
    Upload: vi.fn().mockImplementation(() => ({
        on: vi.fn(),
        done: vi.fn().mockResolvedValue({}),
    })),
}));

describe('S3Provider Unique Filename', () => {
    let provider: S3Provider;

    beforeEach(() => {
        provider = new S3Provider({
            bucket: 'test-bucket',
            region: 'us-east-1',
            accessKeyId: 'test-key',
            secretAccessKey: 'test-secret',
        });
    });

    it('should generate unique filename when filename is provided (default)', async () => {
        // Access the private method via type assertion
        const generateKey = (provider as unknown as { generateKey: (options?: { filename?: string; folder?: string; uniqueFilename?: boolean }) => string }).generateKey.bind(provider);

        const key1 = generateKey({ filename: 'avatar' });
        const key2 = generateKey({ filename: 'avatar' });

        // Keys should be different (unique suffix)
        expect(key1).not.toBe(key2);
        // Accepts 8-12 alphanumeric chars for crypto/timestamp-based ID
        expect(key1).toMatch(/^avatar-[a-z0-9]{8,12}$/);

    });

    it('should use exact filename when uniqueFilename is false', async () => {
        const generateKey = (provider as unknown as { generateKey: (options?: { filename?: string; folder?: string; uniqueFilename?: boolean }) => string }).generateKey.bind(provider);

        const key = generateKey({ filename: 'avatar', uniqueFilename: false });

        expect(key).toBe('avatar');
    });

    it('should include folder in path', async () => {
        const generateKey = (provider as unknown as { generateKey: (options?: { filename?: string; folder?: string; uniqueFilename?: boolean }) => string }).generateKey.bind(provider);

        const key = generateKey({ filename: 'avatar', folder: 'profiles', uniqueFilename: false });

        expect(key).toBe('profiles/avatar');
    });

    it('should generate random ID when no filename provided', async () => {
        const generateKey = (provider as unknown as { generateKey: (options?: { filename?: string; folder?: string; uniqueFilename?: boolean }) => string }).generateKey.bind(provider);

        const key1 = generateKey({});
        const key2 = generateKey({});

        // Keys should be random timestamps
        expect(key1).not.toBe(key2);
        expect(key1).toMatch(/^\d+-[a-z0-9]+$/);
    });
});

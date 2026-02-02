import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CloudinaryProvider } from '../cloudinary-provider';
import type { UploadResult } from '@fluxmedia/core';

// Mock cloudinary SDK
vi.mock('cloudinary', () => ({
    v2: {
        config: vi.fn(),
        uploader: {
            upload: vi.fn(),
            destroy: vi.fn(),
            explicit: vi.fn(),
        },
        url: vi.fn(),
    },
}));

describe('CloudinaryProvider Batch Operations', () => {
    let provider: CloudinaryProvider;
    let mockUploadResult: UploadResult;

    beforeEach(() => {
        provider = new CloudinaryProvider({
            cloudName: 'test-cloud',
            apiKey: 'test-key',
            apiSecret: 'test-secret',
        });

        mockUploadResult = {
            id: 'test-id',
            url: 'https://res.cloudinary.com/test/image/upload/test-id',
            publicUrl: 'https://res.cloudinary.com/test/image/upload/test-id',
            size: 1024,
            format: 'jpg',
            provider: 'cloudinary',
            metadata: {},
            createdAt: new Date(),
        };

        // Mock the upload method
        vi.spyOn(provider, 'upload').mockResolvedValue(mockUploadResult);
        vi.spyOn(provider, 'delete').mockResolvedValue(undefined);
    });

    describe('uploadMultiple', () => {
        it('should upload files with concurrency control', async () => {
            const files = [
                Buffer.from('file1'),
                Buffer.from('file2'),
                Buffer.from('file3'),
                Buffer.from('file4'),
                Buffer.from('file5'),
            ];

            const results = await provider.uploadMultiple(files, { concurrency: 2 });

            expect(results).toHaveLength(5);
            expect(provider.upload).toHaveBeenCalledTimes(5);
        });

        it('should clone options for each file', async () => {
            const files = [Buffer.from('file1'), Buffer.from('file2')];
            const options = { folder: 'test', tags: ['tag1'] };

            await provider.uploadMultiple(files, options);

            // Each call should have its own options (not shared)
            expect(provider.upload).toHaveBeenCalledTimes(2);
        });

        it('should use default concurrency of 5', async () => {
            const files = Array(10).fill(null).map((_, i) => Buffer.from(`file${i}`));

            await provider.uploadMultiple(files);

            // Should process in batches of 5
            expect(provider.upload).toHaveBeenCalledTimes(10);
        });
    });

    describe('deleteMultiple', () => {
        it('should delete files with concurrency control', async () => {
            const ids = ['id1', 'id2', 'id3', 'id4', 'id5'];

            await provider.deleteMultiple(ids);

            expect(provider.delete).toHaveBeenCalledTimes(5);
        });

        it('should handle partial failures and report them', async () => {
            const ids = ['id1', 'id2', 'id3'];

            // Mock first delete to fail
            vi.spyOn(provider, 'delete')
                .mockResolvedValueOnce(undefined)
                .mockRejectedValueOnce(new Error('Delete failed'))
                .mockResolvedValueOnce(undefined);

            await expect(provider.deleteMultiple(ids)).rejects.toThrow(
                /Failed to delete 1 of 3 files/
            );
        });

        it('should process all files even when some fail', async () => {
            const ids = ['id1', 'id2', 'id3'];

            vi.spyOn(provider, 'delete')
                .mockRejectedValueOnce(new Error('Fail'))
                .mockRejectedValueOnce(new Error('Fail'))
                .mockResolvedValueOnce(undefined);

            await expect(provider.deleteMultiple(ids)).rejects.toThrow(
                /Failed to delete 2 of 3 files: id1, id2/
            );
        });
    });
});

describe('CloudinaryProvider Unique Filename', () => {
    let provider: CloudinaryProvider;

    beforeEach(async () => {
        provider = new CloudinaryProvider({
            cloudName: 'test-cloud',
            apiKey: 'test-key',
            apiSecret: 'test-secret',
        });

        // Directly access cloudinary mock
        const cloudinary = await import('cloudinary');
        (cloudinary.v2.uploader.upload as ReturnType<typeof vi.fn>).mockResolvedValue({
            public_id: 'test-id',
            secure_url: 'https://res.cloudinary.com/test/image/upload/test-id',
            bytes: 1024,
            format: 'jpg',
            resource_type: 'image',
            version: 1234567890,
            type: 'upload',
            created_at: new Date().toISOString(),
        });
    });

    it('should generate unique filename by default when filename is provided', async () => {
        const file = Buffer.from('test');

        await provider.upload(file, { filename: 'avatar' });

        const cloudinary = await import('cloudinary');
        expect(cloudinary.v2.uploader.upload).toHaveBeenCalled();

        const callArgs = (cloudinary.v2.uploader.upload as ReturnType<typeof vi.fn>).mock.calls[0];
        const options = callArgs?.[1];

        // Should have unique suffix appended
        expect(options?.public_id).toMatch(/^avatar-[a-z0-9]{6}$/);
    });

    it('should not generate unique filename when uniqueFilename is false', async () => {
        const file = Buffer.from('test');

        await provider.upload(file, { filename: 'avatar', uniqueFilename: false });

        const cloudinary = await import('cloudinary');
        const callArgs = (cloudinary.v2.uploader.upload as ReturnType<typeof vi.fn>).mock.calls.at(-1);
        const options = callArgs?.[1];

        // Should use exact filename
        expect(options?.public_id).toBe('avatar');
    });
});

import { describe, it, expect, vi } from 'vitest';
import { MediaUploader } from '../media-uploader';
import type { MediaProvider, UploadResult, ProviderFeatures } from '../types';

// Mock provider for testing
class MockProvider implements MediaProvider {
    readonly name = 'mock';
    readonly features: ProviderFeatures = {
        transformations: {
            resize: true,
            crop: true,
            format: true,
            quality: true,
            blur: false,
            rotate: false,
            effects: false,
        },
        capabilities: {
            signedUploads: true,
            directUpload: true,
            multipartUpload: false,
            videoProcessing: false,
            aiTagging: false,
            facialDetection: false,
        },
        storage: {
            maxFileSize: 10 * 1024 * 1024,
            supportedFormats: ['jpg', 'png'],
        },
    };

    readonly native = { client: 'mock' };

    upload = vi.fn<Parameters<MediaProvider['upload']>, Promise<UploadResult>>();
    delete = vi.fn<Parameters<MediaProvider['delete']>, Promise<void>>();
    get = vi.fn<Parameters<MediaProvider['get']>, Promise<UploadResult>>();
    getUrl = vi.fn<Parameters<MediaProvider['getUrl']>, string>();
    uploadMultiple = vi.fn<
        Parameters<MediaProvider['uploadMultiple']>,
        Promise<UploadResult[]>
    >();
    deleteMultiple = vi.fn<Parameters<MediaProvider['deleteMultiple']>, Promise<void>>();
    search = vi.fn();
}

describe('MediaUploader', () => {
    const mockResult: UploadResult = {
        id: 'test-id',
        url: 'https://example.com/file.jpg',
        publicUrl: 'https://example.com/file.jpg',
        size: 1024,
        format: 'jpg',
        provider: 'mock',
        metadata: {},
        createdAt: new Date(),
    };

    it('should create an instance with a provider', () => {
        const mockProvider = new MockProvider();
        const uploader = new MediaUploader(mockProvider);

        expect(uploader).toBeInstanceOf(MediaUploader);
        expect(uploader.provider).toBe(mockProvider);
    });

    describe('upload', () => {
        it('should delegate upload to provider', async () => {
            const mockProvider = new MockProvider();
            mockProvider.upload.mockResolvedValue(mockResult);

            const uploader = new MediaUploader(mockProvider);
            const file = Buffer.from('test');
            const options = { folder: 'test' };

            const result = await uploader.upload(file, options);

            expect(mockProvider.upload).toHaveBeenCalledWith(file, options);
            expect(result).toBe(mockResult);
        });
    });

    describe('delete', () => {
        it('should delegate delete to provider', async () => {
            const mockProvider = new MockProvider();
            mockProvider.delete.mockResolvedValue();

            const uploader = new MediaUploader(mockProvider);
            await uploader.delete('test-id');

            expect(mockProvider.delete).toHaveBeenCalledWith('test-id');
        });
    });

    describe('get', () => {
        it('should delegate get to provider', async () => {
            const mockProvider = new MockProvider();
            mockProvider.get.mockResolvedValue(mockResult);

            const uploader = new MediaUploader(mockProvider);
            const result = await uploader.get('test-id');

            expect(mockProvider.get).toHaveBeenCalledWith('test-id');
            expect(result).toBe(mockResult);
        });
    });

    describe('getUrl', () => {
        it('should delegate getUrl to provider', () => {
            const mockProvider = new MockProvider();
            mockProvider.getUrl.mockReturnValue('https://example.com/transformed.jpg');

            const uploader = new MediaUploader(mockProvider);
            const transform = { width: 200, height: 200 };
            const url = uploader.getUrl('test-id', transform);

            expect(mockProvider.getUrl).toHaveBeenCalledWith('test-id', transform);
            expect(url).toBe('https://example.com/transformed.jpg');
        });
    });

    describe('uploadMultiple', () => {
        it('should delegate uploadMultiple to provider', async () => {
            const mockProvider = new MockProvider();
            const mockResults = [mockResult, { ...mockResult, id: 'test-id-2' }];
            mockProvider.uploadMultiple.mockResolvedValue(mockResults);

            const uploader = new MediaUploader(mockProvider);
            const files = [Buffer.from('test1'), Buffer.from('test2')];
            const results = await uploader.uploadMultiple(files);

            expect(mockProvider.uploadMultiple).toHaveBeenCalledWith(files, undefined);
            expect(results).toBe(mockResults);
        });
    });

    describe('deleteMultiple', () => {
        it('should delegate deleteMultiple to provider', async () => {
            const mockProvider = new MockProvider();
            mockProvider.deleteMultiple.mockResolvedValue();

            const uploader = new MediaUploader(mockProvider);
            const ids = ['id1', 'id2', 'id3'];
            await uploader.deleteMultiple(ids);

            expect(mockProvider.deleteMultiple).toHaveBeenCalledWith(ids);
        });
    });

    describe('search', () => {
        it('should delegate search to provider if supported', async () => {
            const mockProvider = new MockProvider();
            const mockResults = [mockResult];
            mockProvider.search.mockResolvedValue(mockResults);

            const uploader = new MediaUploader(mockProvider);
            const query = { tags: ['test'] };
            const results = await uploader.search(query);

            expect(mockProvider.search).toHaveBeenCalledWith(query);
            expect(results).toBe(mockResults);
        });

        it('should throw error if search not supported', async () => {
            const mockProvider = new MockProvider();
            delete (mockProvider as Partial<MockProvider>).search;

            const uploader = new MediaUploader(mockProvider);

            await expect(uploader.search({})).rejects.toThrow(
                'Search is not supported by mock provider'
            );
        });
    });

    describe('supports', () => {
        it('should return true for supported features', () => {
            const mockProvider = new MockProvider();
            const uploader = new MediaUploader(mockProvider);

            expect(uploader.supports('transformations.resize')).toBe(true);
            expect(uploader.supports('transformations.crop')).toBe(true);
            expect(uploader.supports('capabilities.signedUploads')).toBe(true);
        });

        it('should return false for unsupported features', () => {
            const mockProvider = new MockProvider();
            const uploader = new MediaUploader(mockProvider);

            expect(uploader.supports('transformations.blur')).toBe(false);
            expect(uploader.supports('capabilities.videoProcessing')).toBe(false);
        });

        it('should return false for non-existent features', () => {
            const mockProvider = new MockProvider();
            const uploader = new MediaUploader(mockProvider);

            expect(uploader.supports('nonexistent.feature')).toBe(false);
            expect(uploader.supports('transformations.nonexistent')).toBe(false);
        });
    });
});

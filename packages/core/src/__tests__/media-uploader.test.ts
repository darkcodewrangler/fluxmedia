import { describe, it, expect, vi } from 'vitest';
import { MediaUploader } from '../media-uploader';
import { MediaError, MediaErrorCode } from '../errors';
import type { MediaProvider, UploadResult, ProviderFeatures, UploadInput } from '../types';
import type { FluxMediaPlugin } from '../plugin';

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
  uploadMultiple = vi.fn<Parameters<MediaProvider['uploadMultiple']>, Promise<UploadResult[]>>();
  deleteMultiple = vi.fn<Parameters<MediaProvider['deleteMultiple']>, Promise<void>>();
  search = vi.fn();
}

describe('MediaUploader', () => {
  const mockResult: UploadResult = {
    id: 'test-id',
    storageKey: 'test-id',
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
    it('should upload each file individually (for plugin support)', async () => {
      const mockProvider = new MockProvider();
      const mockResult2 = { ...mockResult, id: 'test-id-2' };
      mockProvider.upload.mockResolvedValueOnce(mockResult).mockResolvedValueOnce(mockResult2);

      const uploader = new MediaUploader(mockProvider);
      const files = [Buffer.from('test1'), Buffer.from('test2')];
      const results = await uploader.uploadMultiple(files);

      expect(mockProvider.upload).toHaveBeenCalledTimes(2);
      expect(results).toHaveLength(2);
      expect(results[0]).toBe(mockResult);
      expect(results[1]).toBe(mockResult2);
    });
  });

  describe('deleteMultiple', () => {
    it('should delete each file individually (for plugin support)', async () => {
      const mockProvider = new MockProvider();
      mockProvider.delete.mockResolvedValue();

      const uploader = new MediaUploader(mockProvider);
      const ids = ['id1', 'id2', 'id3'];
      await uploader.deleteMultiple(ids);

      expect(mockProvider.delete).toHaveBeenCalledTimes(3);
      expect(mockProvider.delete).toHaveBeenNthCalledWith(1, 'id1');
      expect(mockProvider.delete).toHaveBeenNthCalledWith(2, 'id2');
      expect(mockProvider.delete).toHaveBeenNthCalledWith(3, 'id3');
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

      await expect(uploader.search({})).rejects.toThrow('Search is not supported by mock provider');
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

  describe('uploadWithTransaction', () => {
    it('should return upload result and commit result on success', async () => {
      const mockProvider = new MockProvider();
      mockProvider.upload.mockResolvedValue(mockResult);

      const uploader = new MediaUploader(mockProvider);
      const file = Buffer.from('test');

      const { uploadResult, commitResult } = await uploader.uploadWithTransaction(
        file,
        { folder: 'test' },
        {
          onCommit: async (result) => {
            return { dbId: 42, storageKey: result.storageKey };
          },
        }
      );

      expect(uploadResult).toBe(mockResult);
      expect(commitResult).toEqual({ dbId: 42, storageKey: 'test-id' });
    });

    it('should call custom onRollback when commit fails', async () => {
      const mockProvider = new MockProvider();
      mockProvider.upload.mockResolvedValue(mockResult);
      mockProvider.delete.mockResolvedValue();

      const onRollback = vi.fn().mockResolvedValue(undefined);

      const uploader = new MediaUploader(mockProvider);
      const file = Buffer.from('test');

      await expect(
        uploader.uploadWithTransaction(
          file,
          { folder: 'test' },
          {
            onCommit: async () => {
              throw new Error('DB insert failed');
            },
            onRollback,
          }
        )
      ).rejects.toThrow('DB insert failed');

      expect(onRollback).toHaveBeenCalledWith(
        mockResult,
        expect.objectContaining({ message: 'DB insert failed' })
      );
      // Default delete should NOT have been called
      expect(mockProvider.delete).not.toHaveBeenCalled();
    });

    it('should delete uploaded file as default rollback when storageKey is present', async () => {
      const mockProvider = new MockProvider();
      mockProvider.upload.mockResolvedValue(mockResult); // storageKey: 'test-id'
      mockProvider.delete.mockResolvedValue();

      const uploader = new MediaUploader(mockProvider);

      await expect(
        uploader.uploadWithTransaction(
          Buffer.from('test'),
          {},
          {
            onCommit: async () => {
              throw new Error('commit fail');
            },
          }
        )
      ).rejects.toThrow('commit fail');

      expect(mockProvider.delete).toHaveBeenCalledWith('test-id');
    });

    it('should not attempt default rollback when storageKey is absent', async () => {
      const noKeyResult: UploadResult = { ...mockResult, storageKey: undefined };
      const mockProvider = new MockProvider();
      mockProvider.upload.mockResolvedValue(noKeyResult);
      mockProvider.delete.mockResolvedValue();

      const uploader = new MediaUploader(mockProvider);

      await expect(
        uploader.uploadWithTransaction(
          Buffer.from('test'),
          {},
          {
            onCommit: async () => {
              throw new Error('commit fail');
            },
          }
        )
      ).rejects.toThrow('commit fail');

      expect(mockProvider.delete).not.toHaveBeenCalled();
    });

    it('should log error and re-throw commit error if rollback also fails', async () => {
      const mockProvider = new MockProvider();
      mockProvider.upload.mockResolvedValue(mockResult);

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const uploader = new MediaUploader(mockProvider);

      await expect(
        uploader.uploadWithTransaction(
          Buffer.from('test'),
          {},
          {
            onCommit: async () => {
              throw new Error('commit fail');
            },
            onRollback: async () => {
              throw new Error('rollback fail');
            },
          }
        )
      ).rejects.toThrow('commit fail');

      expect(consoleSpy).toHaveBeenCalledWith('[FluxMedia] Rollback failed:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

  describe('fallback provider', () => {
    it('should use fallback provider when primary fails with NETWORK_ERROR', async () => {
      const primaryProvider = new MockProvider();
      const fallbackProvider = new MockProvider();
      (fallbackProvider as MockProvider & { name: string }).name = 'fallback' as never;
      Object.defineProperty(fallbackProvider, 'name', { value: 'fallback' });

      const networkError = new MediaError('timeout', MediaErrorCode.NETWORK_ERROR, 'mock');
      primaryProvider.upload.mockRejectedValue(networkError);
      fallbackProvider.upload.mockResolvedValue({ ...mockResult, provider: 'fallback' });

      const onFallback = vi.fn();

      const uploader = new MediaUploader(primaryProvider, [], {
        fallbackProvider,
        onFallback,
      });

      const result = await uploader.upload(Buffer.from('test'), {});

      expect(result.provider).toBe('fallback');
      expect(onFallback).toHaveBeenCalledWith(networkError, 'mock', 'fallback');
    });

    it('should use fallback provider when primary fails with PROVIDER_ERROR', async () => {
      const primaryProvider = new MockProvider();
      const fallbackProvider = new MockProvider();
      Object.defineProperty(fallbackProvider, 'name', { value: 'fallback' });

      const providerError = new MediaError('service down', MediaErrorCode.PROVIDER_ERROR, 'mock');
      primaryProvider.upload.mockRejectedValue(providerError);
      fallbackProvider.upload.mockResolvedValue({ ...mockResult, provider: 'fallback' });

      const uploader = new MediaUploader(primaryProvider, [], { fallbackProvider });

      const result = await uploader.upload(Buffer.from('test'), {});
      expect(result.provider).toBe('fallback');
    });

    it('should NOT failover for non-retryable error codes', async () => {
      const primaryProvider = new MockProvider();
      const fallbackProvider = new MockProvider();
      Object.defineProperty(fallbackProvider, 'name', { value: 'fallback' });

      const validationError = new MediaError('bad file', MediaErrorCode.INVALID_FILE_TYPE, 'mock');
      primaryProvider.upload.mockRejectedValue(validationError);

      const uploader = new MediaUploader(primaryProvider, [], { fallbackProvider });

      await expect(uploader.upload(Buffer.from('test'), {})).rejects.toThrow('bad file');
      expect(fallbackProvider.upload).not.toHaveBeenCalled();
    });

    it('should respect custom fallbackOnErrors list', async () => {
      const primaryProvider = new MockProvider();
      const fallbackProvider = new MockProvider();
      Object.defineProperty(fallbackProvider, 'name', { value: 'fallback' });

      const rateLimitError = new MediaError('rate limited', MediaErrorCode.RATE_LIMITED, 'mock');
      primaryProvider.upload.mockRejectedValue(rateLimitError);
      fallbackProvider.upload.mockResolvedValue({ ...mockResult, provider: 'fallback' });

      const uploader = new MediaUploader(primaryProvider, [], {
        fallbackProvider,
        fallbackOnErrors: [MediaErrorCode.RATE_LIMITED],
      });

      const result = await uploader.upload(Buffer.from('test'), {});
      expect(result.provider).toBe('fallback');
    });

    it('should throw fallback error when both providers fail', async () => {
      const primaryProvider = new MockProvider();
      const fallbackProvider = new MockProvider();
      Object.defineProperty(fallbackProvider, 'name', { value: 'fallback' });

      primaryProvider.upload.mockRejectedValue(
        new MediaError('primary down', MediaErrorCode.NETWORK_ERROR, 'mock')
      );
      fallbackProvider.upload.mockRejectedValue(
        new MediaError('fallback also down', MediaErrorCode.NETWORK_ERROR, 'fallback')
      );

      const uploader = new MediaUploader(primaryProvider, [], { fallbackProvider });

      await expect(uploader.upload(Buffer.from('test'), {})).rejects.toThrow('fallback also down');
    });

    it('should failover on heuristic network errors (non-MediaError)', async () => {
      const primaryProvider = new MockProvider();
      const fallbackProvider = new MockProvider();
      Object.defineProperty(fallbackProvider, 'name', { value: 'fallback' });

      primaryProvider.upload.mockRejectedValue(new Error('ECONNREFUSED'));
      fallbackProvider.upload.mockResolvedValue({ ...mockResult, provider: 'fallback' });

      const uploader = new MediaUploader(primaryProvider, [], { fallbackProvider });

      const result = await uploader.upload(Buffer.from('test'), {});
      expect(result.provider).toBe('fallback');
    });
  });

  describe('onError phase context', () => {
    it('should report phase "upload" when provider upload fails', async () => {
      const mockProvider = new MockProvider();
      mockProvider.upload.mockRejectedValue(new Error('upload boom'));

      const errorHandler = vi.fn();
      const plugin: FluxMediaPlugin = {
        name: 'phase-spy',
        hooks: { onError: errorHandler },
      };

      const uploader = new MediaUploader(mockProvider, [plugin]);

      await expect(uploader.upload(Buffer.from('test'), {})).rejects.toThrow('upload boom');

      expect(errorHandler).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'upload boom' }),
        expect.objectContaining({ phase: 'upload' })
      );
      // uploadResult should NOT be present for 'upload' phase
      expect(errorHandler.mock.calls[0][1].uploadResult).toBeUndefined();
    });

    it('should report phase "afterUpload" with uploadResult when afterUpload hook fails', async () => {
      const mockProvider = new MockProvider();
      mockProvider.upload.mockResolvedValue(mockResult);

      const errorHandler = vi.fn();

      const failingAfterPlugin: FluxMediaPlugin = {
        name: 'failing-after',
        hooks: {
          afterUpload: async () => {
            throw new Error('afterUpload hook boom');
          },
        },
      };
      const spyPlugin: FluxMediaPlugin = {
        name: 'error-spy',
        hooks: { onError: errorHandler },
      };

      const uploader = new MediaUploader(mockProvider, [failingAfterPlugin, spyPlugin]);

      await expect(uploader.upload(Buffer.from('test'), {})).rejects.toThrow(
        'afterUpload hook boom'
      );

      expect(errorHandler).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'afterUpload hook boom' }),
        expect.objectContaining({
          phase: 'afterUpload',
          uploadResult: mockResult,
        })
      );
    });
  });

  describe('plugins in constructor', () => {
    it('should register plugins passed to constructor', async () => {
      const mockProvider = new MockProvider();
      mockProvider.upload.mockResolvedValue(mockResult);

      const hook = vi
        .fn()
        .mockImplementation(async (file: UploadInput, options) => ({ file, options }));
      const plugin: FluxMediaPlugin = {
        name: 'ctor-plugin',
        hooks: { beforeUpload: hook },
      };

      const uploader = new MediaUploader(mockProvider, [plugin]);
      await uploader.upload(Buffer.from('test'), {});

      expect(hook).toHaveBeenCalled();
    });
  });
});

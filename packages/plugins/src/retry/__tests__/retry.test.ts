import { describe, it, expect, vi } from 'vitest';
import { createRetryPlugin, withRetry, getRetryConfig } from '../index';
import { MediaError, MediaErrorCode, PartialUploadError } from '@fluxmedia/core';
import type { PartialUploadContext } from '@fluxmedia/core';

describe('RetryPlugin', () => {
  describe('createRetryPlugin', () => {
    it('should add retry config to metadata', async () => {
      const plugin = createRetryPlugin({
        maxRetries: 5,
        retryDelay: 500,
      });

      const file = Buffer.from('test');

      const result = await plugin.hooks.beforeUpload!(file, {});

      expect(result).toBeDefined();
      expect(result!.options.metadata?._retry).toMatchObject({
        maxRetries: 5,
        currentAttempt: 0,
      });
    });

    it('should use default options', async () => {
      const plugin = createRetryPlugin();

      expect(plugin.name).toBe('retry');
      expect(plugin.version).toBe('1.0.0');
    });
  });

  describe('getRetryConfig', () => {
    it('should extract retry config from options', async () => {
      const plugin = createRetryPlugin({ maxRetries: 3 });
      const file = Buffer.from('test');

      const result = await plugin.hooks.beforeUpload!(file, {});
      const config = getRetryConfig(result!.options);

      expect(config).toBeDefined();
      expect(config!.maxRetries).toBe(3);
    });
  });
});

describe('withRetry', () => {
  describe('retry behavior', () => {
    it('should succeed on first attempt', async () => {
      const fn = vi.fn().mockResolvedValue('success');

      const result = await withRetry(fn, { maxRetries: 3 });

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should retry on network errors', async () => {
      let attempts = 0;
      const fn = vi.fn().mockImplementation(async () => {
        attempts++;
        if (attempts < 3) {
          throw new MediaError('Network error', MediaErrorCode.NETWORK_ERROR, 'test');
        }
        return 'success';
      });

      const result = await withRetry(fn, {
        maxRetries: 3,
        retryDelay: 10,
        exponentialBackoff: false,
      });

      expect(result).toBe('success');
      expect(attempts).toBe(3);
    });

    it('should not retry on non-retryable errors', async () => {
      const fn = vi
        .fn()
        .mockRejectedValue(
          new MediaError('Invalid file', MediaErrorCode.INVALID_FILE_TYPE, 'test')
        );

      await expect(
        withRetry(fn, {
          maxRetries: 3,
          retryableErrors: [MediaErrorCode.NETWORK_ERROR],
        })
      ).rejects.toThrow('Invalid file');

      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should call onRetry callback', async () => {
      const onRetry = vi.fn();
      let attempts = 0;

      const fn = vi.fn().mockImplementation(async () => {
        attempts++;
        if (attempts < 2) {
          throw new MediaError('Network error', MediaErrorCode.NETWORK_ERROR, 'test');
        }
        return 'success';
      });

      await withRetry(fn, {
        maxRetries: 3,
        retryDelay: 10,
        onRetry,
      });

      expect(onRetry).toHaveBeenCalledWith(1, expect.any(Error), expect.any(Number));
    });

    it('should use exponential backoff', async () => {
      const onRetry = vi.fn();
      let attempts = 0;

      const fn = vi.fn().mockImplementation(async () => {
        attempts++;
        if (attempts < 3) {
          throw new MediaError('Network error', MediaErrorCode.NETWORK_ERROR, 'test');
        }
        return 'success';
      });

      await withRetry(fn, {
        maxRetries: 3,
        retryDelay: 100,
        exponentialBackoff: true,
        onRetry,
      });

      // First retry: 100ms, second retry: 200ms
      expect(onRetry).toHaveBeenNthCalledWith(1, 1, expect.any(Error), 100);
      expect(onRetry).toHaveBeenNthCalledWith(2, 2, expect.any(Error), 200);
    });

    it('should fail after max retries', async () => {
      const fn = vi
        .fn()
        .mockRejectedValue(new MediaError('Network error', MediaErrorCode.NETWORK_ERROR, 'test'));

      await expect(
        withRetry(fn, {
          maxRetries: 2,
          retryDelay: 10,
        })
      ).rejects.toThrow('Network error');

      expect(fn).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });

    it('should use custom shouldRetry function', async () => {
      const shouldRetry = vi.fn().mockReturnValue(false);

      const fn = vi.fn().mockRejectedValue(new Error('Custom error'));

      await expect(
        withRetry(fn, {
          maxRetries: 3,
          shouldRetry,
        })
      ).rejects.toThrow('Custom error');

      expect(shouldRetry).toHaveBeenCalledWith(expect.any(Error), 0);
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  describe('resume context from PartialUploadError', () => {
    it('should pass resume context to subsequent retry attempts', async () => {
      const partialContext: PartialUploadContext = {
        uploadId: 'mpu-123',
        key: 'uploads/video.mp4',
        completedParts: [
          { partNumber: 1, etag: '"abc"' },
          { partNumber: 2, etag: '"def"' },
        ],
        provider: 's3',
      };

      let attempt = 0;
      const fn = vi.fn().mockImplementation(async (resumeCtx?: PartialUploadContext) => {
        attempt++;
        if (attempt === 1) {
          // First attempt: partial upload fails
          throw new PartialUploadError('Connection lost mid-upload', 's3', partialContext);
        }
        // Second attempt: receives resume context
        return { resumed: true, context: resumeCtx };
      });

      const result = await withRetry(fn, {
        maxRetries: 3,
        retryDelay: 10,
        exponentialBackoff: false,
      });

      expect(fn).toHaveBeenCalledTimes(2);
      // First call: no resume context
      expect(fn.mock.calls[0][0]).toBeUndefined();
      // Second call: resume context from PartialUploadError
      expect(fn.mock.calls[1][0]).toEqual(partialContext);
      expect(result).toEqual({ resumed: true, context: partialContext });
    });

    it('should preserve latest resume context across multiple failures', async () => {
      const context1: PartialUploadContext = {
        uploadId: 'mpu-123',
        key: 'uploads/video.mp4',
        completedParts: [{ partNumber: 1, etag: '"abc"' }],
        provider: 's3',
      };
      const context2: PartialUploadContext = {
        uploadId: 'mpu-123',
        key: 'uploads/video.mp4',
        completedParts: [
          { partNumber: 1, etag: '"abc"' },
          { partNumber: 2, etag: '"def"' },
        ],
        provider: 's3',
      };

      let attempt = 0;
      const fn = vi.fn().mockImplementation(async () => {
        attempt++;
        if (attempt === 1) throw new PartialUploadError('fail 1', 's3', context1);
        if (attempt === 2) throw new PartialUploadError('fail 2', 's3', context2);
        return 'success';
      });

      const result = await withRetry(fn, {
        maxRetries: 3,
        retryDelay: 10,
        exponentialBackoff: false,
      });

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(3);
      // Third call should receive the LATEST context (context2)
      expect(fn.mock.calls[2][0]).toEqual(context2);
    });

    it('should not pass resume context for non-PartialUploadError failures', async () => {
      let attempt = 0;
      const fn = vi.fn().mockImplementation(async (resumeCtx?: PartialUploadContext) => {
        attempt++;
        if (attempt === 1) {
          throw new MediaError('Network error', MediaErrorCode.NETWORK_ERROR, 'test');
        }
        return { resumed: false, context: resumeCtx };
      });

      const result = await withRetry(fn, {
        maxRetries: 3,
        retryDelay: 10,
        exponentialBackoff: false,
      });

      expect(fn).toHaveBeenCalledTimes(2);
      // No resume context for regular MediaError
      expect(fn.mock.calls[1][0]).toBeUndefined();
      expect(result).toEqual({ resumed: false, context: undefined });
    });
  });
});

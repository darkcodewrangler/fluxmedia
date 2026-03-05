/**
 * Retry Plugin for FluxMedia
 *
 * Provides configurable retry behavior with exponential backoff.
 */

import {
  type FluxMediaPlugin,
  type UploadOptions,
  MediaError,
  MediaErrorCode,
  PartialUploadError,
  type PartialUploadContext,
} from '@fluxmedia/core';

/**
 * Options for the retry plugin
 */
export interface RetryOptions {
  /** Maximum number of retries (default: 3) */
  maxRetries?: number;
  /** Base delay in milliseconds (default: 1000) */
  retryDelay?: number;
  /** Use exponential backoff (default: true) */
  exponentialBackoff?: boolean;
  /** Error codes that should trigger a retry */
  retryableErrors?: MediaErrorCode[];
  /** Callback when a retry is attempted */
  onRetry?: ((attempt: number, error: Error, nextDelay: number) => void) | undefined;
  /** Custom function to determine if error should be retried */
  shouldRetry?: ((error: Error, attempt: number) => boolean) | undefined;
}

/**
 * Retry configuration stored in metadata
 */
export interface RetryMetadata {
  maxRetries: number;
  currentAttempt: number;
  config: RetryOptions;
}

/**
 * Default retryable error codes
 */
const DEFAULT_RETRYABLE_ERRORS: MediaErrorCode[] = [
  MediaErrorCode.NETWORK_ERROR,
  MediaErrorCode.RATE_LIMITED,
  MediaErrorCode.UPLOAD_FAILED,
];

/**
 * Sleep for a given number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Check if an error is retryable
 */
function isRetryableError(error: Error, retryableErrors: MediaErrorCode[]): boolean {
  if (error instanceof MediaError) {
    return retryableErrors.includes(error.code);
  }

  // Check for common network errors by message
  const message = error.message.toLowerCase();
  return (
    message.includes('network') ||
    message.includes('timeout') ||
    message.includes('econnrefused') ||
    message.includes('econnreset') ||
    message.includes('rate limit') ||
    message.includes('socket hang up')
  );
}

/**
 * Create a retry plugin
 *
 * Note: This plugin provides retry configuration. The actual retry logic
 * can be implemented using the `withRetry` utility function.
 *
 * @param options - Retry options
 * @returns FluxMediaPlugin instance
 *
 * @example
 * ```typescript
 * const retryPlugin = createRetryPlugin({
 *   maxRetries: 3,
 *   exponentialBackoff: true,
 *   onRetry: (attempt, error, delay) => {
 *     console.log(`Retry ${attempt} after ${delay}ms: ${error.message}`);
 *   },
 * });
 * ```
 */
export function createRetryPlugin(options: RetryOptions = {}): FluxMediaPlugin {
  const config: Required<Omit<RetryOptions, 'shouldRetry' | 'onRetry'>> &
    Pick<RetryOptions, 'shouldRetry' | 'onRetry'> = {
    maxRetries: options.maxRetries ?? 3,
    retryDelay: options.retryDelay ?? 1000,
    exponentialBackoff: options.exponentialBackoff ?? true,
    retryableErrors: options.retryableErrors ?? DEFAULT_RETRYABLE_ERRORS,
    onRetry: options.onRetry,
    shouldRetry: options.shouldRetry,
  };

  return {
    name: 'retry',
    version: '1.0.0',
    hooks: {
      async beforeUpload(
        file: File | Buffer,
        uploadOptions: UploadOptions
      ): Promise<{ file: File | Buffer; options: UploadOptions } | void> {
        // Store retry configuration in metadata
        const retryMetadata: RetryMetadata = {
          maxRetries: config.maxRetries,
          currentAttempt: 0,
          config,
        };

        const enrichedOptions: UploadOptions = {
          ...uploadOptions,
          metadata: {
            ...uploadOptions.metadata,
            _retry: retryMetadata,
          },
        };

        return { file, options: enrichedOptions };
      },
    },
  };
}

/**
 * Wrap an async function with retry logic.
 *
 * When the function throws a `PartialUploadError`, the captured upload context
 * is passed to subsequent attempts so the upload can resume from where it left
 * off instead of restarting from scratch. The `fn` receives an optional
 * `resumeContext` argument that carries the partial upload state.
 *
 * @param fn - Async function to wrap. Receives optional resume context on retries.
 * @param options - Retry options
 * @returns Promise that resolves with the function result or rejects after all retries
 *
 * @example
 * ```typescript
 * const result = await withRetry(
 *   (resumeCtx) => uploader.upload(file, { ...opts, _resumeContext: resumeCtx }),
 *   {
 *     maxRetries: 3,
 *     exponentialBackoff: true,
 *     onRetry: (attempt, error, delay) => {
 *       console.log(`Retry ${attempt} after ${delay}ms`);
 *     },
 *   }
 * );
 * ```
 */
export async function withRetry<T>(
  fn: (resumeContext?: PartialUploadContext) => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const config = {
    maxRetries: options.maxRetries ?? 3,
    retryDelay: options.retryDelay ?? 1000,
    exponentialBackoff: options.exponentialBackoff ?? true,
    retryableErrors: options.retryableErrors ?? DEFAULT_RETRYABLE_ERRORS,
    onRetry: options.onRetry,
    shouldRetry: options.shouldRetry,
  };

  let lastError: Error = new Error('Unknown error');
  let resumeContext: PartialUploadContext | undefined;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await fn(resumeContext);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Capture resume context from partial uploads
      if (error instanceof PartialUploadError) {
        resumeContext = error.uploadContext;
      }

      // Check if we should retry
      const shouldRetry = config.shouldRetry
        ? config.shouldRetry(lastError, attempt)
        : isRetryableError(lastError, config.retryableErrors);

      // Don't retry if this was the last attempt or error is not retryable
      if (attempt === config.maxRetries || !shouldRetry) {
        throw lastError;
      }

      // Calculate delay
      const delay = config.exponentialBackoff
        ? config.retryDelay * Math.pow(2, attempt)
        : config.retryDelay;

      // Call onRetry callback
      if (config.onRetry) {
        config.onRetry(attempt + 1, lastError, delay);
      }

      // Wait before retrying
      await sleep(delay);
    }
  }

  throw lastError;
}

/**
 * Get retry configuration from upload options metadata
 */
export function getRetryConfig(options: UploadOptions): RetryMetadata | undefined {
  return options.metadata?._retry as RetryMetadata | undefined;
}

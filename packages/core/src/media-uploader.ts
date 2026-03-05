import type {
  MediaProvider,
  UploadOptions,
  UploadResult,
  UploadInput,
  TransformationOptions,
  SearchOptions,
} from './types';
import { MediaErrorCode, MediaError } from './errors';
import { PluginManager, type FluxMediaPlugin } from './plugin';

/**
 * Configuration for MediaUploader with optional fallback provider.
 */
export interface MediaUploaderConfig {
  /**
   * Provider to use if the primary provider fails with a retryable error.
   */
  fallbackProvider?: MediaProvider;

  /**
   * Error codes that trigger failover to the fallback provider.
   * Defaults to NETWORK_ERROR and PROVIDER_ERROR.
   */
  fallbackOnErrors?: MediaErrorCode[];

  /**
   * Called when failover occurs. Useful for alerting / observability.
   */
  onFallback?: (error: Error, fromProvider: string, toProvider: string) => void;
}

/**
 * Main entry point for FluxMedia.
 * Provides a unified API for uploading to any supported provider.
 *
 * @example
 * ```typescript
 * import { MediaUploader } from '@fluxmedia/core';
 * import { CloudinaryProvider } from '@fluxmedia/cloudinary';
 *
 * const uploader = new MediaUploader(
 *   new CloudinaryProvider({
 *     cloudName: 'your-cloud',
 *     apiKey: 'your-key',
 *     apiSecret: 'your-secret'
 *   })
 * );
 *
 * // Register plugins
 * uploader.use({
 *   name: 'logger',
 *   hooks: {
 *     beforeUpload: async (file, options) => {
 *       console.log('Uploading:', file);
 *       return { file, options };
 *     }
 *   }
 * });
 *
 * const result = await uploader.upload(file, {
 *   folder: 'avatars',
 *   transformation: { width: 400, format: 'webp' }
 * });
 * ```
 */
export class MediaUploader {
  /**
   * The underlying provider instance
   */
  public readonly provider: MediaProvider;

  /**
   * Plugin manager with caching and override support
   */
  public readonly plugins: PluginManager;

  /**
   * Optional configuration with fallback provider support.
   */
  private readonly config: MediaUploaderConfig;

  /**
   * Default error codes that trigger fallback.
   */
  private static readonly DEFAULT_FALLBACK_ERRORS: MediaErrorCode[] = [
    MediaErrorCode.NETWORK_ERROR,
    MediaErrorCode.PROVIDER_ERROR,
  ];

  /**
   * Create a new MediaUploader instance.
   *
   * @param provider - Provider implementation (e.g., CloudinaryProvider, S3Provider)
   * @param plugins - Optional array of plugins to register on creation
   * @param config - Optional configuration with fallback provider support
   */
  constructor(provider: MediaProvider, plugins?: FluxMediaPlugin[], config?: MediaUploaderConfig) {
    this.provider = provider;
    this.plugins = new PluginManager();
    this.config = config ?? {};

    // Register initial plugins if provided
    if (plugins?.length) {
      // Use sync registration for constructor (plugins can use async init)
      for (const plugin of plugins) {
        this.plugins.register(plugin);
      }
    }
  }

  /**
   * Register a plugin.
   * If a plugin with the same name exists, it will be overridden (last takes precedence).
   *
   * @param plugin - Plugin to register
   * @returns Promise resolving to this uploader for chaining
   *
   * @example
   * ```typescript
   * await uploader
   *   .use(loggerPlugin)
   *   .use(compressionPlugin)
   *   .use(validationPlugin);
   * ```
   */
  async use(plugin: FluxMediaPlugin): Promise<this> {
    await this.plugins.register(plugin);
    return this;
  }

  /**
   * Upload a file to the configured provider.
   * Runs beforeUpload and afterUpload plugin hooks.
   *
   * @param file - File to upload (browser File, Node.js Buffer, or readable stream)
   * @param options - Upload options
   * @returns Promise resolving to upload result
   * @throws {MediaError} If upload fails
   */
  async upload(file: UploadInput, options?: UploadOptions): Promise<UploadResult> {
    // Run beforeUpload hooks
    const { file: processedFile, options: processedOptions } = await this.plugins.runBeforeUpload(
      file,
      options ?? {}
    );

    let result: UploadResult;
    try {
      // Perform the actual upload
      result = await this.provider.upload(processedFile, processedOptions);
    } catch (primaryError) {
      // Check if we should failover to the fallback provider
      if (this.config.fallbackProvider && this.shouldFallback(primaryError)) {
        this.config.onFallback?.(
          primaryError instanceof Error ? primaryError : new Error(String(primaryError)),
          this.provider.name,
          this.config.fallbackProvider.name
        );
        try {
          result = await this.config.fallbackProvider.upload(processedFile, processedOptions);
        } catch (fallbackError) {
          // Fallback also failed — report the fallback error
          await this.plugins.runOnError(
            fallbackError instanceof Error ? fallbackError : new Error(String(fallbackError)),
            { file: processedFile, options: processedOptions, phase: 'upload' }
          );
          throw fallbackError;
        }
      } else {
        // No fallback — report the primary error
        await this.plugins.runOnError(
          primaryError instanceof Error ? primaryError : new Error(String(primaryError)),
          { file: processedFile, options: processedOptions, phase: 'upload' }
        );
        throw primaryError;
      }
    }

    try {
      // Run afterUpload hooks
      result = await this.plugins.runAfterUpload(result);
      return result;
    } catch (error) {
      // A post-upload hook failed — the uploaded object exists and may need cleanup
      await this.plugins.runOnError(error instanceof Error ? error : new Error(String(error)), {
        file: processedFile,
        options: processedOptions,
        phase: 'afterUpload',
        uploadResult: result,
      });
      throw error;
    }
  }

  /**
   * Delete a file by its ID.
   * Runs beforeDelete and afterDelete plugin hooks.
   *
   * @param id - File identifier from upload result
   * @returns Promise that resolves when deletion is complete
   * @throws {MediaError} If deletion fails
   */
  async delete(id: string): Promise<void> {
    // Run beforeDelete hooks
    const processedId = await this.plugins.runBeforeDelete(id);

    await this.provider.delete(processedId);

    // Run afterDelete hooks
    await this.plugins.runAfterDelete(processedId);
  }

  /**
   * Get metadata for a file.
   *
   * @param id - File identifier
   * @returns Promise resolving to file metadata
   * @throws {MediaError} If file not found
   */
  async get(id: string): Promise<UploadResult> {
    return this.provider.get(id);
  }

  /**
   * Generate a URL for accessing a file, optionally with transformations.
   * Runs beforeGetUrl plugin hooks.
   *
   * @param id - File identifier
   * @param transform - Optional transformation options
   * @returns URL string
   */
  getUrl(id: string, transform?: TransformationOptions): string {
    // Note: This is sync so we can't run async hooks here.
    // For async URL generation, use getUrlAsync.
    return this.provider.getUrl(id, transform);
  }

  /**
   * Generate a URL with async plugin hook support.
   *
   * @param id - File identifier
   * @param transform - Optional transformation options
   * @returns Promise resolving to URL string
   */
  async getUrlAsync(id: string, transform?: TransformationOptions): Promise<string> {
    const { id: processedId, transform: processedTransform } = await this.plugins.runBeforeGetUrl(
      id,
      transform
    );

    return this.provider.getUrl(processedId, processedTransform);
  }

  /**
   * Upload multiple files in batch.
   *
   * @param files - Array of files to upload
   * @param options - Upload options (applied to all files)
   * @returns Promise resolving to array of upload results
   * @throws {MediaError} If any upload fails
   */
  async uploadMultiple(files: UploadInput[], options?: UploadOptions): Promise<UploadResult[]> {
    // Use individual upload to ensure plugins run for each file
    const results: UploadResult[] = [];
    for (const file of files) {
      results.push(await this.upload(file, options));
    }
    return results;
  }

  /**
   * Delete multiple files in batch.
   *
   * @param ids - Array of file identifiers
   * @returns Promise that resolves when all deletions are complete
   * @throws {MediaError} If any deletion fails
   */
  async deleteMultiple(ids: string[]): Promise<void> {
    // Use individual delete to ensure plugins run for each file
    for (const id of ids) {
      await this.delete(id);
    }
  }

  /**
   * Search for files (if provider supports search).
   *
   * @param query - Search options
   * @returns Promise resolving to matching files
   * @throws {MediaError} If search fails or not supported
   */
  async search(query: SearchOptions): Promise<UploadResult[]> {
    if (!this.provider.search) {
      throw new Error(`Search is not supported by ${this.provider.name} provider`);
    }
    return this.provider.search(query);
  }

  /**
   * Check if the provider supports a specific feature.
   *
   * @param feature - Feature path (e.g., 'transformations.resize')
   * @returns Whether the feature is supported
   */
  supports(feature: string): boolean {
    const parts = feature.split('.');
    let current: unknown = this.provider.features;

    for (const part of parts) {
      if (typeof current === 'object' && current !== null && part in current) {
        current = (current as Record<string, unknown>)[part];
      } else {
        return false;
      }
    }

    return current === true;
  }

  /**
   * Upload a file with transactional semantics.
   *
   * Performs the upload, then calls `onCommit`. If `onCommit` throws
   * (e.g. a database insert fails), the uploaded file is automatically
   * rolled back by calling `onRollback` or, if no custom rollback is
   * provided, by deleting the uploaded file via `this.delete()`.
   *
   * Requires the upload result to include `storageKey` for the default
   * rollback to function correctly.
   *
   * @param file - File to upload
   * @param options - Upload options
   * @param callbacks - Transaction callbacks
   * @returns The upload result and the commit result
   *
   * @example
   * ```typescript
   * const { uploadResult } = await uploader.uploadWithTransaction(
   *   videoBuffer,
   *   { folder: 'videos', filename: 'intro' },
   *   {
   *     onCommit: async (result) => {
   *       await db.files.insert({ storageKey: result.storageKey, url: result.url });
   *     },
   *   }
   * );
   * ```
   */
  async uploadWithTransaction<T = void>(
    file: UploadInput,
    options: UploadOptions,
    { onCommit, onRollback }: TransactionCallbacks<T>
  ): Promise<{ uploadResult: UploadResult; commitResult: T }> {
    const uploadResult = await this.upload(file, options);

    try {
      const commitResult = await onCommit(uploadResult);
      return { uploadResult, commitResult };
    } catch (commitError) {
      const err = commitError instanceof Error ? commitError : new Error(String(commitError));

      if (onRollback) {
        try {
          await onRollback(uploadResult, err);
        } catch (rollbackError) {
          console.error('[FluxMedia] Rollback failed:', rollbackError);
        }
      } else if (uploadResult.storageKey) {
        // Default rollback: delete the uploaded file
        try {
          await this.delete(uploadResult.storageKey);
        } catch (deleteError) {
          console.error('[FluxMedia] Default rollback (delete) failed:', deleteError);
        }
      }

      throw err;
    }
  }

  /**
   * Determine whether a failed upload should fall back to the fallback provider.
   */
  private shouldFallback(error: unknown): boolean {
    const fallbackCodes = this.config.fallbackOnErrors ?? MediaUploader.DEFAULT_FALLBACK_ERRORS;

    if (error instanceof MediaError) {
      return fallbackCodes.includes(error.code);
    }

    // Heuristic: common network-level error messages
    if (error instanceof Error) {
      const msg = error.message.toLowerCase();
      return (
        msg.includes('network') ||
        msg.includes('timeout') ||
        msg.includes('econnrefused') ||
        msg.includes('econnreset') ||
        msg.includes('socket hang up')
      );
    }

    return false;
  }
}

/**
 * Callbacks for `uploadWithTransaction()`.
 */
export interface TransactionCallbacks<T> {
  /** Called after upload succeeds. Throw to trigger rollback. */
  onCommit: (result: UploadResult) => Promise<T>;
  /** Called if onCommit throws. Receives the upload result for cleanup. */
  onRollback?: (result: UploadResult, error: Error) => Promise<void>;
}

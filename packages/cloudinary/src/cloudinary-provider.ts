import type {
  MediaProvider,
  UploadOptions,
  UploadResult,
  UploadInput,
  TransformationOptions,
  ProviderFeatures,
} from '@fluxmedia/core';
import { MediaErrorCode, createMediaError, getFileType } from '@fluxmedia/core';
import type { Readable } from 'node:stream';
import { CloudinaryFeatures } from './features';
import type {
  CloudinaryConfig,
  CloudinaryUploadOptions,
  CloudinaryUploadResponse,
  CloudinaryClient,
} from './types';

// Cached SDK import for performance (shared across all instances)
let cachedCloudinary: typeof import('cloudinary').v2 | null = null;

async function getCloudinarySDK() {
  if (!cachedCloudinary) {
    const cloudinaryModule = await import('cloudinary');
    cachedCloudinary = cloudinaryModule.v2;
  }
  return cachedCloudinary;
}

/**
 * Cloudinary provider implementation.
 * Provides full-featured media upload with transformations, AI tagging, and more.
 */
export class CloudinaryProvider implements MediaProvider {
  readonly name: string = 'cloudinary';
  readonly features: ProviderFeatures = CloudinaryFeatures;

  private client: CloudinaryClient | null = null;
  private clientPromise: Promise<CloudinaryClient> | null = null;
  private config!: CloudinaryConfig;

  constructor(config: CloudinaryConfig) {
    // Issue #2: Validate required configuration fields
    const required: (keyof CloudinaryConfig)[] = ['cloudName', 'apiKey', 'apiSecret'];
    const missing = required.filter((field) => !config[field]);

    if (missing.length > 0) {
      throw createMediaError(
        MediaErrorCode.INVALID_CONFIG,
        'cloudinary',
        new Error(`Missing required Cloudinary configuration: ${missing.join(', ')}`)
      );
    }

    // Validate field types
    if (typeof config.cloudName !== 'string' || config.cloudName.trim().length === 0) {
      throw createMediaError(
        MediaErrorCode.INVALID_CONFIG,
        'cloudinary',
        new Error('cloudName must be a non-empty string')
      );
    }

    // Issue #6: Store config in a non-enumerable property to prevent credential exposure
    Object.defineProperty(this, 'config', {
      value: {
        ...config,
        secure: config.secure ?? true,
      },
      writable: false,
      enumerable: false,
      configurable: false,
    });
  }

  /**
   * Prevent credentials from being exposed via JSON.stringify
   */
  toJSON() {
    return {
      name: this.name,
      features: this.features,
    };
  }

  /**
   * Get safe config info for debugging (no secrets)
   */
  getConfigInfo() {
    return {
      cloudName: this.config.cloudName,
      secure: this.config.secure,
    };
  }

  /**
   * Issue #3: Thread-safe client initialization using promise synchronization.
   * Prevents race conditions when multiple operations call ensureClient() concurrently.
   */
  private async ensureClient(): Promise<CloudinaryClient> {
    if (!this.clientPromise) {
      this.clientPromise = this.initializeClient();
    }
    return this.clientPromise;
  }

  private async initializeClient(): Promise<CloudinaryClient> {
    const cloudinary = await getCloudinarySDK();
    cloudinary.config({
      cloud_name: this.config.cloudName,
      api_key: this.config.apiKey,
      api_secret: this.config.apiSecret,
      secure: this.config.secure,
    });
    this.client = cloudinary;
    return this.client;
  }

  async upload(file: UploadInput, options?: UploadOptions): Promise<UploadResult> {
    const client = await this.ensureClient();

    try {
      // Determine if the input is a stream
      const isStream = this.isStreamInput(file);

      // Issue #10: Detect resource type for better performance
      const cloudinaryOptions = await this.mapOptions(
        options,
        isStream ? undefined : (file as File | Buffer)
      );

      // For streams, use resource_type from contentType if not already set
      if (isStream && !cloudinaryOptions.resource_type) {
        cloudinaryOptions.resource_type = this.resourceTypeFromContentType(options?.contentType);
      }

      // Issue #4: Progress tracking with estimation
      if (options?.onProgress) {
        options.onProgress(0);
      }

      let result: CloudinaryUploadResponse;

      if (isStream) {
        // Stream upload via upload_stream
        result = await this.uploadFromStream(
          client,
          file as Readable | ReadableStream<Uint8Array>,
          cloudinaryOptions,
          options
        );
      } else if (file instanceof Buffer) {
        // Buffer → data URI for Cloudinary SDK
        const detectedType = await getFileType(file);
        const mimeType = detectedType?.mime ?? 'application/octet-stream';
        const uploadData = `data:${mimeType};base64,${file.toString('base64')}`;

        if (options?.onProgress) {
          options.onProgress(30); // Base64 conversion complete
        }

        if (options?.onProgress) {
          options.onProgress(50); // Starting upload
        }

        result = await client.uploader.upload(uploadData, cloudinaryOptions);
      } else {
        // File object
        if (options?.onProgress) {
          options.onProgress(10);
        }

        if (options?.onProgress) {
          options.onProgress(50); // Starting upload
        }

        result = await client.uploader.upload(file as unknown as string, cloudinaryOptions);
      }

      if (options?.onProgress) {
        options.onProgress(100);
      }

      return this.normalizeResult(result);
    } catch (error) {
      throw this.mapCloudinaryError(error, 'upload');
    }
  }

  async delete(id: string, options?: { resourceType?: 'image' | 'video' | 'raw' }): Promise<void> {
    const client = await this.ensureClient();

    try {
      // Issue #12: Support resource type option for deleting non-image resources
      const deleteOptions = options?.resourceType
        ? { resource_type: options.resourceType }
        : undefined;

      const result = await client.uploader.destroy(id, deleteOptions);

      // Issue #5: Handle "not found" gracefully - it's already deleted
      if (result.result !== 'ok' && result.result !== 'not found') {
        throw new Error(`Delete failed: ${result.result}`);
      }
    } catch (error) {
      throw this.mapCloudinaryError(error, 'delete');
    }
  }

  async get(id: string): Promise<UploadResult> {
    const client = await this.ensureClient();

    try {
      const result = await client.uploader.explicit(id, { type: 'upload' });
      return this.normalizeResult(result);
    } catch (error) {
      throw this.mapCloudinaryError(error, 'get');
    }
  }

  getUrl(id: string, transform?: TransformationOptions): string {
    const options = transform ? { transformation: [this.mapTransformations(transform)] } : {};

    // Issue #9: Consistent URL generation
    if (this.client) {
      return this.client.url(id, options);
    }

    // Fallback: construct URL manually with transformation support
    const protocol = this.config.secure ? 'https' : 'http';
    const transformPath = transform ? this.buildTransformationPath(transform) : '';

    const basePath = transformPath
      ? `${protocol}://res.cloudinary.com/${this.config.cloudName}/image/upload/${transformPath}/${id}`
      : `${protocol}://res.cloudinary.com/${this.config.cloudName}/image/upload/${id}`;

    return basePath;
  }

  async uploadMultiple(
    files: File[] | Buffer[],
    options?: UploadOptions & {
      concurrency?: number;
      onBatchProgress?: (completed: number, total: number) => void;
    }
  ): Promise<UploadResult[]> {
    // Batched processing with concurrency control
    const concurrency = options?.concurrency ?? 5;
    const results: UploadResult[] = [];
    let completedCount = 0;

    for (let i = 0; i < files.length; i += concurrency) {
      const batch = files.slice(i, i + concurrency);
      const batchResults = await Promise.all(
        batch.map((file, batchIndex) => {
          const globalIndex = i + batchIndex;

          // Issue #8: Create isolated options for each file
          // Destructure to separate onProgress from rest to avoid type issues
          const { onProgress, concurrency: _, onBatchProgress: __, ...restOptions } = options ?? {};
          const fileOptions: UploadOptions = {
            ...restOptions,
          };

          // Wrap individual progress callback to include file index
          if (onProgress) {
            fileOptions.onProgress = (percent: number) => {
              // Calculate overall progress considering batch position
              const fileProgress = percent / 100;
              const overallProgress = ((globalIndex + fileProgress) / files.length) * 100;
              onProgress(Math.round(overallProgress));
            };
          }

          // Remove batch-specific options
          delete (fileOptions as Record<string, unknown>).concurrency;
          delete (fileOptions as Record<string, unknown>).onBatchProgress;

          return this.upload(file, fileOptions).then((result) => {
            completedCount++;
            options?.onBatchProgress?.(completedCount, files.length);
            return result;
          });
        })
      );
      results.push(...batchResults);
    }

    return results;
  }

  async deleteMultiple(ids: string[]): Promise<void> {
    // Batched processing with concurrency control
    const concurrency = 10;
    const failed: Array<{ id: string; error: unknown }> = [];

    for (let i = 0; i < ids.length; i += concurrency) {
      const batch = ids.slice(i, i + concurrency);
      // Use Promise.allSettled for partial failure handling
      const results = await Promise.allSettled(
        batch.map((id) => this.delete(id).then(() => ({ id })))
      );

      results.forEach((result, index) => {
        const id = batch[index]!;
        if (result.status === 'rejected') {
          failed.push({ id, error: result.reason });
        }
      });
    }

    if (failed.length > 0) {
      throw createMediaError(
        MediaErrorCode.DELETE_FAILED,
        this.name,
        new Error(
          `Failed to delete ${failed.length} of ${ids.length} files: ${failed.map((f) => f.id).join(', ')}`
        )
      );
    }
  }

  /**
   * Access to the native Cloudinary SDK client.
   * Returns the full cloudinary.v2 SDK with all methods and types.
   */
  get native(): CloudinaryClient | null {
    return this.client;
  }

  /**
   * Issue #5: Map Cloudinary-specific errors to appropriate MediaErrorCodes
   */
  private mapCloudinaryError(error: unknown, operation: 'upload' | 'delete' | 'get'): Error {
    const err = error as Record<string, unknown>;
    const errorMessage = err?.message ?? String(error);
    const httpCode = (err?.http_code ?? (err?.error as Record<string, unknown>)?.http_code) as
      | number
      | undefined;

    // Authentication errors
    if (httpCode === 401 || String(errorMessage).includes('Invalid API key')) {
      return createMediaError(
        MediaErrorCode.INVALID_CREDENTIALS,
        this.name,
        new Error('Invalid Cloudinary credentials - check apiKey and apiSecret'),
        { httpCode }
      );
    }

    // Quota errors
    if (httpCode === 402 || String(errorMessage).toLowerCase().includes('quota')) {
      return createMediaError(
        MediaErrorCode.QUOTA_EXCEEDED,
        this.name,
        new Error('Cloudinary account quota exceeded'),
        { httpCode }
      );
    }

    // Not found errors
    if (httpCode === 404 || String(errorMessage).toLowerCase().includes('not found')) {
      return createMediaError(
        MediaErrorCode.FILE_NOT_FOUND,
        this.name,
        new Error(`File not found`),
        { httpCode }
      );
    }

    // Network/timeout errors
    if (
      httpCode === 408 ||
      String(errorMessage).toLowerCase().includes('timeout') ||
      String(errorMessage).includes('ETIMEDOUT')
    ) {
      return createMediaError(
        MediaErrorCode.NETWORK_ERROR,
        this.name,
        new Error('Request timeout - network may be slow or file too large'),
        { httpCode }
      );
    }

    // Invalid file errors
    if (
      String(errorMessage).includes('Invalid image file') ||
      String(errorMessage).includes('File size too large')
    ) {
      return createMediaError(
        MediaErrorCode.FILE_TOO_LARGE,
        this.name,
        new Error(`Invalid file: ${errorMessage}`),
        { httpCode }
      );
    }

    // Default error mapping based on operation
    const defaultCode =
      operation === 'upload'
        ? MediaErrorCode.UPLOAD_FAILED
        : operation === 'delete'
          ? MediaErrorCode.DELETE_FAILED
          : MediaErrorCode.FILE_NOT_FOUND;

    return createMediaError(defaultCode, this.name, error as Error, {
      cloudinaryError: errorMessage,
      httpCode,
    });
  }

  /**
   * Issue #10: Detect resource type from file for better Cloudinary performance
   */
  private async detectResourceType(
    file: File | Buffer
  ): Promise<'image' | 'video' | 'raw' | 'auto'> {
    try {
      if (file instanceof Buffer) {
        const detectedType = await getFileType(file);
        const mime = detectedType?.mime;

        if (mime?.startsWith('image/')) return 'image';
        if (mime?.startsWith('video/')) return 'video';
        if (mime?.startsWith('audio/')) return 'video'; // Cloudinary uses 'video' for audio
        return 'raw';
      } else if (file instanceof File) {
        const mime = file.type;

        if (mime.startsWith('image/')) return 'image';
        if (mime.startsWith('video/')) return 'video';
        if (mime.startsWith('audio/')) return 'video';
        return 'raw';
      }
    } catch {
      // Fall back to auto detection
    }

    return 'auto';
  }

  private async mapOptions(
    options?: UploadOptions,
    file?: File | Buffer
  ): Promise<CloudinaryUploadOptions> {
    const cloudinaryOptions: CloudinaryUploadOptions = {};

    if (options?.folder) {
      cloudinaryOptions.folder = options.folder;
    }
    if (options?.filename) {
      // When uniqueFilename is true (default) or not specified, append a short ID
      const shouldMakeUnique = options?.uniqueFilename !== false;
      cloudinaryOptions.public_id = shouldMakeUnique
        ? `${options.filename}-${this.generateShortId()}`
        : options.filename;
    }
    if (options?.tags) {
      cloudinaryOptions.tags = options.tags;
    }
    if (options?.metadata) {
      cloudinaryOptions.context = Object.entries(options.metadata).reduce(
        (acc, [key, value]) => {
          acc[key] = String(value);
          return acc;
        },
        {} as Record<string, string>
      );
    }
    if (options?.transformation) {
      cloudinaryOptions.transformation = [this.mapTransformations(options.transformation)];
    }

    // Issue #10: Detect resource type from file if available
    if (file) {
      cloudinaryOptions.resource_type = await this.detectResourceType(file);
    } else {
      cloudinaryOptions.resource_type = 'auto';
    }

    return cloudinaryOptions;
  }

  /**
   * Issue #11: Improved ID generation with crypto support
   */
  private generateShortId(): string {
    // Use Web Crypto API for better randomness when available
    const cryptoObj = typeof globalThis !== 'undefined' ? globalThis.crypto : undefined;
    if (cryptoObj?.getRandomValues) {
      const buffer = new Uint8Array(6);
      cryptoObj.getRandomValues(buffer);
      return Array.from(buffer)
        .map((b) => b.toString(36).padStart(2, '0'))
        .join('')
        .substring(0, 8);
    }

    // Fallback with timestamp for better uniqueness
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `${timestamp}${random}`.substring(0, 12);
  }

  private mapTransformations(transform: TransformationOptions): Record<string, unknown> {
    const cloudinaryTransform: Record<string, unknown> = {};

    if (transform.width) {
      cloudinaryTransform.width = transform.width;
    }
    if (transform.height) {
      cloudinaryTransform.height = transform.height;
    }
    if (transform.quality) {
      cloudinaryTransform.quality = transform.quality;
    }
    if (transform.format) {
      cloudinaryTransform.fetch_format = transform.format === 'auto' ? 'auto' : transform.format;
    }
    if (transform.fit) {
      cloudinaryTransform.crop = this.mapFitMode(transform.fit);
    }

    // Issue #13: Support additional common transformations
    const extendedTransform = transform as Record<string, unknown>;
    if (extendedTransform.gravity) {
      cloudinaryTransform.gravity = extendedTransform.gravity;
    }
    if (extendedTransform.effect) {
      cloudinaryTransform.effect = extendedTransform.effect;
    }
    if (extendedTransform.angle) {
      cloudinaryTransform.angle = extendedTransform.angle;
    }
    if (extendedTransform.background) {
      cloudinaryTransform.background = extendedTransform.background;
    }

    return cloudinaryTransform;
  }

  /**
   * Issue #9: Build transformation path for fallback URL generation
   */
  private buildTransformationPath(transform: TransformationOptions): string {
    const parts: string[] = [];

    if (transform.width) parts.push(`w_${transform.width}`);
    if (transform.height) parts.push(`h_${transform.height}`);
    if (transform.quality) parts.push(`q_${transform.quality}`);
    if (transform.format) parts.push(`f_${transform.format}`);
    if (transform.fit) {
      const crop = this.mapFitMode(transform.fit);
      parts.push(`c_${crop}`);
    }

    return parts.join(',');
  }

  private mapFitMode(fit: string): string {
    const mapping: Record<string, string> = {
      cover: 'fill',
      contain: 'fit',
      fill: 'scale',
      inside: 'limit',
      outside: 'mfit',
    };
    return mapping[fit] ?? 'fill';
  }

  private normalizeResult(result: CloudinaryUploadResponse): UploadResult {
    const uploadResult: UploadResult = {
      id: result.public_id,
      storageKey: result.public_id,
      url: result.secure_url,
      publicUrl: result.secure_url,
      size: result.bytes,
      format: result.format,
      provider: this.name,
      metadata: {
        resourceType: result.resource_type,
        version: result.version,
        type: result.type,
        tags: result.tags,
      },
      createdAt: new Date(result.created_at),
    };

    if (result.width !== undefined) {
      uploadResult.width = result.width;
    }
    if (result.height !== undefined) {
      uploadResult.height = result.height;
    }

    return uploadResult;
  }

  /**
   * Upload from a Node.js Readable or Web ReadableStream using Cloudinary's upload_stream.
   */
  private uploadFromStream(
    client: CloudinaryClient,
    stream: Readable | ReadableStream<Uint8Array>,
    cloudinaryOptions: CloudinaryUploadOptions,
    options?: UploadOptions
  ): Promise<CloudinaryUploadResponse> {
    return new Promise((resolve, reject) => {
      const uploadStream = client.uploader.upload_stream(
        cloudinaryOptions,
        (error: unknown, result: CloudinaryUploadResponse | undefined) => {
          if (error) return reject(error);
          if (!result) return reject(new Error('Cloudinary upload_stream returned no result'));
          resolve(result);
        }
      );

      if (options?.onProgress) {
        options.onProgress(50); // Starting stream upload
      }

      // Pipe source stream into the Cloudinary writable
      if ('pipe' in stream && typeof (stream as Readable).pipe === 'function') {
        // Node.js Readable
        (stream as Readable).pipe(uploadStream);
      } else {
        // Web ReadableStream — consume with reader
        const reader = (stream as ReadableStream<Uint8Array>).getReader();
        const pump = (): void => {
          reader
            .read()
            .then(({ done, value }) => {
              if (done) {
                uploadStream.end();
                return;
              }
              uploadStream.write(Buffer.from(value));
              pump();
            })
            .catch(reject);
        };
        pump();
      }
    });
  }

  /**
   * Check whether the given input is a stream.
   */
  private isStreamInput(file: UploadInput): boolean {
    if (file instanceof Buffer) return false;
    if (typeof File !== 'undefined' && file instanceof File) return false;
    return (
      typeof (file as Readable).pipe === 'function' ||
      typeof (file as ReadableStream).getReader === 'function'
    );
  }

  /**
   * Derive Cloudinary resource_type from a MIME content type.
   */
  private resourceTypeFromContentType(contentType?: string): 'image' | 'video' | 'raw' | 'auto' {
    if (!contentType) return 'auto';
    if (contentType.startsWith('image/')) return 'image';
    if (contentType.startsWith('video/') || contentType.startsWith('audio/')) return 'video';
    return 'raw';
  }
}

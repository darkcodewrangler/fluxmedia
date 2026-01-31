import type {
  MediaProvider,
  UploadOptions,
  UploadResult,
  TransformationOptions,
  ProviderFeatures,
} from '@fluxmedia/core';
import { MediaErrorCode, createMediaError } from '@fluxmedia/core';
import type { S3Client as S3ClientType } from '@aws-sdk/client-s3';
import { R2Features } from './features';
import type { R2Config } from './types';

// Cached command imports for performance
let cachedS3Client: typeof import('@aws-sdk/client-s3').S3Client | null = null;
let cachedPutObjectCommand: typeof import('@aws-sdk/client-s3').PutObjectCommand | null = null;
let cachedDeleteObjectCommand: typeof import('@aws-sdk/client-s3').DeleteObjectCommand | null = null;
let cachedHeadObjectCommand: typeof import('@aws-sdk/client-s3').HeadObjectCommand | null = null;

async function getS3Imports() {
  if (!cachedS3Client) {
    const sdk = await import('@aws-sdk/client-s3');
    cachedS3Client = sdk.S3Client;
    cachedPutObjectCommand = sdk.PutObjectCommand;
    cachedDeleteObjectCommand = sdk.DeleteObjectCommand;
    cachedHeadObjectCommand = sdk.HeadObjectCommand;
  }
  return {
    S3Client: cachedS3Client!,
    PutObjectCommand: cachedPutObjectCommand!,
    DeleteObjectCommand: cachedDeleteObjectCommand!,
    HeadObjectCommand: cachedHeadObjectCommand!,
  };
}

/**
 * Cloudflare R2 provider implementation.
 * Uses S3-compatible API for storage operations.
 */
export class R2Provider implements MediaProvider {
  readonly name: string = 'r2';
  readonly features: ProviderFeatures = R2Features;

  private client: S3ClientType | null = null;
  private clientPromise: Promise<S3ClientType> | null = null;
  private config: R2Config;

  constructor(config: R2Config) {
    // Validate required fields (Issue #3)
    const required: (keyof R2Config)[] = ['accountId', 'bucket', 'accessKeyId', 'secretAccessKey'];
    const missing = required.filter((field) => !config[field]);

    if (missing.length > 0) {
      throw createMediaError(
        MediaErrorCode.INVALID_CONFIG,
        'r2',
        new Error(`Missing required R2 configuration: ${missing.join(', ')}`)
      );
    }

    // Validate bucket name format
    if (config.bucket.includes('/')) {
      throw createMediaError(
        MediaErrorCode.INVALID_CONFIG,
        'r2',
        new Error('Bucket name cannot contain slashes')
      );
    }

    this.config = config;
  }

  /**
   * Initializes the S3 client lazily with race condition protection (Issue #9).
   */
  private async ensureClient(): Promise<S3ClientType> {
    if (!this.clientPromise) {
      this.clientPromise = this.initializeClient();
    }
    return this.clientPromise;
  }

  private async initializeClient(): Promise<S3ClientType> {
    const { S3Client } = await getS3Imports();
    const client = new S3Client({
      region: 'auto',
      endpoint: `https://${this.config.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: this.config.accessKeyId,
        secretAccessKey: this.config.secretAccessKey,
      },
    });
    this.client = client;
    return client;
  }

  async upload(file: File | Buffer, options?: UploadOptions): Promise<UploadResult> {
    const client = await this.ensureClient();
    const { PutObjectCommand } = await getS3Imports();

    try {
      const key = this.generateKey(options);
      const body = file instanceof Buffer ? file : await this.fileToBuffer(file as File);

      if (options?.onProgress) {
        options.onProgress(0);
      }

      const command = new PutObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
        Body: body,
        ContentType: this.getContentType(file),
        Metadata: options?.metadata as Record<string, string> | undefined,
      });

      await client.send(command);

      if (options?.onProgress) {
        options.onProgress(100);
      }

      // Use byteLength for correct size calculation (Issue #13)
      const size = file instanceof Buffer ? file.byteLength : (file as File).size;
      return this.createResult(key, size);
    } catch (error) {
      throw this.mapS3Error(error, MediaErrorCode.UPLOAD_FAILED);
    }
  }

  async delete(id: string): Promise<void> {
    const client = await this.ensureClient();
    const { DeleteObjectCommand } = await getS3Imports();

    try {
      const command = new DeleteObjectCommand({
        Bucket: this.config.bucket,
        Key: id,
      });

      await client.send(command);
    } catch (error) {
      throw this.mapS3Error(error, MediaErrorCode.DELETE_FAILED);
    }
  }

  async get(id: string): Promise<UploadResult> {
    const client = await this.ensureClient();
    const { HeadObjectCommand } = await getS3Imports();

    try {
      const command = new HeadObjectCommand({
        Bucket: this.config.bucket,
        Key: id,
      });

      const response = await client.send(command);

      return {
        id,
        url: this.getUrl(id),
        publicUrl: this.getUrl(id),
        size: response.ContentLength ?? 0,
        format: this.extractFormat(id),
        provider: this.name,
        metadata: {
          contentType: response.ContentType,
        },
        createdAt: response.LastModified ?? new Date(),
      };
    } catch (error) {
      throw this.mapS3Error(error, MediaErrorCode.FILE_NOT_FOUND);
    }
  }

  getUrl(id: string, transform?: TransformationOptions): string {
    // Warn about unsupported transformations (Issue #11)
    if (transform && Object.keys(transform).length > 0) {
      console.warn(
        'R2Provider: Image transformations are not supported. ' +
        'Consider using Cloudflare Image Resizing or a separate transform service.'
      );
    }

    // Require publicUrl configuration (Issue #2)
    if (!this.config.publicUrl) {
      throw createMediaError(
        MediaErrorCode.INVALID_CONFIG,
        this.name,
        new Error(
          'publicUrl must be configured for R2. Set up a custom domain or r2.dev subdomain.'
        )
      );
    }

    return `${this.config.publicUrl}/${id}`;
  }

  async uploadMultiple(
    files: File[] | Buffer[],
    options?: UploadOptions & { concurrency?: number }
  ): Promise<UploadResult[]> {
    // Batched processing with concurrency control (Issue #5)
    const concurrency = options?.concurrency ?? 5;
    const results: UploadResult[] = [];

    for (let i = 0; i < files.length; i += concurrency) {
      const batch = files.slice(i, i + concurrency);
      const batchResults = await Promise.all(
        batch.map((file) => {
          // Clone options for each file to avoid shared state (Issue #14)
          const { concurrency: _, ...uploadOptions } = options ?? {};
          return this.upload(file, Object.keys(uploadOptions).length > 0 ? uploadOptions : undefined);
        })
      );
      results.push(...batchResults);
    }

    return results;
  }

  async deleteMultiple(ids: string[]): Promise<void> {
    // Batched processing with concurrency control (Issue #5)
    const concurrency = 10;
    const failed: Array<{ id: string; error: unknown }> = [];

    for (let i = 0; i < ids.length; i += concurrency) {
      const batch = ids.slice(i, i + concurrency);
      // Use Promise.allSettled for partial failure handling (Issue #6)
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
        new Error(`Failed to delete ${failed.length} of ${ids.length} files: ${failed.map((f) => f.id).join(', ')}`)
      );
    }
  }

  get native(): unknown {
    return this.client;
  }

  // Prevent credential exposure in serialization (Issue #12)
  toJSON() {
    return {
      name: this.name,
      features: this.features,
    };
  }

  private generateKey(options?: UploadOptions): string {
    const filename = options?.filename ?? this.generateRandomId();
    const folder = options?.folder ? `${options.folder}/` : '';
    return `${folder}${filename}`;
  }

  private generateRandomId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }

  private getContentType(file: File | Buffer): string {
    if (file instanceof Buffer) {
      return 'application/octet-stream';
    }
    return (file as File).type || 'application/octet-stream';
  }

  private extractFormat(key: string): string {
    const parts = key.split('.');
    return parts.length > 1 ? (parts[parts.length - 1] ?? '') : '';
  }

  private async fileToBuffer(file: File): Promise<Buffer> {
    const arrayBuffer = await file.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  private createResult(key: string, size: number): UploadResult {
    return {
      id: key,
      url: this.getUrl(key),
      publicUrl: this.getUrl(key),
      size,
      format: this.extractFormat(key),
      provider: this.name,
      metadata: {},
      createdAt: new Date(),
    };
  }

  /**
   * Maps S3-specific errors to MediaError with appropriate codes (Issue #10)
   */
  private mapS3Error(error: unknown, defaultCode: MediaErrorCode): never {
    const err = error as { name?: string; message?: string };

    if (err.name === 'NoSuchBucket') {
      throw createMediaError(
        MediaErrorCode.INVALID_CONFIG,
        this.name,
        new Error(`Bucket '${this.config.bucket}' does not exist`)
      );
    }

    if (err.name === 'AccessDenied' || err.name === 'InvalidAccessKeyId') {
      throw createMediaError(
        MediaErrorCode.UNAUTHORIZED,
        this.name,
        new Error('Access denied - check R2 credentials and bucket permissions')
      );
    }

    if (err.name === 'NoSuchKey') {
      throw createMediaError(
        MediaErrorCode.FILE_NOT_FOUND,
        this.name,
        error
      );
    }

    throw createMediaError(defaultCode, this.name, error);
  }
}

import type {
  MediaProvider,
  UploadOptions,
  UploadResult,
  TransformationOptions,
  ProviderFeatures,
} from '@fluxmedia/core';
import { MediaErrorCode, createMediaError } from '@fluxmedia/core';
import type { S3Client as S3ClientType } from '@aws-sdk/client-s3';
import { S3Features } from './features';
import type { S3Config } from './types';

// Cached SDK imports for performance
let cachedS3Client: typeof import('@aws-sdk/client-s3').S3Client | null = null;
let cachedDeleteObjectCommand: typeof import('@aws-sdk/client-s3').DeleteObjectCommand | null =
  null;
let cachedHeadObjectCommand: typeof import('@aws-sdk/client-s3').HeadObjectCommand | null = null;
let cachedUpload: typeof import('@aws-sdk/lib-storage').Upload | null = null;

type Progress = {
  loaded?: number;
  total?: number;
  part?: number;
  Key?: string;
  Bucket?: string;
};

async function getS3Imports() {
  if (!cachedS3Client) {
    const sdk = await import('@aws-sdk/client-s3');
    cachedS3Client = sdk.S3Client;
    cachedDeleteObjectCommand = sdk.DeleteObjectCommand;
    cachedHeadObjectCommand = sdk.HeadObjectCommand;
  }
  return {
    S3Client: cachedS3Client!,
    DeleteObjectCommand: cachedDeleteObjectCommand!,
    HeadObjectCommand: cachedHeadObjectCommand!,
  };
}

async function getUploadClass() {
  if (!cachedUpload) {
    const libStorage = await import('@aws-sdk/lib-storage');
    cachedUpload = libStorage.Upload;
  }
  return cachedUpload!;
}

/**
 * AWS S3 provider implementation.
 * Storage-focused provider without transformation support.
 */
export class S3Provider implements MediaProvider {
  readonly name: string = 's3';
  readonly features: ProviderFeatures = S3Features;

  private client: S3ClientType | null = null;
  private clientPromise: Promise<S3ClientType> | null = null;
  private config: S3Config;

  constructor(config: S3Config) {
    // Validate required fields
    const required: (keyof S3Config)[] = ['region', 'bucket', 'accessKeyId', 'secretAccessKey'];
    const missing = required.filter((field) => !config[field]);

    if (missing.length > 0) {
      throw createMediaError(
        MediaErrorCode.INVALID_CONFIG,
        's3',
        new Error(`Missing required S3 configuration: ${missing.join(', ')}`)
      );
    }

    // Validate bucket name format
    if (config.bucket.includes('/')) {
      throw createMediaError(
        MediaErrorCode.INVALID_CONFIG,
        's3',
        new Error('Bucket name cannot contain slashes')
      );
    }

    this.config = config;
  }

  /**
   * Initializes the S3 client lazily with race condition protection.
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
      region: this.config.region,
      credentials: {
        accessKeyId: this.config.accessKeyId,
        secretAccessKey: this.config.secretAccessKey,
      },
      ...(this.config.endpoint && { endpoint: this.config.endpoint }),
      ...(this.config.forcePathStyle !== undefined && { forcePathStyle: this.config.forcePathStyle }),
    });
    this.client = client;
    return client;
  }

  async upload(file: File | Buffer, options?: UploadOptions): Promise<UploadResult> {
    const client = await this.ensureClient();
    const Upload = await getUploadClass();

    try {
      const key = this.generateKey(options);

      // Use Upload class for ALL files (small and large)
      // It automatically handles multipart for files >5MB
      const upload = new Upload({
        client,
        params: {
          Bucket: this.config.bucket,
          Key: key,
          Body: file,
          ContentType: this.getContentType(file),
          Metadata: options?.metadata as Record<string, string> | undefined,
        },
        // Configuration for multipart upload
        queueSize: 4, // Upload 4 parts in parallel
        partSize: 5 * 1024 * 1024, // 5MB per part (S3 minimum)
        leavePartsOnError: false, // Auto-cleanup failed uploads
      });

      // Track upload progress via native event
      if (options?.onProgress) {
        upload.on('httpUploadProgress', (progress: Progress) => {
          if (progress.total) {
            const percentComplete = (progress.loaded! / progress.total) * 100;
            options.onProgress!(percentComplete);
          }
        });
      }

      // Execute upload
      await upload.done();

      // Use byteLength for correct size calculation
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

  getUrl(id: string, _transform?: TransformationOptions): string {
    // S3 doesn't support transformations, ignore transform parameter
    if (this.config.endpoint) {
      return `${this.config.endpoint}/${this.config.bucket}/${id}`;
    }
    return `https://${this.config.bucket}.s3.${this.config.region}.amazonaws.com/${id}`;
  }

  async uploadMultiple(
    files: File[] | Buffer[],
    options?: UploadOptions & { concurrency?: number }
  ): Promise<UploadResult[]> {
    // Batched processing with concurrency control
    const concurrency = options?.concurrency ?? 5;
    const results: UploadResult[] = [];

    for (let i = 0; i < files.length; i += concurrency) {
      const batch = files.slice(i, i + concurrency);
      const batchResults = await Promise.all(
        batch.map((file) => {
          // Clone options for each file to avoid shared state
          const { concurrency: _, ...uploadOptions } = options ?? {};
          return this.upload(
            file,
            Object.keys(uploadOptions).length > 0 ? uploadOptions : undefined
          );
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

  get native(): unknown {
    return this.client;
  }

  // Prevent credential exposure in serialization
  toJSON(): { name: string; features: ProviderFeatures } {
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
   * Maps S3-specific errors to MediaError with appropriate codes
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
        new Error('Access denied - check S3 credentials and bucket permissions')
      );
    }

    if (err.name === 'NoSuchKey') {
      throw createMediaError(MediaErrorCode.FILE_NOT_FOUND, this.name, error);
    }

    throw createMediaError(defaultCode, this.name, error);
  }
}

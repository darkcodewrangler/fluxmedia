import type {
  MediaProvider,
  UploadOptions,
  UploadResult,
  TransformationOptions,
  ProviderFeatures,
} from '@fluxmedia/core';
import { MediaErrorCode, createMediaError } from '@fluxmedia/core';
import { S3Features } from './features';
import type { S3Config } from './types';
import { S3Client } from '@aws-sdk/client-s3';

// Type for S3 client
interface S3ClientType {
  send: (command: unknown) => Promise<unknown>;
}

/**
 * AWS S3 provider implementation.
 * Storage-focused provider without transformation support.
 */
export class S3Provider implements MediaProvider {
  readonly name: string = 's3';
  readonly features: ProviderFeatures = S3Features;

  private client: S3ClientType | S3Client | null = null;
  private config: S3Config;

  constructor(config: S3Config) {
    this.config = config;
  }

  /**
   * Lazy-loads the AWS S3 SDK to minimize bundle size.
   */
  private async ensureClient(): Promise<S3ClientType> {
    if (!this.client) {
      this.client = new S3Client({
        region: this.config.region,
        credentials: {
          accessKeyId: this.config.accessKeyId,

          secretAccessKey: this.config.secretAccessKey,
        },
        endpoint: this.config.endpoint,
        forcePathStyle: this.config.forcePathStyle,
      });
    }
    return this.client as S3ClientType;
  }

  async upload(file: File | Buffer, options?: UploadOptions): Promise<UploadResult> {
    const client = await this.ensureClient();

    try {
      const { PutObjectCommand } = await import('@aws-sdk/client-s3');

      const key = this.generateKey(options);
      const body = file instanceof Buffer ? file : await this.fileToBuffer(file);

      if (options?.onProgress) {
        options.onProgress(0);
      }

      const command = new PutObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
        Body: body,
        ContentType: this.getContentType(file),
      });

      await client.send(command);

      if (options?.onProgress) {
        options.onProgress(100);
      }

      return this.createResult(key, body.length);
    } catch (error) {
      throw createMediaError(MediaErrorCode.UPLOAD_FAILED, this.name, error);
    }
  }

  async delete(id: string): Promise<void> {
    const client = await this.ensureClient();

    try {
      const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');

      const command = new DeleteObjectCommand({
        Bucket: this.config.bucket,
        Key: id,
      });

      await client.send(command);
    } catch (error) {
      throw createMediaError(MediaErrorCode.DELETE_FAILED, this.name, error);
    }
  }

  async get(id: string): Promise<UploadResult> {
    const client = await this.ensureClient();

    try {
      const { HeadObjectCommand } = await import('@aws-sdk/client-s3');

      const command = new HeadObjectCommand({
        Bucket: this.config.bucket,
        Key: id,
      });

      const response = (await client.send(command)) as {
        ContentLength?: number;
        ContentType?: string;
        LastModified?: Date;
      };

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
      throw createMediaError(MediaErrorCode.FILE_NOT_FOUND, this.name, error);
    }
  }

  getUrl(id: string, _transform?: TransformationOptions): string {
    // S3 doesn't support transformations, ignore transform parameter
    if (this.config.endpoint) {
      return `${this.config.endpoint}/${this.config.bucket}/${id}`;
    }
    return `https://${this.config.bucket}.s3.${this.config.region}.amazonaws.com/${id}`;
  }

  async uploadMultiple(files: File[] | Buffer[], options?: UploadOptions): Promise<UploadResult[]> {
    const uploadPromises = files.map((file) => this.upload(file, options));
    return Promise.all(uploadPromises);
  }

  async deleteMultiple(ids: string[]): Promise<void> {
    const deletePromises = ids.map((id) => this.delete(id));
    await Promise.all(deletePromises);
  }

  get native(): unknown {
    return this.client;
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
}

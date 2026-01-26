```typescript
import type {
    MediaProvider,
    UploadOptions,
    UploadResult,
    TransformationOptions,
} from '@fluxmedia/core';
import { MediaErrorCode, createMediaError } from '@fluxmedia/core';
import { CloudinaryFeatures } from './features';
import type {
    CloudinaryConfig,
    CloudinaryUploadOptions,
    CloudinaryUploadResponse,
} from './types';

/**
 * Cloudinary provider implementation.
 * Provides full-featured media upload with transformations, AI tagging, and more.
 *
 * @example
 * ```typescript
    * import { MediaUploader } from '@fluxmedia/core';
 * import { CloudinaryProvider } from '@fluxmedia/cloudinary';
 *
 * const uploader = new MediaUploader(
 * new CloudinaryProvider({
        *     cloudName: 'your-cloud',
        *     apiKey: 'your-key',
        *     apiSecret: 'your-secret'
 *   })
        * );
 *
 * const result = await uploader.upload(file, {
            *   transformation: { width: 800, format: 'webp' }
 * });
 * ```
 */
export class CloudinaryProvider implements MediaProvider {
    readonly name = 'cloudinary';
    readonly features = CloudinaryFeatures;

    private client: unknown = null;
    private config: CloudinaryConfig;

    constructor(config: CloudinaryConfig) {
        this.config = {
            ...config,
            secure: config.secure ?? true,
        };
    }

    /**
     * Lazy-loads the Cloudinary SDK to minimize bundle size.
     * Only imports when actually needed.
     */
    private async ensureClient() {
        if (!this.client) {
            const cloudinary = await import('cloudinary');
            this.client = cloudinary.v2;
            // Configure Cloudinary
            (this.client as { config: (config: unknown) => void }).config({
                cloud_name: this.config.cloudName,
                api_key: this.config.apiKey,
                api_secret: this.config.apiSecret,
                secure: this.config.secure,
            });
        }
        return this.client as {
            uploader: {
                upload: (file: unknown, options?: unknown) => Promise<CloudinaryUploadResponse>;
                destroy: (publicId: string, options?: unknown) => Promise<{ result: string }>;
                explicit: (publicId: string, options?: unknown) => Promise<CloudinaryUploadResponse>;
            };
            url: (publicId: string, options?: unknown) => string;
        };
    }

    async upload(file: File | Buffer, options?: UploadOptions): Promise<UploadResult> {
        const client = await this.ensureClient();

        try {
            const cloudinaryOptions = this.mapOptions(options);

            // Handle progress callback if provided
            if (options?.onProgress) {
                // Cloudinary doesn't provide built-in progress, simulate it
                options.onProgress(0);
            }

            const result = await client.uploader.upload(
                file instanceof Buffer ? `data:${ this.getFileType(file) }; base64, ${ file.toString('base64') } ` : (file as unknown),
                cloudinaryOptions
            );

            if (options?.onProgress) {
                options.onProgress(100);
            }

            return this.normalizeResult(result);
        } catch (error) {
            throw createMediaError(MediaErrorCode.UPLOAD_FAILED, this.name, error);
        }
    }

    async delete(id: string): Promise<void> {
        const client = await this.ensureClient();

        try {
            const result = await client.uploader.destroy(id);

            if (result.result !== 'ok') {
                throw new Error(`Delete failed: ${ result.result } `);
            }
        } catch (error) {
            throw createMediaError(MediaErrorCode.DELETE_FAILED, this.name, error);
        }
    }

    async get(id: string): Promise<UploadResult> {
        const client = await this.ensureClient();

        try {
            const result = await client.uploader.explicit(id, {
                type: 'upload',
            });

            return this.normalizeResult(result);
        } catch (error) {
            throw createMediaError(MediaErrorCode.FILE_NOT_FOUND, this.name, error);
        }
    }

    getUrl(id: string, transform?: TransformationOptions): string {
        const options = transform ? { transformation: [this.mapTransformations(transform)] } : {};

        // Create temporary client for URL generation without async
        const cloudinary = this.client as { url: (id: string, options?: unknown) => string } | null;

        if (!cloudinary) {
            // If client hasn't been initialized, create a basic URL
            const baseUrl = this.config.secure ? 'https' : 'http';
            return `${ baseUrl }://res.cloudinary.com/${this.config.cloudName}/image/upload/${id}`;
        }

return cloudinary.url(id, options);
    }

    async uploadMultiple(
    files: File[] | Buffer[],
    options ?: UploadOptions
): Promise < UploadResult[] > {
    // Upload files in parallel
    const uploadPromises = files.map((file) => this.upload(file, options));
    return Promise.all(uploadPromises);
}

    async deleteMultiple(ids: string[]): Promise < void> {
    // Delete files in parallel
    const deletePromises = ids.map((id) => this.delete(id));
    await Promise.all(deletePromises);
}

    /**
     * Get the native Cloudinary client for advanced usage.
     * Allows access to provider-specific features not covered by the universal API.
     */
    get native(): unknown {
    return this.client;
}

    /**
     * Map universal upload options to Cloudinary-specific format.
     */
    private mapOptions(options ?: UploadOptions): CloudinaryUploadOptions {
    const cloudinaryOptions: CloudinaryUploadOptions = {};

    if (options?.folder) {
        cloudinaryOptions.folder = options.folder;
    }

    if (options?.filename) {
        cloudinaryOptions.public_id = options.filename;
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

    // Auto-detect resource type
    cloudinaryOptions.resource_type = 'auto';

    return cloudinaryOptions;
}

    /**
     * Map universal transformation options to Cloudinary format.
     */
    private mapTransformations(transform: TransformationOptions): Record < string, unknown > {
    const cloudinaryTransform: Record<string, unknown> = { };

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

return cloudinaryTransform;
    }

    /**
     * Map universal fit modes to Cloudinary crop modes.
     */
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

    /**
   * Normalize Cloudinary response to universal UploadResult format.
   */
    private normalizeResult(result: CloudinaryUploadResponse): UploadResult {
    const uploadResult: UploadResult = {
        id: result.public_id,
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

    // Only set width/height if they exist (exactOptionalPropertyTypes compliance)
    if (result.width !== undefined) {
        uploadResult.width = result.width;
    }
    if (result.height !== undefined) {
        uploadResult.height = result.height;
    }

    return uploadResult;
}

    /**
     * Attempt to determine file type from Buffer (basic implementation).
     */
    private getFileType(buffer: Buffer): string {
    // Check magic numbers for common image formats
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
        return 'image/jpeg';
    }
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
        return 'image/png';
    }
    if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
        return 'image/gif';
    }
    // Default to binary
    return 'application/octet-stream';
}
}

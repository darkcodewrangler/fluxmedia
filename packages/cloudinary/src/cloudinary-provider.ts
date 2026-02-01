import type {
    MediaProvider,
    UploadOptions,
    UploadResult,
    TransformationOptions,
    ProviderFeatures,
} from '@fluxmedia/core';
import { MediaErrorCode, createMediaError, getFileType } from '@fluxmedia/core';
import { CloudinaryFeatures } from './features';
import type {
    CloudinaryConfig,
    CloudinaryUploadOptions,
    CloudinaryUploadResponse,
} from './types';

/**
 * Cloudinary provider implementation.
 * Provides full-featured media upload with transformations, AI tagging, and more.
 */
export class CloudinaryProvider implements MediaProvider {
    readonly name: string = 'cloudinary';
    readonly features: ProviderFeatures = CloudinaryFeatures;

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
     */
    private async ensureClient(): Promise<{
        uploader: {
            upload: (file: unknown, options?: unknown) => Promise<CloudinaryUploadResponse>;
            destroy: (publicId: string, options?: unknown) => Promise<{ result: string }>;
            explicit: (publicId: string, options?: unknown) => Promise<CloudinaryUploadResponse>;
        };
        url: (publicId: string, options?: unknown) => string;
    }> {
        if (!this.client) {
            const cloudinary = await import('cloudinary');
            this.client = cloudinary.v2;
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

            if (options?.onProgress) {
                options.onProgress(0);
            }

            // Detect file type using magic bytes for accurate MIME
            let uploadData: unknown = file;
            if (file instanceof Buffer) {
                const detectedType = await getFileType(file);
                const mimeType = detectedType?.mime ?? 'application/octet-stream';
                uploadData = `data:${mimeType};base64,${file.toString('base64')}`;
            }

            const result = await client.uploader.upload(
                uploadData,
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
                throw new Error(`Delete failed: ${result.result}`);
            }
        } catch (error) {
            throw createMediaError(MediaErrorCode.DELETE_FAILED, this.name, error);
        }
    }

    async get(id: string): Promise<UploadResult> {
        const client = await this.ensureClient();

        try {
            const result = await client.uploader.explicit(id, { type: 'upload' });
            return this.normalizeResult(result);
        } catch (error) {
            throw createMediaError(MediaErrorCode.FILE_NOT_FOUND, this.name, error);
        }
    }

    getUrl(id: string, transform?: TransformationOptions): string {
        const options = transform ? { transformation: [this.mapTransformations(transform)] } : {};
        const cloudinary = this.client as { url: (id: string, options?: unknown) => string } | null;

        if (!cloudinary) {
            const baseUrl = this.config.secure ? 'https' : 'http';
            return `${baseUrl}://res.cloudinary.com/${this.config.cloudName}/image/upload/${id}`;
        }

        return cloudinary.url(id, options);
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

    private mapOptions(options?: UploadOptions): CloudinaryUploadOptions {
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

        cloudinaryOptions.resource_type = 'auto';
        return cloudinaryOptions;
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

        return cloudinaryTransform;
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
}

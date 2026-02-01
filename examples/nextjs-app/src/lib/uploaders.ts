/**
 * FluxMedia Next.js Library
 * Provides configured uploaders and plugins for server-side use
 */

import { MediaUploader, createPlugin, type FluxMediaPlugin } from '@fluxmedia/core';
import { CloudinaryProvider } from '@fluxmedia/cloudinary';
import { S3Provider } from '@fluxmedia/s3';
import { R2Provider } from '@fluxmedia/r2';

// ============================================================================
// PLUGINS
// ============================================================================

/**
 * Logger Plugin - Logs all upload/delete operations
 * Great for debugging and monitoring in development
 */
export const loggerPlugin: FluxMediaPlugin = createPlugin(
    'logger',
    {
        beforeUpload: async (file, options) => {
            const size = file instanceof Buffer ? file.byteLength : file.size;
            console.log(`[FluxMedia] Starting upload: ${options.filename || 'unnamed'} (${formatBytes(size)})`);
            return { file, options };
        },
        afterUpload: async (result) => {
            console.log(`[FluxMedia] Upload complete: ${result.id}`);
            console.log(`[FluxMedia]   URL: ${result.url}`);
            return result;
        },
        onError: async (error) => {
            console.error(`[FluxMedia] Upload failed:`, error.message);
        },
        beforeDelete: async (id) => {
            console.log(`[FluxMedia] Deleting: ${id}`);
            return id;
        },
        afterDelete: async (id) => {
            console.log(`[FluxMedia] Deleted: ${id}`);
        },
    },
    { version: '1.0.0' }
);

/**
 * Metadata Enrichment Plugin - Adds automatic metadata to uploads
 */
export const metadataPlugin: FluxMediaPlugin = createPlugin('metadata-enricher', {
    beforeUpload: async (file, options) => {
        return {
            file,
            options: {
                ...options,
                metadata: {
                    ...options.metadata,
                    uploadedAt: new Date().toISOString(),
                    source: 'fluxmedia-nextjs',
                },
            },
        };
    },
});

/**
 * Validation Plugin - Validates file sizes before upload
 */
export const validationPlugin: FluxMediaPlugin = createPlugin('validator', {
    beforeUpload: async (file, options) => {
        const size = file instanceof Buffer ? file.byteLength : file.size;
        const maxSize = 50 * 1024 * 1024; // 50MB

        if (size > maxSize) {
            throw new Error(`File too large: ${formatBytes(size)} exceeds ${formatBytes(maxSize)}`);
        }

        return { file, options };
    },
});

// ============================================================================
// PROVIDER FACTORIES
// ============================================================================

export type ProviderType = 'cloudinary' | 's3' | 'r2';

/**
 * Create a Cloudinary uploader with plugins
 */
export async function createCloudinaryUploader(withPlugins = true): Promise<MediaUploader> {
    const uploader = new MediaUploader(
        new CloudinaryProvider({
            cloudName: process.env.CLOUDINARY_CLOUD_NAME!,
            apiKey: process.env.CLOUDINARY_API_KEY!,
            apiSecret: process.env.CLOUDINARY_API_SECRET!,
        })
    );

    if (withPlugins) {
        await uploader.use(loggerPlugin);
        await uploader.use(metadataPlugin);
    }

    return uploader;
}

/**
 * Create an S3 uploader with plugins
 */
export async function createS3Uploader(withPlugins = true): Promise<MediaUploader> {
    const uploader = new MediaUploader(
        new S3Provider({
            region: process.env.AWS_REGION!,
            bucket: process.env.AWS_BUCKET!,
            accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        })
    );

    if (withPlugins) {
        await uploader.use(loggerPlugin);
        await uploader.use(metadataPlugin);
    }

    return uploader;
}

/**
 * Create an R2 uploader with plugins
 */
export async function createR2Uploader(withPlugins = true): Promise<MediaUploader> {
    const uploader = new MediaUploader(
        new R2Provider({
            accountId: process.env.R2_ACCOUNT_ID!,
            bucket: process.env.R2_BUCKET!,
            accessKeyId: process.env.R2_ACCESS_KEY_ID!,
            secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
            publicUrl: process.env.R2_PUBLIC_URL,
        })
    );

    if (withPlugins) {
        await uploader.use(loggerPlugin);
        await uploader.use(metadataPlugin);
    }

    return uploader;
}

/**
 * Create an uploader for the specified provider type
 */
export async function createUploader(
    provider: ProviderType,
    withPlugins = true
): Promise<MediaUploader> {
    switch (provider) {
        case 'cloudinary':
            return createCloudinaryUploader(withPlugins);
        case 's3':
            return createS3Uploader(withPlugins);
        case 'r2':
            return createR2Uploader(withPlugins);
        default:
            throw new Error(`Unknown provider: ${provider}`);
    }
}

// ============================================================================
// UTILITIES
// ============================================================================

function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

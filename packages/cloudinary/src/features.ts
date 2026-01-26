import type { ProviderFeatures } from '@fluxmedia/core';

/**
 * Feature matrix for Cloudinary provider.
 * Cloudinary supports all transformation and capability features.
 */
export const CloudinaryFeatures: ProviderFeatures = {
    transformations: {
        resize: true,
        crop: true,
        format: true,
        quality: true,
        blur: true,
        rotate: true,
        effects: true,
    },
    capabilities: {
        signedUploads: true,
        directUpload: true,
        multipartUpload: true,
        videoProcessing: true,
        aiTagging: true,
        facialDetection: true,
    },
    storage: {
        maxFileSize: 100 * 1024 * 1024, // 100MB for free plan
        supportedFormats: [
            'jpg',
            'jpeg',
            'png',
            'gif',
            'webp',
            'svg',
            'bmp',
            'tiff',
            'mp4',
            'mov',
            'avi',
            'webm',
            'pdf',
        ],
    },
};

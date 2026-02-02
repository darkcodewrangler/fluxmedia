import { useState, useCallback, useRef, useEffect } from 'react';

import { getFileType, type UploadResult } from '@fluxmedia/core';
import type { UseMediaUploadConfig, UseMediaUploadReturn } from './types';

/**
 * React hook for media uploads.
 * Supports direct, signed, and proxy upload modes.
 *
 * @example
 * ```tsx
 * function UploadButton() {
 *   const { upload, uploading, progress, error, result } = useMediaUpload({
 *     mode: 'signed',
 *     signUrlEndpoint: '/api/media/sign'
 *   });
 *
 *   return (
 *     <input
 *       type="file"
 *       onChange={(e) => upload(e.target.files?.[0]!)}
 *       disabled={uploading}
 *     />
 *   );
 * }
 * ```
 */
export function useMediaUpload(config: UseMediaUploadConfig): UseMediaUploadReturn {
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [result, setResult] = useState<UploadResult | null>(null);
    const [error, setError] = useState<Error | null>(null);
    const [preview, setPreviewUrl] = useState<string | null>(null);
    const [fileType, setFileType] = useState<{ mime: string; ext: string } | null>(null);

    // Track preview URL for cleanup
    const previewUrlRef = useRef<string | null>(null);

    // Cleanup preview URL on unmount
    useEffect(() => {
        return () => {
            if (previewUrlRef.current) {
                URL.revokeObjectURL(previewUrlRef.current);
            }
        };
    }, []);

    const setPreview = useCallback((file: File | null) => {
        // Revoke previous preview URL to prevent memory leaks
        if (previewUrlRef.current) {
            URL.revokeObjectURL(previewUrlRef.current);
            previewUrlRef.current = null;
        }

        if (file) {
            const url = URL.createObjectURL(file);
            previewUrlRef.current = url;
            setPreviewUrl(url);
        } else {
            setPreviewUrl(null);
        }
    }, []);

    const reset = useCallback(() => {
        setUploading(false);
        setProgress(0);
        setResult(null);
        setError(null);
        setPreview(null);
        setFileType(null);
    }, [setPreview]);

    /**
     * Detect file type using magic bytes (more reliable than MIME type)
     */
    const detectFileType = useCallback(async (file: File) => {
        try {

            const buffer = Buffer.from(await file.arrayBuffer());
            const result = await getFileType(buffer);

            if (result) {
                const typeResult = { mime: result.mime, ext: result.ext };
                setFileType(typeResult);
                return typeResult;
            }
            setFileType(null);
            return null;
        } catch {
            // Fallback to browser MIME type if detection fails
            const fallback = { mime: file.type, ext: file.name.split('.').pop() ?? '' };
            setFileType(fallback);
            return fallback;
        }
    }, []);

    const upload = useCallback(
        async (
            file: File,
            options?: {
                folder?: string;
                tags?: string[];
                provider?: string;
                metadata?: Record<string, unknown>;
            }
        ): Promise<UploadResult> => {
            setUploading(true);
            setProgress(0);
            setError(null);
            setResult(null);

            config.onUploadStart?.();

            try {
                let uploadResult: UploadResult;

                switch (config.mode) {
                    case 'signed':
                        uploadResult = await uploadSigned(file, config, options, setProgress);
                        break;
                    case 'proxy':
                        uploadResult = await uploadProxy(file, config, options, setProgress);
                        break;
                    case 'direct':
                    default:
                        throw new Error('Direct mode requires server-side implementation');
                }

                setResult(uploadResult);
                setProgress(100);
                config.onUploadComplete?.(uploadResult);
                return uploadResult;
            } catch (err) {
                const uploadError = err instanceof Error ? err : new Error('Upload failed');
                setError(uploadError);
                config.onUploadError?.(uploadError);
                throw uploadError;
            } finally {
                setUploading(false);
            }
        },
        [config]
    );

    return {
        upload,
        uploading,
        progress,
        result,
        error,
        reset,
        preview,
        setPreview,
        fileType,
        detectFileType,
    };
}

/**
 * Upload a file using XMLHttpRequest with real progress tracking
 */
function uploadWithProgress(
    url: string,
    options: {
        method: 'PUT' | 'POST';
        body: File | FormData;
        headers?: Record<string, string>;
        onProgress?: ((progress: number) => void) | undefined;
        progressOffset?: number; // Start percentage (default: 0)
        progressRange?: number; // Range for upload (default: 100)
    }
): Promise<{ status: number; response: string }> {
    const { progressOffset = 0, progressRange = 100 } = options;

    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        // Track upload progress via native event
        xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable && options.onProgress) {
                const uploadProgress = (event.loaded / event.total) * progressRange;
                options.onProgress(progressOffset + uploadProgress);
            }
        });

        xhr.addEventListener('load', () => {
            resolve({ status: xhr.status, response: xhr.responseText });
        });

        xhr.addEventListener('error', () => reject(new Error('Upload failed')));
        xhr.addEventListener('abort', () => reject(new Error('Upload aborted')));

        xhr.open(options.method, url);
        if (options.headers) {
            Object.entries(options.headers).forEach(([key, value]) => {
                xhr.setRequestHeader(key, value);
            });
        }
        xhr.send(options.body);
    });
}

/**
 * Upload using signed URL (recommended for production)
 */
async function uploadSigned(
    file: File,
    config: UseMediaUploadConfig,
    options?: {
        folder?: string;
        tags?: string[];
        provider?: string;
        metadata?: Record<string, unknown>;
    },
    onProgress?: (progress: number) => void
): Promise<UploadResult> {
    if (!config.signUrlEndpoint) {
        throw new Error('signUrlEndpoint is required for signed mode');
    }

    // Step 1: Get signed URL from server (5% of progress)
    onProgress?.(0);
    const signResponse = await fetch(config.signUrlEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            filename: file.name,
            contentType: file.type,
            folder: options?.folder ?? config.defaultOptions?.folder,
            tags: options?.tags ?? config.defaultOptions?.tags,
            provider: options?.provider,
            metadata: options?.metadata,
        }),
    });

    if (!signResponse.ok) {
        throw new Error('Failed to get signed upload URL');
    }

    onProgress?.(5);
    const { uploadUrl, fields, publicId, method, headers, publicUrl: signedPublicUrl } = await signResponse.json();

    // Step 2: Upload to signed URL with real progress tracking (5-95%)
    let uploadResult: { status: number; response: string };

    if (method === 'PUT') {
        // S3/R2: Use PUT with raw file body
        uploadResult = await uploadWithProgress(uploadUrl, {
            method: 'PUT',
            body: file,
            headers: headers ?? {},
            onProgress,
            progressOffset: 5,
            progressRange: 90,
        });
    } else {
        // Cloudinary: Use POST with FormData
        const formData = new FormData();
        if (fields) {
            Object.entries(fields).forEach(([key, value]) => {
                formData.append(key, value as string);
            });
        }
        formData.append('file', file);

        uploadResult = await uploadWithProgress(uploadUrl, {
            method: 'POST',
            body: formData,
            onProgress,
            progressOffset: 5,
            progressRange: 90,
        });
    }

    onProgress?.(95);

    if (uploadResult.status < 200 || uploadResult.status >= 300) {
        throw new Error('Upload failed');
    }

    // S3/R2 returns empty response on success, Cloudinary returns JSON
    let result: Record<string, unknown> = {};
    if (uploadResult.response) {
        try {
            result = JSON.parse(uploadResult.response);
        } catch {
            // S3/R2 may return empty or non-JSON response
        }
    }

    // Build result URL (S3/R2 use signedPublicUrl, Cloudinary uses result.secure_url)
    const resultUrl = signedPublicUrl ?? result.secure_url ?? result.url ?? uploadUrl.split('?')[0];

    return {
        id: publicId ?? result.public_id ?? result.key,
        url: resultUrl as string,
        publicUrl: resultUrl as string,
        size: file.size,
        format: file.name.split('.').pop() ?? '',
        provider: options?.provider ?? 'signed',
        metadata: result,
        createdAt: new Date(),
    };
}

/**
 * Upload through proxy server
 */
async function uploadProxy(
    file: File,
    config: UseMediaUploadConfig,
    options?: {
        folder?: string;
        tags?: string[];
        provider?: string;
        metadata?: Record<string, unknown>;
    },
    onProgress?: (progress: number) => void
): Promise<UploadResult> {
    if (!config.proxyEndpoint) {
        throw new Error('proxyEndpoint is required for proxy mode');
    }

    // Step 1: Prepare FormData (5% of progress)
    onProgress?.(0);

    const formData = new FormData();
    formData.append('file', file);

    if (options?.folder ?? config.defaultOptions?.folder) {
        formData.append('folder', options?.folder ?? config.defaultOptions?.folder ?? '');
    }

    if (options?.tags ?? config.defaultOptions?.tags) {
        formData.append('tags', JSON.stringify(options?.tags ?? config.defaultOptions?.tags));
    }

    // Pass provider for multi-provider support
    if (options?.provider) {
        formData.append('provider', options.provider);
    }

    // Pass metadata (will be sanitized server-side)
    if (options?.metadata) {
        formData.append('metadata', JSON.stringify(options.metadata));
    }

    onProgress?.(5);

    // Step 2: Upload with real progress tracking (5-95%)
    const uploadResult = await uploadWithProgress(config.proxyEndpoint, {
        method: 'POST',
        body: formData,
        onProgress,
        progressOffset: 5,
        progressRange: 90,
    });

    onProgress?.(95);

    if (uploadResult.status < 200 || uploadResult.status >= 300) {
        throw new Error('Upload failed');
    }

    const result = JSON.parse(uploadResult.response);

    return {
        id: result.id,
        url: result.url,
        publicUrl: result.publicUrl ?? result.url,
        size: result.size ?? file.size,
        format: result.format ?? file.name.split('.').pop() ?? '',
        provider: result.provider ?? 'proxy',
        metadata: result.metadata ?? {},
        createdAt: result.createdAt ? new Date(result.createdAt) : new Date(),
    };
}

import type {
    MediaProvider,
    UploadOptions,
    UploadResult,
    TransformationOptions,
    SearchOptions,
} from './types';

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
 * const result = await uploader.upload(file, {
 *   folder: 'avatars',
 *   transformation: {
 *     width: 400,
 *     height: 400,
 *     fit: 'cover',
 *     format: 'webp'
 *   }
 * });
 *
 * console.log(result.url);
 * ```
 */
export class MediaUploader {
    /**
     * The underlying provider instance
     */
    public readonly provider: MediaProvider;

    /**
     * Create a new MediaUploader instance.
     *
     * @param provider - Provider implementation (e.g., CloudinaryProvider, S3Provider)
     */
    constructor(provider: MediaProvider) {
        this.provider = provider;
    }

    /**
     * Upload a file to the configured provider.
     *
     * @param file - File to upload (browser File or Node.js Buffer)
     * @param options - Upload options
     * @returns Promise resolving to upload result
     * @throws {MediaError} If upload fails
     *
     * @example
     * ```typescript
     * const result = await uploader.upload(file, {
     *   folder: 'uploads',
     *   tags: ['user-content'],
     *   transformation: {
     *     width: 800,
     *     quality: 80,
     *     format: 'webp'
     *   }
     * });
     * ```
     */
    async upload(file: File | Buffer, options?: UploadOptions): Promise<UploadResult> {
        return this.provider.upload(file, options);
    }

    /**
     * Delete a file by its ID.
     *
     * @param id - File identifier from upload result
     * @returns Promise that resolves when deletion is complete
     * @throws {MediaError} If deletion fails
     *
     * @example
     * ```typescript
     * await uploader.delete('my-file-id');
     * ```
     */
    async delete(id: string): Promise<void> {
        return this.provider.delete(id);
    }

    /**
     * Get metadata for a file.
     *
     * @param id - File identifier
     * @returns Promise resolving to file metadata
     * @throws {MediaError} If file not found
     *
     * @example
     * ```typescript
     * const metadata = await uploader.get('my-file-id');
     * console.log(metadata.size, metadata.format);
     * ```
     */
    async get(id: string): Promise<UploadResult> {
        return this.provider.get(id);
    }

    /**
     * Generate a URL for accessing a file, optionally with transformations.
     *
     * @param id - File identifier
     * @param transform - Optional transformation options
     * @returns URL string
     *
     * @example
     * ```typescript
     * // Basic URL
     * const url = uploader.getUrl('my-file-id');
     *
     * // With transformations
     * const thumbnail = uploader.getUrl('my-file-id', {
     *   width: 200,
     *   height: 200,
     *   fit: 'cover',
     *   format: 'webp'
     * });
     * ```
     */
    getUrl(id: string, transform?: TransformationOptions): string {
        return this.provider.getUrl(id, transform);
    }

    /**
     * Upload multiple files in batch.
     *
     * @param files - Array of files to upload
     * @param options - Upload options (applied to all files)
     * @returns Promise resolving to array of upload results
     * @throws {MediaError} If any upload fails
     *
     * @example
     * ```typescript
     * const results = await uploader.uploadMultiple([file1, file2, file3], {
     *   folder: 'batch-upload',
     *   tags: ['bulk']
     * });
     * ```
     */
    async uploadMultiple(
        files: File[] | Buffer[],
        options?: UploadOptions
    ): Promise<UploadResult[]> {
        return this.provider.uploadMultiple(files, options);
    }

    /**
     * Delete multiple files in batch.
     *
     * @param ids - Array of file identifiers
     * @returns Promise that resolves when all deletions are complete
     * @throws {MediaError} If any deletion fails
     *
     * @example
     * ```typescript
     * await uploader.deleteMultiple(['id1', 'id2', 'id3']);
     * ```
     */
    async deleteMultiple(ids: string[]): Promise<void> {
        return this.provider.deleteMultiple(ids);
    }

    /**
     * Search for files (if provider supports search).
     *
     * @param query - Search options
     * @returns Promise resolving to matching files
     * @throws {MediaError} If search fails or not supported
     *
     * @example
     * ```typescript
     * const results = await uploader.search({
     *   query: 'cat',
     *   tags: ['animals'],
     *   limit: 20
     * });
     * ```
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
     *
     * @example
     * ```typescript
     * if (uploader.supports('transformations.resize')) {
     *   // Use resize transformation
     * }
     * ```
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
}

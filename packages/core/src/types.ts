/**
 * Result returned after a successful media upload.
 * Normalized across all providers to ensure consistent API.
 */
export interface UploadResult {
  /**
   * Unique identifier for the uploaded file (provider-specific format)
   */
  id: string;

  /**
   * Direct URL to access the uploaded file
   */
  url: string;

  /**
   * Public URL (may be different from url for some providers)
   */
  publicUrl: string;

  /**
   * File size in bytes
   */
  size: number;

  /**
   * File format/extension (e.g., 'jpg', 'png', 'mp4')
   */
  format: string;

  /**
   * Image/video width in pixels (if applicable)
   */
  width?: number;

  /**
   * Image/video height in pixels (if applicable)
   */
  height?: number;

  /**
   * Name of the provider used for upload
   */
  provider: string;

  /**
   * Additional provider-specific metadata
   */
  metadata: Record<string, unknown>;

  /**
   * Upload timestamp
   */
  createdAt: Date;

  /**
   * Raw provider storage key.
   * S3/R2: the S3 object key (e.g. 'uploads/video-abc123')
   * Cloudinary: the public_id (e.g. 'uploads/video-abc123')
   * Always safe to pass to provider.delete().
   */
  storageKey?: string;
}

/**
 * Provider-agnostic transformation options for images.
 * Not all providers support all transformations - check provider features.
 */
export interface TransformationOptions {
  /**
   * Target width in pixels
   */
  width?: number;

  /**
   * Target height in pixels
   */
  height?: number;

  /**
   * Quality (0-100 for lossy formats)
   */
  quality?: number;

  /**
   * Output format
   */
  format?: 'auto' | 'webp' | 'avif' | 'jpg' | 'png';

  /**
   * Resize fit mode
   * - cover: Crop to fill dimensions
   * - contain: Fit within dimensions
   * - fill: Stretch to fill dimensions
   * - inside: Resize to fit inside dimensions
   * - outside: Resize to fit outside dimensions
   */
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
}

/**
 * Options for uploading a file.
 */
export interface UploadOptions {
  /**
   * Custom filename (without extension)
   */
  filename?: string;

  /**
   * Folder/path where file should be stored
   */
  folder?: string;

  /**
   * Whether the file should be publicly accessible
   */
  public?: boolean;

  /**
   * Tags for organizing files
   */
  tags?: string[];

  /**
   * Custom metadata to store with the file
   */
  metadata?: Record<string, unknown>;

  /**
   * Callback for upload progress (0-100)
   */
  onProgress?: (progress: number) => void;

  /**
   * Callback with bytes transferred and total bytes during multipart upload.
   * Available on S3 and R2 providers. Total may be undefined for streams.
   */
  onByteProgress?: (loaded: number, total: number | undefined) => void;

  /**
   * Transformations to apply during upload
   */
  transformation?: TransformationOptions;

  /**
   * When true (default), generates unique filenames by appending a short ID
   * to prevent overwriting existing files. Set to false to replace files
   * with the same name.
   */
  uniqueFilename?: boolean;

  /**
   * Explicit content type. Required when uploading streams
   * (where magic-byte detection is not possible without buffering).
   */
  contentType?: string;

  /**
   * Abort signal for cancelling an in-progress upload.
   */
  signal?: AbortSignal;
}

/**
 * Options for searching/filtering files.
 * Not all providers support search functionality.
 */
export interface SearchOptions {
  /**
   * Search query string
   */
  query?: string;

  /**
   * Filter by folder
   */
  folder?: string;

  /**
   * Filter by tags
   */
  tags?: string[];

  /**
   * Maximum number of results
   */
  limit?: number;

  /**
   * Pagination offset
   */
  offset?: number;
}

/**
 * Feature matrix describing provider capabilities.
 * Use this to check what features are supported before using them.
 */
export interface ProviderFeatures {
  /**
   * Supported image transformation features
   */
  transformations: {
    resize: boolean;
    crop: boolean;
    format: boolean;
    quality: boolean;
    blur: boolean;
    rotate: boolean;
    effects: boolean;
  };

  /**
   * General provider capabilities
   */
  capabilities: {
    signedUploads: boolean;
    directUpload: boolean;
    multipartUpload: boolean;
    videoProcessing: boolean;
    aiTagging: boolean;
    facialDetection: boolean;
  };

  /**
   * Storage-related limitations
   */
  storage: {
    maxFileSize: number;
    supportedFormats: string[];
  };
}

/**
 * Core interface that all media providers must implement.
 * Ensures consistent API across different cloud providers.
 *
 * @example
 * ```typescript
 * class MyProvider implements MediaProvider {
 *   readonly name = 'my-provider';
 *   readonly features = MyProviderFeatures;
 *
 *   async upload(file, options) {
 *     // Implementation
 *   }
 *
 *   // ... other methods
 * }
 * ```
 */
export interface MediaProvider {
  /**
   * Upload a single file to the provider.
   *
   * @param file - File to upload (browser File, Node.js Buffer, or readable stream)
   * @param options - Upload options
   * @returns Promise resolving to upload result
   * @throws {MediaError} If upload fails
   */
  upload(file: UploadInput, options?: UploadOptions): Promise<UploadResult>;

  /**
   * Delete a file by its ID.
   *
   * @param id - File identifier from upload result
   * @returns Promise that resolves when deletion is complete
   * @throws {MediaError} If deletion fails
   */
  delete(id: string): Promise<void>;

  /**
   * Get metadata for a file by its ID.
   *
   * @param id - File identifier
   * @returns Promise resolving to file metadata
   * @throws {MediaError} If file not found
   */
  get(id: string): Promise<UploadResult>;

  /**
   * Generate a URL for accessing the file, optionally with transformations.
   *
   * @param id - File identifier
   * @param transform - Optional transformation options
   * @returns URL string
   */
  getUrl(id: string, transform?: TransformationOptions): string;

  /**
   * Upload multiple files in batch.
   *
   * @param files - Array of files to upload
   * @param options - Upload options (applied to all files)
   * @returns Promise resolving to array of upload results
   * @throws {MediaError} If any upload fails
   */
  uploadMultiple(files: File[] | Buffer[], options?: UploadOptions): Promise<UploadResult[]>;

  /**
   * Delete multiple files in batch.
   *
   * @param ids - Array of file identifiers
   * @returns Promise that resolves when all deletions are complete
   * @throws {MediaError} If any deletion fails
   */
  deleteMultiple(ids: string[]): Promise<void>;

  /**
   * Search for files (optional - not all providers support this).
   *
   * @param query - Search options
   * @returns Promise resolving to matching files
   * @throws {MediaError} If search fails or not supported
   */
  search?(query: SearchOptions): Promise<UploadResult[]>;

  /**
   * Access to the native provider client for advanced usage.
   * Type is provider-specific (e.g., cloudinary.v2, S3Client).
   */
  readonly native: unknown;

  /**
   * Feature matrix describing what this provider supports
   */
  readonly features: ProviderFeatures;

  /**
   * Provider name identifier
   */
  readonly name: string;
}

/**
 * Supported upload input types.
 * - `File`: Browser File API object
 * - `Buffer`: Node.js Buffer
 * - `Readable`: Node.js readable stream (from `node:stream`)
 * - `ReadableStream<Uint8Array>`: Web Streams API readable stream
 *
 * When providing a stream, set `options.contentType` explicitly since
 * magic-byte detection requires buffering the entire stream.
 */
export type UploadInput =
  | File
  | Buffer
  | import('node:stream').Readable
  | ReadableStream<Uint8Array>;

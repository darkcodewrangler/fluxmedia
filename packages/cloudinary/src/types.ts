/**
 * Configuration options for Cloudinary provider
 */
export interface CloudinaryConfig {
    /**
     * Cloudinary cloud name
     */
    cloudName: string;

    /**
     * API key
     */
    apiKey: string;

    /**
     * API secret
     */
    apiSecret: string;

    /**
     * Use secure URLs (https)
     * @default true
     */
    secure?: boolean;
}

/**
 * Cloudinary-specific upload options
 */
export interface CloudinaryUploadOptions {
    folder?: string;
    public_id?: string;
    tags?: string[];
    context?: Record<string, string>;
    transformation?: unknown[];
    resource_type?: 'image' | 'video' | 'raw' | 'auto';
    [key: string]: unknown;
}

/**
 * Raw response from Cloudinary upload API
 */
export interface CloudinaryUploadResponse {
    public_id: string;
    version: number;
    signature: string;
    width?: number;
    height?: number;
    format: string;
    resource_type: string;
    created_at: string;
    tags?: string[];
    bytes: number;
    type: string;
    url: string;
    secure_url: string;
    [key: string]: unknown;
}

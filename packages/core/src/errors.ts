/**
 * Enum defining standardized error codes for media operations.
 * Used across all providers to ensure consistent error handling.
 */
export enum MediaErrorCode {
    // Upload errors
    UPLOAD_FAILED = 'UPLOAD_FAILED',
    FILE_TOO_LARGE = 'FILE_TOO_LARGE',
    INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',
    NETWORK_ERROR = 'NETWORK_ERROR',

    // Authentication errors
    INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
    UNAUTHORIZED = 'UNAUTHORIZED',

    // Provider errors
    PROVIDER_ERROR = 'PROVIDER_ERROR',
    RATE_LIMITED = 'RATE_LIMITED',
    QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',

    // Configuration errors
    INVALID_CONFIG = 'INVALID_CONFIG',
    MISSING_CREDENTIALS = 'MISSING_CREDENTIALS',

    // File errors
    FILE_NOT_FOUND = 'FILE_NOT_FOUND',
    DELETE_FAILED = 'DELETE_FAILED',
}

/**
 * Custom error class for all media-related errors.
 * Wraps provider-specific errors with standardized codes and metadata.
 *
 * @example
 * ```typescript
 * throw new MediaError(
 *   'Upload failed: file too large',
 *   MediaErrorCode.FILE_TOO_LARGE,
 *   'cloudinary',
 *   originalError,
 *   { maxSize: '100MB', fileSize: '150MB' }
 * );
 * ```
 */
export class MediaError extends Error {
    /**
     * Standardized error code
     */
    public readonly code: MediaErrorCode;

    /**
     * Name of the provider where the error occurred
     */
    public readonly provider: string;

    /**
     * Original error from the provider (if available)
     */
    public readonly originalError?: unknown;

    /**
     * Additional context about the error
     */
    public readonly details?: Record<string, unknown>;

    constructor(
        message: string,
        code: MediaErrorCode,
        provider: string,
        originalError?: unknown,
        details?: Record<string, unknown>
    ) {
        super(message);
        this.name = 'MediaError';
        this.code = code;
        this.provider = provider;
        this.originalError = originalError;
        this.details = details as Record<string, unknown>;

        // Maintains proper stack trace for where our error was thrown (only available on V8)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, MediaError);
        }
    }
}

/**
 * Helper function to create a MediaError from a caught error.
 * Automatically extracts relevant information from the original error.
 *
 * @param code - The standardized error code
 * @param provider - Name of the provider
 * @param error - The original error
 * @param additionalDetails - Optional additional context
 * @returns A new MediaError instance
 *
 * @example
 * ```typescript
 * try {
 *   await cloudinary.uploader.upload(file);
 * } catch (err) {
 *   throw createMediaError(
 *     MediaErrorCode.UPLOAD_FAILED,
 *     'cloudinary',
 *     err
 *   );
 * }
 * ```
 */
export function createMediaError(
    code: MediaErrorCode,
    provider: string,
    error: unknown,
    additionalDetails?: Record<string, unknown>
): MediaError {
    const message =
        error instanceof Error ? error.message : 'An unknown error occurred';

    return new MediaError(message, code, provider, error, additionalDetails);
}

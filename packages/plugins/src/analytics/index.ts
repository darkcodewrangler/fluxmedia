/**
 * Analytics/Logging Plugin for FluxMedia
 *
 * Provides environment-aware logging and analytics tracking for uploads.
 */

import {
    type FluxMediaPlugin,
    type UploadOptions,
    type UploadResult,
} from '@fluxmedia/core';

/**
 * Log level types
 */
export type LogLevel = 'none' | 'error' | 'warn' | 'info' | 'debug';

/**
 * Environment types
 */
export type Environment = 'development' | 'production' | 'test' | 'all';

/**
 * Analytics event types
 */
export type AnalyticsEventType =
    | 'media.upload.started'
    | 'media.upload.completed'
    | 'media.delete.completed'
    | 'media.error';

/**
 * Data payload for upload started event
 */
export interface UploadStartedEventData {
    fileName: string;
    fileSize: number;
    folder?: string | undefined;
    uploadId: string;
}

/**
 * Data payload for upload completed event
 */
export interface UploadCompletedEventData {
    fileId: string;
    fileName: string;
    fileSize: number;
    format: string;
    provider: string;
    duration: number;
    totalUploads: number;
    totalSize: number;
}

/**
 * Data payload for delete completed event
 */
export interface DeleteCompletedEventData {
    fileId: string;
}

/**
 * Data payload for error event
 */
export interface ErrorEventData {
    operation: 'upload' | 'delete' | 'get';
    error: {
        message: string;
        name: string;
    };
    totalErrors: number;
}

/**
 * Map of event types to their data payloads
 */
export interface AnalyticsEventMap {
    'media.upload.started': UploadStartedEventData;
    'media.upload.completed': UploadCompletedEventData;
    'media.delete.completed': DeleteCompletedEventData;
    'media.error': ErrorEventData;
}

/**
 * Typed track function signature
 */
export type TrackFunction = <T extends AnalyticsEventType>(
    event: T,
    data: AnalyticsEventMap[T]
) => void;

/**
 * Options for the analytics plugin
 */
export interface AnalyticsOptions {
    /** Environment to run in (default: 'all') */
    environment?: Environment;
    /** Log level (default: 'info') */
    logLevel?: LogLevel;
    /** Callback when upload starts */
    onUploadStart?: (file: File | Buffer, options: UploadOptions) => void;
    /** Callback when upload completes */
    onUploadComplete?: (result: UploadResult, durationMs: number) => void;
    /** Callback when upload fails */
    onUploadError?: (error: Error, file: File | Buffer) => void;
    /** Callback when file is deleted */
    onDelete?: (id: string) => void;
    /** Generic tracking function with typed events */
    track?: TrackFunction;
    /** Enable performance tracking (default: true) */
    trackPerformance?: boolean;
    /** Enable console logging (default: true) */
    console?: boolean;
}

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Get current environment
 */
function getCurrentEnvironment(): string {
    if (typeof process !== 'undefined' && process.env?.NODE_ENV) {
        return process.env.NODE_ENV;
    }
    return 'development';
}

/**
 * Create an analytics/logging plugin
 *
 * @param options - Analytics options
 * @returns FluxMediaPlugin instance
 *
 * @example
 * ```typescript
 * const analyticsPlugin = createAnalyticsPlugin({
 *   environment: 'production',
 *   track: (event, data) => myAnalytics.track(event, data),
 *   onUploadComplete: (result, duration) => {
 *     console.log(`Upload completed in ${duration}ms`);
 *   },
 * });
 * ```
 */
export function createAnalyticsPlugin(options: AnalyticsOptions = {}): FluxMediaPlugin {
    const config = {
        environment: options.environment ?? 'all',
        logLevel: options.logLevel ?? 'info',
        trackPerformance: options.trackPerformance ?? true,
        console: options.console ?? true,
        ...options,
    };

    // Check if plugin should be active
    const currentEnv = getCurrentEnvironment();
    const isActive = config.environment === 'all' || config.environment === currentEnv;

    // If not active, return a no-op plugin
    if (!isActive) {
        return {
            name: 'analytics',
            version: '1.0.0',
            hooks: {},
        };
    }

    // State for tracking
    const uploadStartTimes = new Map<string, number>();
    let totalUploads = 0;
    let totalSize = 0;
    let totalErrors = 0;

    // Log level hierarchy
    const logLevels: LogLevel[] = ['none', 'error', 'warn', 'info', 'debug'];

    const shouldLog = (level: LogLevel): boolean => {
        return logLevels.indexOf(level) <= logLevels.indexOf(config.logLevel);
    };

    const log = (level: 'error' | 'warn' | 'info' | 'debug', message: string, data?: unknown): void => {
        if (config.console && shouldLog(level)) {
            const timestamp = new Date().toISOString();
            console[level](`[FluxMedia Analytics] ${timestamp} - ${message}`, data ?? '');
        }
    };

    const track: TrackFunction = <T extends AnalyticsEventType>(event: T, data: AnalyticsEventMap[T]): void => {
        if (config.track) {
            config.track(event, data);
        }
        log('debug', `Event: ${event}`, data);
    };

    return {
        name: 'analytics',
        version: '1.0.0',
        hooks: {
            async beforeUpload(
                file: File | Buffer,
                uploadOptions: UploadOptions
            ): Promise<{ file: File | Buffer; options: UploadOptions } | void> {
                const fileName =
                    typeof File !== 'undefined' && file instanceof File
                        ? file.name
                        : uploadOptions.filename || 'unknown';
                const fileSize =
                    typeof File !== 'undefined' && file instanceof File
                        ? file.size
                        : (file as Buffer).byteLength;
                const uploadId = `${fileName}-${Date.now()}`;

                // Store start time
                if (config.trackPerformance) {
                    uploadStartTimes.set(uploadId, Date.now());
                }

                // Call onUploadStart callback
                if (options.onUploadStart) {
                    options.onUploadStart(file, uploadOptions);
                }

                // Track event
                track('media.upload.started', {
                    fileName,
                    fileSize,
                    folder: uploadOptions.folder,
                    uploadId,
                });

                log('info', `Upload started: ${fileName} (${formatBytes(fileSize)})`);

                // Store uploadId in metadata for afterUpload
                const enrichedOptions: UploadOptions = {
                    ...uploadOptions,
                    metadata: {
                        ...uploadOptions.metadata,
                        _analyticsUploadId: uploadId,
                        _analyticsFile: file,
                    },
                };

                return { file, options: enrichedOptions };
            },

            async afterUpload(result: UploadResult): Promise<UploadResult> {
                const uploadId = result.metadata?._analyticsUploadId as string | undefined;

                // Calculate duration
                let duration = 0;
                if (config.trackPerformance && uploadId) {
                    const startTime = uploadStartTimes.get(uploadId);
                    if (startTime) {
                        duration = Date.now() - startTime;
                        uploadStartTimes.delete(uploadId);
                    }
                }

                // Update totals
                totalUploads++;
                totalSize += result.size;

                // Call onUploadComplete callback
                if (options.onUploadComplete) {
                    options.onUploadComplete(result, duration);
                }

                // Track event
                track('media.upload.completed', {
                    fileId: result.id,
                    fileName: result.id,
                    fileSize: result.size,
                    format: result.format,
                    provider: result.provider,
                    duration,
                    totalUploads,
                    totalSize,
                });

                log('info', `Upload completed: ${result.id} in ${duration.toFixed(2)}ms`, {
                    size: formatBytes(result.size),
                    provider: result.provider,
                });

                // Add performance data to result metadata (excluding internal props)
                const cleanMetadata = { ...result.metadata };
                delete cleanMetadata._analyticsUploadId;
                delete cleanMetadata._analyticsFile;

                if (config.trackPerformance) {
                    cleanMetadata.performance = {
                        duration,
                        uploadSpeed: result.size / (duration / 1000), // bytes per second
                    };
                }

                return {
                    ...result,
                    metadata: cleanMetadata,
                };
            },

            async afterDelete(id: string): Promise<void> {
                // Call onDelete callback
                if (options.onDelete) {
                    options.onDelete(id);
                }

                // Track event
                track('media.delete.completed', { fileId: id });

                log('info', `File deleted: ${id}`);
            },

            async onError(
                error: Error,
                context: { file: File | Buffer; options: UploadOptions }
            ): Promise<void> {
                totalErrors++;

                // Call onUploadError callback
                if (options.onUploadError) {
                    options.onUploadError(error, context.file);
                }

                // Track error event
                track('media.error', {
                    operation: 'upload',
                    error: {
                        message: error.message,
                        name: error.name,
                    },
                    totalErrors,
                });

                log('error', `Upload failed: ${error.message}`, {
                    error: error.message,
                });
            },
        },
    };
}

/**
 * File Validation Plugin for FluxMedia
 *
 * Validates files before upload based on type, size, and extension.
 * Uses magic byte detection for reliable MIME type checking.
 */

import {
  type FluxMediaPlugin,
  type UploadOptions,
  MediaError,
  MediaErrorCode,
  UploadInput,
  getFileType,
} from '@fluxmedia/core';
import { fileToBuffer } from '../utils';

/**
 * Validation error types
 */
export type ValidationErrorType = 'TYPE' | 'SIZE' | 'EXTENSION' | 'CUSTOM';

/**
 * Validation error details
 */
export interface ValidationError {
  type: ValidationErrorType;
  message: string;
  file: UploadInput;
}

/**
 * Options for the file validation plugin
 */
export interface FileValidationOptions {
  /** Allowed MIME types (e.g., ['image/*', 'video/mp4']) */
  allowedTypes?: string[];
  /** Maximum file size in bytes */
  maxSize?: number;
  /** Minimum file size in bytes */
  minSize?: number;
  /** Allowed file extensions (e.g., ['.jpg', '.png']) */
  allowedExtensions?: string[];
  /** Blocked file extensions (e.g., ['.exe', '.bat']) */
  blockedExtensions?: string[];
  /** Custom validation function */
  customValidator?: (file: UploadInput, filename: string) => Promise<boolean> | boolean;
  /** Callback when validation fails */
  onValidationFailed?: (error: ValidationError) => void;
  /** Use magic byte detection for MIME type (default: true for Buffer, false for File) */
  useMagicBytes?: boolean;
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
 * Get file information from File or Buffer
 */
async function getFileInfo(
  file: UploadInput,
  options: UploadOptions,
  useMagicBytes: boolean
): Promise<{ size: number; name: string; type: string; ext: string }> {
  // For File instances without magic byte detection, use native File properties
  if (typeof File !== 'undefined' && file instanceof File && !useMagicBytes) {
    const name = file.name;
    const type = file.type || 'application/octet-stream';
    const ext = name.includes('.') ? '.' + name.split('.').pop()! : '';
    return { size: file.size, name, type, ext };
  }

  const buffer = await fileToBuffer(file);
  const result = await getFileType(buffer);
  if (!result) {
    throw new Error('Invalid file type');
  }
  return {
    size: buffer.length,
    name: file instanceof File ? file.name : options.filename || 'unknown',
    type: result.mime,
    ext: result.ext ? '.' + result.ext : '',
  };
}

/**
 * Create a file validation plugin
 *
 * @param options - Validation options
 * @returns FluxMediaPlugin instance
 *
 * @example
 * ```typescript
 * const validationPlugin = createFileValidationPlugin({
 *   allowedTypes: ['image/*', 'video/mp4'],
 *   maxSize: 10 * 1024 * 1024, // 10MB
 *   blockedExtensions: ['.exe', '.bat'],
 *   useMagicBytes: true, // Use magic byte detection
 * });
 * ```
 */
export function createFileValidationPlugin(options: FileValidationOptions = {}): FluxMediaPlugin {
  const useMagicBytes = options.useMagicBytes ?? false;

  return {
    name: 'file-validation',
    version: '1.0.0',
    hooks: {
      async beforeUpload(
        file: UploadInput,
        uploadOptions: UploadOptions
      ): Promise<{ file: UploadInput; options: UploadOptions }> {
        const {
          size: fileSize,
          name: fileName,
          type: fileType,
          ext: fileExt,
        } = await getFileInfo(file, uploadOptions, useMagicBytes);

        // Validate max file size
        if (options.maxSize && fileSize > options.maxSize) {
          const error: ValidationError = {
            type: 'SIZE',
            message: `File size ${formatBytes(fileSize)} exceeds maximum ${formatBytes(options.maxSize)}`,
            file,
          };

          options.onValidationFailed?.(error);

          throw new MediaError(
            error.message,
            MediaErrorCode.FILE_TOO_LARGE,
            'validation-plugin',
            undefined,
            { fileSize, maxSize: options.maxSize }
          );
        }

        // Validate min file size
        if (options.minSize && fileSize < options.minSize) {
          const error: ValidationError = {
            type: 'SIZE',
            message: `File size ${formatBytes(fileSize)} is below minimum ${formatBytes(options.minSize)}`,
            file,
          };

          options.onValidationFailed?.(error);

          throw new MediaError(
            error.message,
            MediaErrorCode.INVALID_FILE_TYPE,
            'validation-plugin',
            undefined,
            { fileSize, minSize: options.minSize }
          );
        }

        // Validate file type (MIME type)
        if (options.allowedTypes && options.allowedTypes.length > 0) {
          const isAllowed = options.allowedTypes.some((type) => {
            if (type.endsWith('/*')) {
              const baseType = type.replace('/*', '');
              return fileType.startsWith(baseType);
            }
            return fileType === type;
          });

          if (!isAllowed) {
            const error: ValidationError = {
              type: 'TYPE',
              message: `File type "${fileType || 'unknown'}" not allowed. Allowed types: ${options.allowedTypes.join(', ')}`,
              file,
            };

            options.onValidationFailed?.(error);

            throw new MediaError(
              error.message,
              MediaErrorCode.INVALID_FILE_TYPE,
              'validation-plugin',
              undefined,
              { fileType, allowedTypes: options.allowedTypes }
            );
          }
        }

        // Validate blocked extensions
        if (options.blockedExtensions && options.blockedExtensions.includes(fileExt)) {
          const error: ValidationError = {
            type: 'EXTENSION',
            message: `File extension "${fileExt}" is blocked`,
            file,
          };

          options.onValidationFailed?.(error);

          throw new MediaError(
            error.message,
            MediaErrorCode.INVALID_FILE_TYPE,
            'validation-plugin',
            undefined,
            { extension: fileExt, blockedExtensions: options.blockedExtensions }
          );
        }

        // Validate allowed extensions
        if (options.allowedExtensions && options.allowedExtensions.length > 0) {
          if (!options.allowedExtensions.includes(fileExt)) {
            const error: ValidationError = {
              type: 'EXTENSION',
              message: `File extension "${fileExt}" not allowed. Allowed: ${options.allowedExtensions.join(', ')}`,
              file,
            };

            options.onValidationFailed?.(error);

            throw new MediaError(
              error.message,
              MediaErrorCode.INVALID_FILE_TYPE,
              'validation-plugin',
              undefined,
              { extension: fileExt, allowedExtensions: options.allowedExtensions }
            );
          }
        }

        // Custom validation
        if (options.customValidator) {
          const isValid = await options.customValidator(file, fileName);

          if (!isValid) {
            const error: ValidationError = {
              type: 'CUSTOM',
              message: 'File failed custom validation',
              file,
            };

            options.onValidationFailed?.(error);

            throw new MediaError(
              error.message,
              MediaErrorCode.INVALID_FILE_TYPE,
              'validation-plugin'
            );
          }
        }

        // Add validation metadata to options
        const enrichedOptions: UploadOptions = {
          ...uploadOptions,
          metadata: {
            ...uploadOptions.metadata,
            validation: {
              fileSize,
              fileName,
              fileType,
              fileExt,
              validated: true,
              timestamp: new Date().toISOString(),
            },
          },
        };

        return { file, options: enrichedOptions };
      },
    },
  };
}

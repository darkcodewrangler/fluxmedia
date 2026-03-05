/**
 * Metadata Extraction Plugin for FluxMedia
 *
 * Extracts EXIF data, dimensions, and file hashes.
 * Requires sharp as a peer dependency for image metadata.
 */

import { type FluxMediaPlugin, type UploadOptions } from '@fluxmedia/core';
import crypto from 'crypto';

/**
 * Options for the metadata extraction plugin
 */
export interface MetadataExtractionOptions {
  /** Extract EXIF data (default: true) */
  extractExif?: boolean;
  /** Extract image dimensions (default: true) */
  extractDimensions?: boolean;
  /** Generate file hash for deduplication (default: false) */
  hashFile?: boolean;
  /** Hash algorithm: 'md5' or 'sha256' (default: 'md5') */
  hashAlgorithm?: 'md5' | 'sha256';
}

/**
 * Extracted metadata structure
 */
export interface ExtractedMetadata {
  dimensions?:
    | {
        width: number;
        height: number;
      }
    | undefined;
  exif?:
    | {
        make?: string;
        model?: string;
        orientation?: number | undefined;
        dateTime?: string | undefined;
        exposureTime?: number | undefined;
        fNumber?: number | undefined;
        iso?: number | undefined;
        focalLength?: number | undefined;
        gps?:
          | {
              latitude?: number[] | undefined;
              longitude?: number[] | undefined;
            }
          | undefined;
      }
    | undefined;
  hash?: string | undefined;
  hashAlgorithm?: string | undefined;
}

/**
 * Check if file is an image
 */
function isImage(file: File | Buffer): boolean {
  if (typeof File !== 'undefined' && file instanceof File) {
    return file.type.startsWith('image/');
  }
  return false;
}

/**
 * Convert File to Buffer
 */
async function fileToBuffer(file: File | Buffer): Promise<Buffer> {
  if (file instanceof Buffer) {
    return file;
  }
  const buffer = Buffer.from(await (file as File).arrayBuffer());
  return buffer;
}

/**
 * Create a metadata extraction plugin
 *
 * @param options - Extraction options
 * @returns FluxMediaPlugin instance
 *
 * @example
 * ```typescript
 * const metadataPlugin = createMetadataExtractionPlugin({
 *   extractExif: true,
 *   extractDimensions: true,
 *   hashFile: true,
 *   hashAlgorithm: 'sha256',
 * });
 * ```
 */
export function createMetadataExtractionPlugin(
  options: MetadataExtractionOptions = {}
): FluxMediaPlugin {
  const config = {
    extractExif: options.extractExif ?? true,
    extractDimensions: options.extractDimensions ?? true,
    hashFile: options.hashFile ?? false,
    hashAlgorithm: options.hashAlgorithm ?? 'md5',
  };

  return {
    name: 'metadata-extraction',
    version: '1.0.0',
    optional: true,
    hooks: {
      async beforeUpload(
        file: File | Buffer,
        uploadOptions: UploadOptions
      ): Promise<{ file: File | Buffer; options: UploadOptions } | void> {
        try {
          const extracted: ExtractedMetadata = {};

          // Convert to buffer for processing
          const buffer = await fileToBuffer(file);

          // Extract image metadata if it's an image
          if (isImage(file) && (config.extractDimensions || config.extractExif)) {
            try {
              const sharp = (await import('sharp')).default;
              const image = sharp(buffer);
              const metadata = await image.metadata();

              // Extract dimensions
              if (config.extractDimensions && metadata.width && metadata.height) {
                extracted.dimensions = {
                  width: metadata.width,
                  height: metadata.height,
                };
              }

              // Extract EXIF
              if (config.extractExif && metadata.exif) {
                // Parse EXIF buffer - sharp provides raw EXIF buffer
                // We'll extract basic orientation and format info
                extracted.exif = {
                  orientation: metadata.orientation,
                };
                //TODO: Add more EXIF data extraction
                // Additional EXIF data extraction would require exif-parser
                // For now, we include what sharp provides
                if (metadata.format) {
                  (extracted.exif as Record<string, unknown>).format = metadata.format;
                }
                if (metadata.density) {
                  (extracted.exif as Record<string, unknown>).density = metadata.density;
                }
              }
            } catch {
              // Sharp not available or image processing failed
              console.warn('[metadata-extraction] Image metadata extraction failed');
            }
          }

          // Generate file hash
          if (config.hashFile) {
            const hash = crypto.createHash(config.hashAlgorithm).update(buffer).digest('hex');

            extracted.hash = hash;
            extracted.hashAlgorithm = config.hashAlgorithm;
          }

          // Add extracted metadata to options
          const enrichedOptions: UploadOptions = {
            ...uploadOptions,
            metadata: {
              ...uploadOptions.metadata,
              extracted,
            },
          };

          return { file, options: enrichedOptions };
        } catch (error) {
          // Don't fail upload on metadata extraction errors
          console.error('[metadata-extraction] Extraction failed:', error);
          return { file, options: uploadOptions };
        }
      },
    },
  };
}

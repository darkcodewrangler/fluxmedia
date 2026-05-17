/**
 * Image Optimization Plugin for FluxMedia (Server-side)
 *
 * Optimizes images using sharp before upload.
 * Requires sharp as a peer dependency.
 */

import { UploadInput, type FluxMediaPlugin, type UploadOptions } from '@fluxmedia/core';
import { fileToBuffer, isImageFile, isSvgFile } from '../utils';

/**
 * Options for the image optimization plugin
 */
export interface ImageOptimizationOptions {
  /** Maximum width in pixels (default: 2000) */
  maxWidth?: number;
  /** Maximum height in pixels (default: 2000) */
  maxHeight?: number;
  /** Quality 0-1 for lossy formats (default: 0.85) */
  quality?: number;
  /** Output format: 'auto', 'webp', 'avif', 'jpeg', 'png' (default: 'auto') */
  format?: 'auto' | 'webp' | 'avif' | 'jpeg' | 'png';
  /** Strip EXIF and other metadata (default: true) */
  stripMetadata?: boolean;
  /** Auto-orient based on EXIF (default: true) */
  autoOrient?: boolean;
  /** Preserve aspect ratio when resizing (default: true) */
  preserveAspectRatio?: boolean;
}

/**
 * Optimization result metadata
 */
export interface OptimizationMetadata {
  originalSize: number;
  optimizedSize: number;
  savings: number;
  savingsPercent: string;
  format: string;
  quality: number;
  resized: boolean;
  dimensions?:
    | {
        original: { width: number; height: number };
        optimized: { width: number; height: number };
      }
    | undefined;
}



/**
 * Create an image optimization plugin (server-side)
 *
 * @param options - Optimization options
 * @returns FluxMediaPlugin instance
 *
 * @example
 * ```typescript
 * const optimizationPlugin = createImageOptimizationPlugin({
 *   maxWidth: 2000,
 *   maxHeight: 2000,
 *   quality: 0.85,
 *   format: 'webp',
 * });
 * ```
 */
export function createImageOptimizationPlugin(
  options: ImageOptimizationOptions = {}
): FluxMediaPlugin {
  const config = {
    maxWidth: options.maxWidth ?? 2000,
    maxHeight: options.maxHeight ?? 2000,
    quality: options.quality ?? 0.85,
    format: options.format ?? 'auto',
    stripMetadata: options.stripMetadata ?? true,
    autoOrient: options.autoOrient ?? true,
    preserveAspectRatio: options.preserveAspectRatio ?? true,
  };

  return {
    name: 'image-optimization',
    version: '1.0.0',
    hooks: {
      async beforeUpload(
        file: UploadInput,
        uploadOptions: UploadOptions
      ): Promise<{ file: UploadInput; options: UploadOptions } | void> {
        // Only process images
        if (!isImageFile(file)) {
          return { file, options: uploadOptions };
        }

        // Skip SVG (vector format, doesn't need optimization)
        if (isSvgFile(file)) {
          return { file, options: uploadOptions };
        }

        try {
          // Lazy load sharp (peer dependency)
          const sharp = (await import('sharp')).default;

          const originalSize =
            typeof File !== 'undefined' && file instanceof File
              ? file.size
              : (file as Buffer).length;

          // Convert to buffer
          const buffer = await fileToBuffer(file);

          // Create sharp instance
          let image = sharp(buffer);

          // Auto-orient based on EXIF
          if (config.autoOrient) {
            image = image.rotate();
          }

          // Get original metadata
          const originalMetadata = await image.metadata();

          // Check if resize is needed
          const needsResize = ((originalMetadata.width &&
            originalMetadata.width > config.maxWidth) ||
            (originalMetadata.height && originalMetadata.height > config.maxHeight)) as boolean;

          if (needsResize) {
            image = image.resize(config.maxWidth, config.maxHeight, {
              fit: config.preserveAspectRatio ? 'inside' : 'cover',
              withoutEnlargement: true,
            });
          }

          // Determine output format
          let outputFormat = config.format;
          if (outputFormat === 'auto') {
            outputFormat = 'webp';
          }

          // Apply format and quality
          const qualityPercent = Math.round(config.quality * 100);
          switch (outputFormat) {
            case 'webp':
              image = image.webp({ quality: qualityPercent });
              break;
            case 'avif':
              image = image.avif({ quality: qualityPercent });
              break;
            case 'jpeg':
              image = image.jpeg({ quality: qualityPercent });
              break;
            case 'png':
              image = image.png({ quality: qualityPercent });
              break;
          }

          // Strip metadata if requested
          if (config.stripMetadata) {
            image = image.withMetadata({});
          }

          // Convert to buffer
          const optimizedBuffer = await image.toBuffer();
          const optimizedSize = optimizedBuffer.byteLength;

          // Get optimized dimensions
          const optimizedMetadata = await sharp(optimizedBuffer).metadata();

          // Calculate savings
          const savings = originalSize - optimizedSize;
          const savingsPercent = ((savings / originalSize) * 100).toFixed(2);

          // Create optimization metadata
          const optimizationMeta: OptimizationMetadata = {
            originalSize,
            optimizedSize,
            savings,
            savingsPercent: `${savingsPercent}%`,
            format: outputFormat,
            quality: config.quality,
            resized: needsResize,
            dimensions:
              originalMetadata.width && originalMetadata.height
                ? {
                    original: {
                      width: originalMetadata.width,
                      height: originalMetadata.height,
                    },
                    optimized: {
                      width: optimizedMetadata.width!,
                      height: optimizedMetadata.height!,
                    },
                  }
                : undefined,
          };

          // Create new File or return Buffer
          let optimizedFile: File | Buffer;
          if (typeof File !== 'undefined' && file instanceof File) {
            const newFilename = file.name.replace(/\.[^.]+$/, `.${outputFormat}`);
            optimizedFile = new File([optimizedBuffer], newFilename, {
              type: `image/${outputFormat}`,
            });
          } else {
            optimizedFile = optimizedBuffer;
          }

          // Add optimization metadata to options
          const enrichedOptions: UploadOptions = {
            ...uploadOptions,
            metadata: {
              ...uploadOptions.metadata,
              optimization: optimizationMeta,
            },
          };

          return { file: optimizedFile, options: enrichedOptions };
        } catch (error) {
          // Log error but don't fail upload
          console.error('[image-optimization] Optimization failed:', error);
          return { file, options: uploadOptions };
        }
      },
    },
  };
}

/**
 * FluxMedia Basic Node.js Example
 * Demonstrates all available providers and plugin system
 */

import { MediaUploader, createPlugin } from '@fluxmedia/core';
import { CloudinaryProvider } from '@fluxmedia/cloudinary';
import { R2Provider } from '@fluxmedia/r2';
import { S3Provider } from '@fluxmedia/s3';
import { config } from 'dotenv';

// Load environment variables from .env file
config();

// ============================================================================
// PLUGIN EXAMPLES
// ============================================================================

/**
 * Logger Plugin - Logs all upload/delete operations
 * Great for debugging and monitoring
 */
const loggerPlugin = createPlugin('logger', {
    beforeUpload: async (file, options) => {
        const size = file instanceof Buffer ? file.byteLength : file.size;
        console.log(`[Logger] Starting upload: ${options.filename || 'unnamed'} (${formatBytes(size)})`);
        return { file, options };
    },
    afterUpload: async (result) => {
        console.log(`[Logger] Upload complete: ${result.id}`);
        console.log(`[Logger]   URL: ${result.url}`);
        console.log(`[Logger]   Size: ${formatBytes(result.size)}`);
        return result;
    },
    onError: async (error, context) => {
        console.error(`[Logger] Upload failed:`, error.message);
    },
    beforeDelete: async (id) => {
        console.log(`[Logger] Deleting: ${id}`);
        return id;
    },
    afterDelete: async (id) => {
        console.log(`[Logger] Deleted: ${id}`);
    },
}, { version: '1.0.0' });

/**
 * Metadata Enrichment Plugin - Adds automatic metadata to uploads
 */
const metadataPlugin = createPlugin('metadata-enricher', {
    beforeUpload: async (file, options) => {
        // Add automatic metadata
        const enrichedOptions = {
            ...options,
            metadata: {
                ...options.metadata,
                uploadedAt: new Date().toISOString(),
                uploadedBy: 'fluxmedia-example',
                environment: process.env.NODE_ENV || 'development',
            },
        };
        return { file, options: enrichedOptions };
    },
    afterUpload: async (result) => {
        // Add processing timestamp to result metadata
        return {
            ...result,
            metadata: {
                ...result.metadata,
                processedAt: new Date().toISOString(),
            },
        };
    },
});

/**
 * Validation Plugin - Validates file types and sizes before upload
 */
const validationPlugin = createPlugin('validator', {
    beforeUpload: async (file, options) => {
        const size = file instanceof Buffer ? file.byteLength : file.size;
        const maxSize = 10 * 1024 * 1024; // 10MB

        if (size > maxSize) {
            throw new Error(`File too large: ${formatBytes(size)} exceeds ${formatBytes(maxSize)}`);
        }

        // Check file type if available
        if (!(file instanceof Buffer) && file.type) {
            const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
            if (!allowedTypes.includes(file.type)) {
                throw new Error(`Invalid file type: ${file.type}. Allowed: ${allowedTypes.join(', ')}`);
            }
        }

        return { file, options };
    },
});

// ============================================================================
// PROVIDER SETUP
// ============================================================================

/**
 * Create Cloudinary provider (best for image transformations)
 */
function createCloudinaryUploader() {
    return new MediaUploader(
        new CloudinaryProvider({
            cloudName: process.env.CLOUDINARY_CLOUD_NAME || 'demo',
            apiKey: process.env.CLOUDINARY_API_KEY || '',
            apiSecret: process.env.CLOUDINARY_API_SECRET || '',
        })
    );
}

/**
 * Create AWS S3 provider (best for raw storage)
 */
function createS3Uploader() {
    return new MediaUploader(
        new S3Provider({
            region: process.env.S3_REGION || 'us-east-1',
            bucket: process.env.S3_BUCKET || 'my-bucket',
            accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
            secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
        })
    );
}

/**
 * Create Cloudflare R2 provider (S3-compatible, no egress fees)
 */
function createR2Uploader() {
    return new MediaUploader(
        new R2Provider({
            accountId: process.env.R2_ACCOUNT_ID || '',
            bucket: process.env.R2_BUCKET || 'my-bucket',
            accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
            secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
            publicUrl: process.env.R2_PUBLIC_URL, // Required for getUrl()
        })
    );
}

// ============================================================================
// MAIN DEMO
// ============================================================================

async function main() {
    console.log('='.repeat(60));
    console.log('FluxMedia - Comprehensive Node.js Example');
    console.log('='.repeat(60));
    console.log('');

    // -------------------------------------------------------------------------
    // 1. PROVIDER COMPARISON
    // -------------------------------------------------------------------------
    console.log('1. PROVIDER COMPARISON');
    console.log('-'.repeat(40));

    const providers = [
        { name: 'Cloudinary', uploader: createCloudinaryUploader() },
        { name: 'AWS S3', uploader: createS3Uploader() },
        { name: 'Cloudflare R2', uploader: createR2Uploader() },
    ];

    for (const { name, uploader } of providers) {
        console.log(`\n   ${name}:`);
        console.log(`   - Provider: ${uploader.provider.name}`);
        console.log(`   - Resize: ${uploader.supports('transformations.resize') ? 'Yes' : 'No'}`);
        console.log(`   - Format conversion: ${uploader.supports('transformations.format') ? 'Yes' : 'No'}`);
        console.log(`   - Video processing: ${uploader.supports('capabilities.videoProcessing') ? 'Yes' : 'No'}`);
        console.log(`   - Max file size: ${formatBytes(uploader.provider.features.storage.maxFileSize)}`);
    }
    console.log('');

    // -------------------------------------------------------------------------
    // 2. PLUGIN SYSTEM DEMO
    // -------------------------------------------------------------------------
    console.log('2. PLUGIN SYSTEM');
    console.log('-'.repeat(40));

    const cloudinaryUploader = createCloudinaryUploader();

    // Register plugins
    await cloudinaryUploader.use(loggerPlugin);
    await cloudinaryUploader.use(metadataPlugin);
    await cloudinaryUploader.use(validationPlugin);

    console.log(`   Registered plugins: ${cloudinaryUploader.getPlugins().map(p => p.name).join(', ')}`);
    console.log('');

    // -------------------------------------------------------------------------
    // 3. UPLOAD EXAMPLES
    // -------------------------------------------------------------------------
    console.log('3. UPLOAD EXAMPLES');
    console.log('-'.repeat(40));

    console.log(`
   Basic upload:
   -------------
   const result = await uploader.upload(file, {
       folder: 'my-uploads',
       filename: 'my-image',
       tags: ['example', 'nodejs'],
   });

   With transformations (Cloudinary only):
   ---------------------------------------
   const result = await uploader.upload(file, {
       folder: 'thumbnails',
       transformation: {
           width: 400,
           height: 400,
           fit: 'cover',
           format: 'webp',
           quality: 80,
       },
   });

   With progress tracking:
   -----------------------
   const result = await uploader.upload(file, {
       onProgress: (percent) => {
           console.log(\`Upload progress: \${percent}%\`);
       },
   });
`);

    // -------------------------------------------------------------------------
    // 4. URL GENERATION
    // -------------------------------------------------------------------------
    console.log('4. URL GENERATION');
    console.log('-'.repeat(40));

    const cloudinaryDemo = createCloudinaryUploader();
    const sampleId = 'sample';

    console.log('\n   Cloudinary URL transformations:');
    console.log(`   Original: ${cloudinaryDemo.getUrl(sampleId)}`);
    console.log(`   Thumbnail: ${cloudinaryDemo.getUrl(sampleId, { width: 200, height: 200, fit: 'cover' })}`);
    console.log(`   WebP format: ${cloudinaryDemo.getUrl(sampleId, { format: 'webp', quality: 80 })}`);
    console.log('');

    // -------------------------------------------------------------------------
    // 5. BATCH OPERATIONS
    // -------------------------------------------------------------------------
    console.log('5. BATCH OPERATIONS');
    console.log('-'.repeat(40));

    console.log(`
   Upload multiple files:
   ----------------------
   const results = await uploader.uploadMultiple(
       [file1, file2, file3],
       { folder: 'batch-uploads' }
   );

   Delete multiple files:
   ----------------------
   await uploader.deleteMultiple(['id1', 'id2', 'id3']);
`);

    // -------------------------------------------------------------------------
    // 6. ERROR HANDLING
    // -------------------------------------------------------------------------
    console.log('6. ERROR HANDLING');
    console.log('-'.repeat(40));

    console.log(`
   import { MediaError, MediaErrorCode } from '@fluxmedia/core';

   try {
       await uploader.upload(file);
   } catch (error) {
       if (error instanceof MediaError) {
           switch (error.code) {
               case MediaErrorCode.INVALID_CONFIG:
                   console.error('Configuration error:', error.message);
                   break;
               case MediaErrorCode.UPLOAD_FAILED:
                   console.error('Upload failed:', error.message);
                   break;
               case MediaErrorCode.FILE_NOT_FOUND:
                   console.error('File not found:', error.message);
                   break;
               case MediaErrorCode.UNAUTHORIZED:
                   console.error('Auth error:', error.message);
                   break;
           }
       }
   }
`);

    // -------------------------------------------------------------------------
    // 7. PLUGIN CREATION
    // -------------------------------------------------------------------------
    console.log('7. CREATING CUSTOM PLUGINS');
    console.log('-'.repeat(40));

    console.log(`
   import { createPlugin } from '@fluxmedia/core';

   const myPlugin = createPlugin('my-plugin', {
       beforeUpload: async (file, options) => {
           // Modify file or options before upload
           console.log('Before upload:', options.filename);
           return { file, options };
       },
       afterUpload: async (result) => {
           // Modify result after upload
           console.log('Uploaded:', result.url);
           return result;
       },
       onError: async (error, context) => {
           // Handle errors
           console.error('Error:', error.message);
       },
       beforeDelete: async (id) => {
           // Called before delete
           return id;
       },
       afterDelete: async (id) => {
           // Called after delete
       },
   }, { version: '1.0.0' });

   // Register the plugin
   await uploader.use(myPlugin);
`);

    // -------------------------------------------------------------------------
    // SUMMARY
    // -------------------------------------------------------------------------
    console.log('='.repeat(60));
    console.log('SUMMARY');
    console.log('='.repeat(60));
    console.log(`
   Providers:
   - @fluxmedia/cloudinary: Best for image/video transformations
   - @fluxmedia/s3: Standard AWS S3 storage
   - @fluxmedia/r2: Cloudflare R2 (S3-compatible, no egress fees)

   Features:
   - MediaUploader: Unified API across all providers
   - Plugin system: Extend with custom hooks
   - TypeScript: Full type safety
   - Error codes: Standardized error handling

   To run with real uploads:
   1. Copy .env.example to .env
   2. Fill in your provider credentials
   3. Uncomment the actual upload code
   4. Run: pnpm start
`);
}

// Utility function
function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});

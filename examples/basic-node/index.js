import { MediaUploader } from '@fluxmedia/core';
import { CloudinaryProvider } from '@fluxmedia/cloudinary';
import { readFileSync } from 'fs';
import { config } from 'dotenv';

// Load environment variables from .env file
config();

async function main() {
    console.log('🚀 FluxMedia Basic Node.js Example\n');

    // Create uploader with Cloudinary provider
    const uploader = new MediaUploader(
        new CloudinaryProvider({
            cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
            apiKey: process.env.CLOUDINARY_API_KEY || '',
            apiSecret: process.env.CLOUDINARY_API_SECRET || '',
        })
    );

    console.log('Provider:', uploader.provider.name);
    console.log('Supports transformations:', uploader.supports('transformations.resize'));
    console.log('');

    // Example 1: Upload a file
    console.log('📤 Example 1: Upload a file');
    try {
        // In a real app, you'd read an actual file
        // const fileBuffer = readFileSync('./path/to/image.jpg');

        // For demo purposes, we'll show the code structure
        console.log('   Code:');
        console.log('   const result = await uploader.upload(fileBuffer, {');
        console.log('     folder: "example-uploads",');
        console.log('     tags: ["demo", "nodejs"]');
        console.log('   });');
        console.log('');
        console.log('   ✅ Would upload to Cloudinary');
        console.log('   ✅ Result would include: id, url, size, format, etc.');
    } catch (error) {
        console.error('   ❌ Error:', error.message);
    }
    console.log('');

    // Example 2: Upload with transformations
    console.log('📐 Example 2: Upload with transformations');
    try {
        console.log('   Code:');
        console.log('   const result = await uploader.upload(fileBuffer, {');
        console.log('     folder: "thumbnails",');
        console.log('     transformation: {');
        console.log('       width: 400,');
        console.log('       height: 400,');
        console.log('       fit: "cover",');
        console.log('       format: "webp",');
        console.log('       quality: 80');
        console.log('     }');
        console.log('   });');
        console.log('');
        console.log('   ✅ Would upload and transform image');
        console.log('   ✅ Output: 400x400 WebP image, quality 80');
    } catch (error) {
        console.error('   ❌ Error:', error.message);
    }
    console.log('');

    // Example 3: Generate transformed URLs
    console.log('🔗 Example 3: Generate transformed URLs');
    try {
        const fileId = 'sample';

        const originalUrl = uploader.getUrl(fileId);
        console.log('   Original:', originalUrl);

        const thumbnailUrl = uploader.getUrl(fileId, {
            width: 200,
            height: 200,
            fit: 'cover',
            format: 'webp',
        });
        console.log('   Thumbnail:', thumbnailUrl);

        console.log('');
        console.log('   ✅ URLs generated without making API calls');
    } catch (error) {
        console.error('   ❌ Error:', error.message);
    }
    console.log('');

    // Example 4: Delete a file
    console.log('🗑️  Example 4: Delete a file');
    try {
        console.log('   Code:');
        console.log('   await uploader.delete("file-id");');
        console.log('');
        console.log('   ✅ Would delete file from Cloudinary');
    } catch (error) {
        console.error('   ❌ Error:', error.message);
    }
    console.log('');

    // Example 5: Batch operations
    console.log('📦 Example 5: Batch operations');
    try {
        console.log('   Upload multiple:');
        console.log('   const results = await uploader.uploadMultiple(');
        console.log('     [file1, file2, file3],');
        console.log('     { folder: "batch" }');
        console.log('   );');
        console.log('');
        console.log('   Delete multiple:');
        console.log('   await uploader.deleteMultiple(["id1", "id2", "id3"]);');
        console.log('');
        console.log('   ✅ Batch operations for efficiency');
    } catch (error) {
        console.error('   ❌ Error:', error.message);
    }
    console.log('');

    // Show feature matrix
    console.log('✨ Feature Matrix:');
    console.log('   Transformations:');
    console.log('   - Resize:', uploader.supports('transformations.resize') ? '✅' : '❌');
    console.log('   - Crop:', uploader.supports('transformations.crop') ? '✅' : '❌');
    console.log('   - Format:', uploader.supports('transformations.format') ? '✅' : '❌');
    console.log('   - Quality:', uploader.supports('transformations.quality') ? '✅' : '❌');
    console.log('   - Blur:', uploader.supports('transformations.blur') ? '✅' : '❌');
    console.log('');
    console.log('   Capabilities:');
    console.log('   - Signed uploads:', uploader.supports('capabilities.signedUploads') ? '✅' : '❌');
    console.log('   - Video processing:', uploader.supports('capabilities.videoProcessing') ? '✅' : '❌');
    console.log('   - AI tagging:', uploader.supports('capabilities.aiTagging') ? '✅' : '❌');
    console.log('');

    console.log('✅ Example completed!\n');
    console.log('To run with real uploads:');
    console.log('1. Create a .env file with your Cloudinary credentials');
    console.log('2. Uncomment the file read lines and provide an actual image');
    console.log('3. Run: pnpm start');
}

main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});

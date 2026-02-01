# FluxMedia Basic Node.js Example

Demonstrates using FluxMedia with all available providers and the plugin system.

## Providers Included

- **Cloudinary** - Best for image/video transformations
- **AWS S3** - Standard cloud storage
- **Cloudflare R2** - S3-compatible with no egress fees

## Setup

```bash
# Install dependencies
pnpm install

# Copy environment template
cp .env.example .env

# Add your credentials to .env
```

## Run

```bash
pnpm start
```

## Features Demonstrated

### 1. Multiple Providers

```javascript
import { MediaUploader } from '@fluxmedia/core';
import { CloudinaryProvider } from '@fluxmedia/cloudinary';
import { S3Provider } from '@fluxmedia/s3';
import { R2Provider } from '@fluxmedia/r2';

// Choose your provider
const uploader = new MediaUploader(
    new CloudinaryProvider({ ... })
);
```

### 2. Plugin System

```javascript
import { createPlugin } from '@fluxmedia/core';

// Create a logger plugin
const loggerPlugin = createPlugin('logger', {
    beforeUpload: async (file, options) => {
        console.log('Starting upload...');
        return { file, options };
    },
    afterUpload: async (result) => {
        console.log('Upload complete:', result.url);
        return result;
    },
    onError: async (error) => {
        console.error('Upload failed:', error.message);
    },
});

// Register the plugin
await uploader.use(loggerPlugin);
```

### 3. Upload with Transformations

```javascript
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
```

### 4. Batch Operations

```javascript
// Upload multiple files
const results = await uploader.uploadMultiple(files, { 
    folder: 'batch' 
});

// Delete multiple files
await uploader.deleteMultiple(['id1', 'id2', 'id3']);
```

## Environment Variables

See `.env.example` for all required credentials.

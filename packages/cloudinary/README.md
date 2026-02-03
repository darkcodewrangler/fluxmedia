# @fluxmedia/cloudinary

Cloudinary provider for FluxMedia - full-featured media management with on-the-fly transformations, AI tagging, and more.

## Installation

```bash
pnpm add @fluxmedia/core @fluxmedia/cloudinary cloudinary
```

## Quick Start

```typescript
import { MediaUploader } from '@fluxmedia/core';
import { CloudinaryProvider } from '@fluxmedia/cloudinary';

const uploader = new MediaUploader(
  new CloudinaryProvider({
    cloudName: 'your-cloud-name',
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET
  })
);

// Upload with transformations
const result = await uploader.upload(file, {
  folder: 'products',
  transformation: {
    width: 800,
    height: 600,
    fit: 'cover',
    format: 'webp',
    quality: 80
  }
});

console.log(result.url);
```

## Features

Cloudinary supports all FluxMedia features:

- **Image transformations** - resize, crop, format, quality
- **Advanced effects** - blur, rotate, filters
- **Video processing** - transcoding, thumbnails
- **AI features** - tagging, facial detection
- **Batch operations** - with progress tracking

## Configuration

```typescript
interface CloudinaryConfig {
  cloudName: string;   // Your Cloudinary cloud name
  apiKey: string;      // API key from dashboard
  apiSecret: string;   // API secret (keep secure!)
  secure?: boolean;    // Use HTTPS (default: true)
}
```

## Advanced Usage

### Access Native Cloudinary Client

```typescript
const cloudinary = uploader.provider.native;

// Use Cloudinary-specific features
await cloudinary.uploader.explicit('sample', {
  type: 'upload',
  eager: [{ effect: 'sepia' }]
});
```

### Check Feature Support

```typescript
if (uploader.supports('transformations.blur')) {
  // Cloudinary supports blur
}
```

## Examples

### Upload with tags

```typescript
const result = await uploader.upload(file, {
  folder: 'avatars',
  tags: ['user', 'profile'],
  transformation: {
    width: 400,
    height: 400,
    fit: 'cover',
    quality: 80,
    format: 'webp'
  },  metadata: {
    userId: '12345',
    uploadedAt: new Date().toISOString()
  }
});
```

## Generate Transformed URLs

```typescript
// Single transformation
const thumbnail = uploader.getUrl(result.id, {
  width: 150,
  height: 150,
  fit: 'cover',
  format: 'webp'
});

// Responsive sizes
const sizes = {
  small: uploader.getUrl(id, { width: 100 }),
  medium: uploader.getUrl(id, { width: 400 }),
  large: uploader.getUrl(id, { width: 800 })
};
```

## Batch Uploads

```typescript
const results = await uploader.uploadMultiple(files, {
  folder: 'batch-upload',
  concurrency: 5,
  onBatchProgress: (completed, total) => {
    console.log(`Uploaded ${completed}/${total} files`);
  }
});
```

## Delete Files

```typescript
// Delete single file
await uploader.delete(result.id);

// Delete with resource type
await uploader.delete(videoId, { resourceType: 'video' });

// Delete multiple files
await uploader.deleteMultiple(['id1', 'id2', 'id3']);
```

## Native SDK Access

Access the full Cloudinary SDK for advanced operations:

```typescript
const cloudinary = uploader.provider.native;

// Use native Cloudinary features
await cloudinary.uploader.explicit('sample', {
  type: 'upload',
  eager: [{ effect: 'sepia' }]
});

// Search API
const searchResult = await cloudinary.search
  .expression('folder:products')
  .execute();
```

## Check Feature Support

```typescript
if (uploader.supports('transformations.blur')) {
  // Apply blur effect
}

if (uploader.supports('capabilities.aiTagging')) {
  // Use AI tagging
}
```

## Environment Variables

```bash
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

## Provider Switching

The beauty of FluxMedia is that you can switch providers without changing your code:

```typescript
// Before: Cloudinary
import { CloudinaryProvider } from '@fluxmedia/cloudinary';
const uploader = new MediaUploader(new CloudinaryProvider({ ... }));

// After: S3 (same upload code!)
import { S3Provider } from '@fluxmedia/s3';
const uploader = new MediaUploader(new S3Provider({ ... }));

// Your upload code stays exactly the same
await uploader.upload(file, { folder: 'uploads' });
```

## License

MIT

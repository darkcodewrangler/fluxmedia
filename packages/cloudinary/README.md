# @fluxmedia/cloudinary

Cloudinary provider for FluxMedia - full-featured media upload with transformations, AI tagging, and more.

## Installation

```bash
pnpm add @fluxmedia/core @fluxmedia/cloudinary cloudinary
```

## Usage

```typescript
import { MediaUploader } from '@fluxmedia/core';
import { CloudinaryProvider } from '@fluxmedia/cloudinary';

const uploader = new MediaUploader(
  new CloudinaryProvider({
    cloudName: 'your-cloud-name',
    apiKey: 'your-api-key',
    apiSecret: 'your-api-secret'
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

- ✅ Image transformations (resize, crop, format, quality)
- ✅ Advanced transformations (blur, rotate, effects)
- ✅ Video processing
- ✅ AI tagging
- ✅ Facial detection
- ✅ Signed uploads
- ✅ Multipart uploads

## Configuration

```typescript
interface CloudinaryConfig {
  cloudName: string;     // Your Cloudinary cloud name
  apiKey: string;        // API key
  apiSecret: string;     // API secret
  secure?: boolean;      // Use HTTPS (default: true)
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
  folder: 'user-uploads',
  tags: ['user-content', 'profile-pic'],
  metadata: {
    userId: '12345',
    uploadedAt: new Date().toISOString()
  }
});
```

### Generate transformed URLs

```typescript
const thumbnailUrl = uploader.getUrl(result.id, {
  width: 200,
  height: 200,
  fit: 'cover',
  format: 'webp'
});
```

### Batch operations

```typescript
// Upload multiple files
const results = await uploader.uploadMultiple([file1, file2, file3], {
  folder: 'batch-upload'
});

// Delete multiple files
await uploader.deleteMultiple(['id1', 'id2', 'id3']);
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

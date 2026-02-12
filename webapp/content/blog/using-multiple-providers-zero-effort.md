---
title: Using Multiple Providers with Zero Effort
date: '2026-02-05'
excerpt: Learn how FluxMedia's unified API lets you use S3, Cloudinary, and R2 together without changing your upload code.
author: FluxMedia Team
tags: ['providers', 'multi-cloud', 'tutorial']
---

# Using Multiple Providers with Zero Effort

One of FluxMedia's core promises is a unified API. This guide shows how to use AWS S3, Cloudinary, and Cloudflare R2 together without rewriting your upload logic.

## The Problem

Traditional approach means each provider has its own SDK:

```typescript
// AWS S3
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
const client = new S3Client({ region: 'us-east-1', credentials: {...} });
await client.send(new PutObjectCommand({ Bucket: '...', Key: '...', Body: file }));

// Cloudinary - completely different!
import { v2 as cloudinary } from 'cloudinary';
cloudinary.config({ cloud_name: '...', api_key: '...', api_secret: '...' });
await cloudinary.uploader.upload(file, { folder: '...' });
```

Using multiple providers requires learning different APIs and writing separate logic. That's inefficient.

## The FluxMedia Solution

With FluxMedia, your upload code works consistently across any provider:

```typescript
// Your upload logic - works with ANY provider
async function uploadFile(uploader: MediaUploader, file: File) {
  const result = await uploader.upload(file, {
    folder: 'uploads',
    metadata: { type: 'user-upload' }
  });
  return result.url;
}
```

Use different providers by simply instantiating the right one:

```typescript
// S3 for archives
const s3Uploader = new MediaUploader(
  new S3Provider({
    region: 'us-east-1',
    bucket: 'my-archive-bucket',
    accessKeyId: process.env.S3_KEY,
    secretAccessKey: process.env.S3_SECRET,
  })
);

// Cloudinary for media assets
const cloudinaryUploader = new MediaUploader(
  new CloudinaryProvider({
    cloudName: process.env.CLOUDINARY_CLOUD,
    apiKey: process.env.CLOUDINARY_KEY,
    apiSecret: process.env.CLOUDINARY_SECRET,
  })
);

// R2 for video delivery
const r2Uploader = new MediaUploader(
  new R2Provider({
    accountId: process.env.R2_ACCOUNT,
    bucket: process.env.R2_BUCKET,
    accessKeyId: process.env.R2_KEY,
    secretAccessKey: process.env.R2_SECRET,
  })
);

// Same function works with all three!
await uploadFile(s3Uploader, file);
await uploadFile(cloudinaryUploader, file);
await uploadFile(r2Uploader, file);
```

## Environment-Based Provider Selection

A common pattern is selecting provider based on environment or use case:

```typescript
function createUploader(useCase: 'archive' | 'media' | 'video' = 'media') {
  
  switch (useCase) {
    case 'archive':
      return new MediaUploader(new S3Provider({ ... }));
      
    case 'media':
      return new MediaUploader(new CloudinaryProvider({ ... }));
      
    case 'video':
      return new MediaUploader(new R2Provider({ ... }));
      
    default:
      throw new Error(`Unknown use case: ${useCase}`);
  }
}

// Use based on needs
const archiveUploader = createUploader('archive');
const mediaUploader = createUploader('media');
```

## Feature Detection

Some features are provider-specific, but the API handles this gracefully. Use `supports()` to check:

```typescript
if (uploader.supports('transformations.resize')) {
  // Cloudinary supports on-the-fly transformations
  const url = uploader.getUrl(id, { width: 400, height: 400 });
} else {
  // S3/R2 don't - serve original
  const url = uploader.getUrl(id);
}
```

## When to Use Which Provider

| Provider       | Best For                                        |
| -------------- | ----------------------------------------------- |
| **S3**         | General storage, AWS ecosystem integration      |
| **R2**         | Cost savings (no egress fees), edge performance |
| **Cloudinary** | Image/video transformations, CDN delivery       |

## Integration Checklist

1. Install the provider packages you need
2. Configure credentials
3. Create your `createUploader` factory
4. Start uploading!

That's it. Consistent API for all your media needs.

## Next Steps

- [Getting Started](/blog/getting-started-with-fluxmedia)
- [Plugin System Deep Dive](/blog/understanding-the-plugin-system)
- [Full Documentation](/docs)

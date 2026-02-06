---
title: Switching Providers with Zero Effort
date: '2026-02-05'
excerpt: Learn how FluxMedia's unified API lets you migrate between S3, Cloudinary, and R2 without changing your upload code.
author: FluxMedia Team
tags: ['providers', 'migration', 'tutorial']
---

# Switching Providers with Zero Effort

One of FluxMedia's core promises is provider portability. This guide shows how to switch between AWS S3, Cloudinary, and Cloudflare R2 without touching your upload logic.

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

Switching requires rewriting all upload code. That's painful.

## The FluxMedia Solution

With FluxMedia, your upload code is provider-agnostic:

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

Switch providers by changing the uploader configuration:

```typescript
// S3
const s3Uploader = new MediaUploader(
  new S3Provider({
    region: 'us-east-1',
    bucket: 'my-bucket',
    accessKeyId: process.env.S3_KEY,
    secretAccessKey: process.env.S3_SECRET,
  })
);

// Cloudinary
const cloudinaryUploader = new MediaUploader(
  new CloudinaryProvider({
    cloudName: process.env.CLOUDINARY_CLOUD,
    apiKey: process.env.CLOUDINARY_KEY,
    apiSecret: process.env.CLOUDINARY_SECRET,
  })
);

// R2
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

A common pattern is selecting provider based on environment:

```typescript
function createUploader() {
  const provider = process.env.MEDIA_PROVIDER;
  
  switch (provider) {
    case 's3':
      return new MediaUploader(new S3Provider({
        region: process.env.S3_REGION!,
        bucket: process.env.S3_BUCKET!,
        accessKeyId: process.env.S3_KEY!,
        secretAccessKey: process.env.S3_SECRET!,
      }));
      
    case 'cloudinary':
      return new MediaUploader(new CloudinaryProvider({
        cloudName: process.env.CLOUDINARY_CLOUD!,
        apiKey: process.env.CLOUDINARY_KEY!,
        apiSecret: process.env.CLOUDINARY_SECRET!,
      }));
      
    case 'r2':
      return new MediaUploader(new R2Provider({
        accountId: process.env.R2_ACCOUNT!,
        bucket: process.env.R2_BUCKET!,
        accessKeyId: process.env.R2_KEY!,
        secretAccessKey: process.env.R2_SECRET!,
      }));
      
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

// Use throughout your app
export const uploader = createUploader();
```

## Feature Detection

Some features are provider-specific. Use `supports()` to check:

```typescript
if (uploader.supports('transformations.resize')) {
  // Cloudinary supports on-the-fly transformations
  const url = uploader.getUrl(id, { width: 400, height: 400 });
} else {
  // S3/R2 don't - serve original or pre-process
  const url = uploader.getUrl(id);
}
```

## When to Choose Which Provider

| Provider       | Best For                                        |
| -------------- | ----------------------------------------------- |
| **S3**         | General storage, AWS ecosystem integration      |
| **R2**         | Cost savings (no egress fees), edge performance |
| **Cloudinary** | Image/video transformations, CDN delivery       |

## Migration Checklist

1. Install the new provider package
2. Add environment variables for new provider
3. Update your `createUploader` factory
4. Deploy and test

That's it. Zero upload code changes required.

## Next Steps

- [Getting Started](/blog/getting-started-with-fluxmedia)
- [Plugin System Deep Dive](/blog/understanding-the-plugin-system)
- [Full Documentation](/docs)

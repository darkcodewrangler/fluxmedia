---
title: Getting Started with FluxMedia
date: '2026-02-01'
excerpt: Learn how to set up FluxMedia in your project and upload your first file in under 5 minutes.
author: FluxMedia Team
tags: ['getting-started', 'tutorial']
---

# Getting Started with FluxMedia

FluxMedia is a TypeScript-first media library that provides a unified API for uploading, managing, and serving media across multiple cloud providers. This guide will get you up and running in minutes.

## Installation

Install the core package and your preferred provider:

```bash
# For S3
pnpm add @fluxmedia/core @fluxmedia/s3

# For Cloudinary
pnpm add @fluxmedia/core @fluxmedia/cloudinary

# For Cloudflare R2
pnpm add @fluxmedia/core @fluxmedia/r2
```

## Quick Setup

Create your first uploader in just a few lines:

```typescript
import { MediaUploader } from '@fluxmedia/core';
import { S3Provider } from '@fluxmedia/s3';

const uploader = new MediaUploader(
  new S3Provider({
    region: 'us-east-1',
    bucket: 'my-bucket',
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  })
);
```

## Your First Upload

Now upload a file:

```typescript
const result = await uploader.upload(file, {
  folder: 'uploads',
  filename: 'profile-photo',
  metadata: { userId: '123' },
});

console.log(result.url);
// https://my-bucket.s3.amazonaws.com/uploads/profile-photo.jpg
```

## What Makes FluxMedia Different?

### Unified API
 
Write your upload logic once. Use it with any provider.
 
```typescript
// Need to use Cloudinary instead? Same API!
const uploader = new MediaUploader(
  new CloudinaryProvider({
    cloudName: 'my-cloud',
    apiKey: '...',
    apiSecret: '...',
  })
);
 
// Same upload code works everywhere!
await uploader.upload(file, { folder: 'uploads' });
```

### Full Type Safety

FluxMedia is built with TypeScript from the ground up. Enjoy full autocomplete and catch errors at compile time:

```typescript
const result = await uploader.upload(file);
// result.url ✓
// result.width ✓
// result.invalidProp ✗ TypeScript error!
```

### Extensible Plugin System

Add functionality with plugins:

```typescript
import { createPlugin } from '@fluxmedia/core';

const loggerPlugin = createPlugin('logger', {
  afterUpload: async (result) => {
    console.log('Uploaded:', result.url);
    return result;
  }
});

await uploader.use(loggerPlugin);
```

## Next Steps

- [Explore the Plugin System](/blog/understanding-the-plugin-system)
- [Using Multiple Providers with Zero Effort](/blog/using-multiple-providers-zero-effort)
- [Read the full documentation](/docs)

Happy uploading!

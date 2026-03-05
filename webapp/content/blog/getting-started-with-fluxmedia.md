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
# For Cloudinary
pnpm add @fluxmedia/core @fluxmedia/cloudinary

# For S3
pnpm add @fluxmedia/core @fluxmedia/s3

# For Cloudflare R2
pnpm add @fluxmedia/core @fluxmedia/r2
```

## Quick Setup

Create your first uploader in just a few lines:

```typescript
import { MediaUploader } from '@fluxmedia/core';
import { CloudinaryProvider } from '@fluxmedia/cloudinary';

const uploader = new MediaUploader(
  new CloudinaryProvider({
    cloudName: process.env.CLOUDINARY_CLOUD_NAME!,
    apiKey: process.env.CLOUDINARY_API_KEY!,
    apiSecret: process.env.CLOUDINARY_API_SECRET!,
  })
);
```

## Your First Upload

Now upload a file:

```typescript
const result = await uploader.upload(file, {
  folder: 'uploads',
  filename: 'profile-photo',
});

console.log(result.url);        // https://res.cloudinary.com/...
console.log(result.id);         // uploads/profile-photo
console.log(result.storageKey); // Provider-specific storage key
console.log(result.format);     // jpg
```

## Streaming Uploads

FluxMedia accepts more than just `File` and `Buffer`. You can upload directly from Node.js streams or web `ReadableStream`:

```typescript
import { createReadStream } from 'fs';

// Upload from a Node.js Readable stream
const stream = createReadStream('/path/to/large-file.mp4');
const result = await uploader.upload(stream, {
  folder: 'videos',
  contentType: 'video/mp4',
});

// Upload from a web ReadableStream (e.g. fetch response)
const response = await fetch('https://example.com/image.jpg');
const result = await uploader.upload(response.body!, {
  folder: 'imports',
});
```

This makes it easy to pipe data from any source directly into your provider without buffering the entire file in memory.

## Progress Tracking

Track upload progress with two levels of granularity:

```typescript
const result = await uploader.upload(file, {
  folder: 'uploads',
  onProgress: (percent) => {
    // Normalized 0-100 percentage
    progressBar.style.width = `${percent}%`;
  },
  onByteProgress: (loaded, total) => {
    // Raw byte counts for precise tracking
    console.log(`${loaded}/${total} bytes`);
  },
});
```

## Cancelling Uploads

Cancel in-flight uploads using the standard `AbortController`:

```typescript
const controller = new AbortController();

// Cancel after 30 seconds
setTimeout(() => controller.abort(), 30_000);

const result = await uploader.upload(file, {
  folder: 'uploads',
  signal: controller.signal,
});
```

## What Makes FluxMedia Different?

### One Unified API

Write your upload logic once. Integrate with any supported provider using the same interface:

```typescript
// Using Cloudinary
const uploader = new MediaUploader(
  new CloudinaryProvider({ cloudName: '...', apiKey: '...', apiSecret: '...' })
);

// Or using S3 — exact same upload code
import { S3Provider } from '@fluxmedia/s3';
const uploader = new MediaUploader(
  new S3Provider({ region: 'us-east-1', bucket: 'my-bucket', ... })
);

await uploader.upload(file, { folder: 'uploads' });
```

### Full Type Safety

FluxMedia is built with TypeScript from the ground up. Enjoy full autocomplete and catch errors at compile time:

```typescript
const result = await uploader.upload(file);
// result.url         ✓
// result.storageKey   ✓
// result.invalidProp  ✗ TypeScript error!
```

### Extensible Plugin System

Add functionality with the official plugins or build your own:

```typescript
import { createFileValidationPlugin, createRetryPlugin } from '@fluxmedia/plugins';

await uploader.use(createFileValidationPlugin({
  maxSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: ['image/*'],
}));
await uploader.use(createRetryPlugin({ maxRetries: 3 }));
```

### Feature Detection

Check if a provider supports specific capabilities:

```typescript
if (uploader.supports('transformations.resize')) {
  const url = uploader.getUrl(id, { width: 200, height: 200 });
}
```

## Next Steps

- [Explore the Plugin System](/blog/understanding-the-plugin-system)
- [Using Multiple Providers Together](/blog/using-multiple-providers-zero-effort)
- [Advanced Features: Streaming, Abort & Transactions](/blog/advanced-uploads-streaming-abort-transactions)
- [Read the full documentation](/docs)

Happy uploading!

---
title: Understanding the Plugin System
date: '2026-02-03'
excerpt: Deep dive into FluxMedia's powerful plugin system for validation, optimization, logging, and more.
author: FluxMedia Team
tags: ['plugins', 'advanced', 'tutorial']
---

# Understanding the Plugin System

FluxMedia's plugin system lets you extend and customize upload behavior without modifying core code. Whether you need validation, logging, optimization, or custom transformations, plugins have you covered.

## Plugin Lifecycle

Plugins hook into five key lifecycle points:

```
beforeUpload → [Upload to Provider] → afterUpload
                      ↓
                   onError
                      
beforeDelete → [Delete from Provider] → afterDelete
```

## Creating Your First Plugin

Use the `createPlugin` helper:

```typescript
import { createPlugin } from '@fluxmedia/core';

const myPlugin = createPlugin('my-plugin', {
  beforeUpload: async (file, options) => {
    console.log('Before upload:', options.filename);
    return { file, options }; // Must return both
  },
  
  afterUpload: async (result) => {
    console.log('Upload complete:', result.url);
    return result; // Must return result
  },
  
  onError: async (error, context) => {
    console.error('Upload failed:', error.message);
    // No return needed
  }
});
```

## Real-World Plugin Examples

### Validation Plugin

Validate file types and sizes before upload:

```typescript
const validationPlugin = createPlugin('validator', {
  beforeUpload: async (file, options) => {
    const size = file.size || file.byteLength;
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    if (size > maxSize) {
      throw new Error(`File exceeds ${maxSize / 1024 / 1024}MB limit`);
    }
    
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (file.type && !allowedTypes.includes(file.type)) {
      throw new Error(`File type ${file.type} not allowed`);
    }
    
    return { file, options };
  }
});
```

### Metadata Enrichment

Automatically add metadata to every upload:

```typescript
const metadataPlugin = createPlugin('metadata', {
  beforeUpload: async (file, options) => {
    return {
      file,
      options: {
        ...options,
        metadata: {
          ...options.metadata,
          uploadedAt: new Date().toISOString(),
          environment: process.env.NODE_ENV,
        }
      }
    };
  }
});
```

### Analytics Logger

Track all uploads for analytics:

```typescript
const analyticsPlugin = createPlugin('analytics', {
  afterUpload: async (result) => {
    await trackEvent('file_uploaded', {
      fileId: result.id,
      size: result.size,
      provider: result.provider,
      duration: result.duration,
    });
    return result;
  },
  
  onError: async (error, context) => {
    await trackEvent('upload_failed', {
      error: error.message,
      filename: context.options?.filename,
    });
  }
});
```

## Registering Plugins

Register plugins with your uploader:

```typescript
const uploader = new MediaUploader(new S3Provider({ ... }));

// Register single plugin
await uploader.use(validationPlugin);

// Register multiple plugins
await uploader.use(metadataPlugin);
await uploader.use(analyticsPlugin);

// Check registered plugins
console.log(uploader.getPlugins().map(p => p.name));
// ['validator', 'metadata', 'analytics']
```

## Plugin Execution Order

Plugins execute in registration order:

1. All `beforeUpload` hooks run in order
2. File uploads to provider
3. All `afterUpload` hooks run in order

If any hook throws, `onError` hooks are called and upload stops.

## Official Plugins

The `@fluxmedia/plugins` package includes battle-tested plugins:

```bash
pnpm add @fluxmedia/plugins
```

- **File Validation** - Type, size, and extension validation
- **Image Optimization** - Resize and compress before upload
- **Metadata Extraction** - Extract EXIF, dimensions, file hash
- **Analytics** - Configurable logging and tracking
- **Retry** - Automatic retry with exponential backoff

## Next Steps

- [Getting Started Guide](/blog/getting-started-with-fluxmedia)
- [Switch Providers Effortlessly](/blog/switching-providers-zero-effort)
- [Full Documentation](/docs)

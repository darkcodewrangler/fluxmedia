# FluxMedia

<p align="left">
  <img src="./webapp/public/fluxmedia-logo.svg" alt="FluxMedia logo" width="260" />
</p>

**One API for all your media uploads.**

A unified, TypeScript-first media library for modern applications. Upload to Cloudinary, S3, R2, and more with a single interface.

## Overview

FluxMedia is a **monorepo** that provides a single, consistent API for media uploads across multiple cloud storage and CDN providers. Instead of writing provider-specific integration code for Cloudinary, AWS S3, or Cloudflare R2, you configure one `MediaUploader` instance and your upload logic stays the same no matter which backend you use.

The monorepo is organized into focused packages:

- **`@fluxmedia/core`** – the provider-agnostic `MediaUploader` class, shared TypeScript types, error codes, file-type detection utilities, and the plugin interface.
- **`@fluxmedia/cloudinary`**, **`@fluxmedia/s3`**, **`@fluxmedia/r2`** – thin provider adapters that translate the unified API into provider-specific SDK calls.
- **`@fluxmedia/plugins`** – optional, composable plugins (validation, image optimization, metadata extraction, analytics, retry).
- **`@fluxmedia/react`** – React hooks (`useMediaUpload`) and ready-to-use components built on top of the core library.

Typical use cases include profile-picture uploads, document management, video hosting pipelines, and any scenario where you need reliable, type-safe file uploads without locking yourself into a single cloud provider.

## Features

- **Unified API** - Write once, use any provider
- **Type-safe** - Full TypeScript support with intelligent autocomplete
- **Tree-shakeable** - Only bundle what you use
- **React integration** - Hooks and components included
- **Extensible** - Plugin system and native provider API access
- **Lightweight** - Lazy loading and dynamic imports for minimal bundle size

## Quick Start

```bash
# Install core + provider
pnpm add @fluxmedia/core @fluxmedia/cloudinary cloudinary
```

```typescript
import { MediaUploader } from '@fluxmedia/core';
import { CloudinaryProvider } from '@fluxmedia/cloudinary';

const uploader = new MediaUploader(
  new CloudinaryProvider({
    cloudName: 'your-cloud',
    apiKey: 'your-key',
    apiSecret: 'your-secret',
  })
);

const result = await uploader.upload(file, {
  folder: 'avatars',
  transformation: {
    width: 400,
    height: 400,
    fit: 'cover',
    format: 'webp',
  },
});

console.log(result.url);
```

## Packages

| Package                                        | Description                 | Size  |
| ---------------------------------------------- | --------------------------- | ----- |
| [@fluxmedia/core](./packages/core)             | Core types and abstractions | ~13KB |
| [@fluxmedia/cloudinary](./packages/cloudinary) | Cloudinary provider         | ~14KB |
| [@fluxmedia/s3](./packages/s3)                 | AWS S3 provider             | ~11KB |
| [@fluxmedia/r2](./packages/r2)                 | Cloudflare R2 provider      | ~12KB |
| [@fluxmedia/plugins](./packages/plugins)       | Official plugins            | ~20KB |
| [@fluxmedia/react](./packages/react)           | React hooks and components  | ~9KB  |

## Why FluxMedia?

### Unified API Across Providers

Use the same code regardless of which provider you choose:

```typescript
// Cloudinary
const uploader = new MediaUploader(new CloudinaryProvider({ ... }));

// S3
const uploader = new MediaUploader(new S3Provider({ ... }));

// R2
const uploader = new MediaUploader(new R2Provider({ ... }));

// Use the same API everywhere
await uploader.upload(file);
```

### TypeScript First

Full type safety and IntelliSense support:

```typescript
const result = await uploader.upload(file);
// result.url - autocomplete knows all properties
// result.width, result.height, result.format, etc.
```

### Lightweight Bundles

Tree-shakeable architecture with lazy loading:

- **Core**: ~13KB (minified, excludes SDK)
- **Provider packages**: ~11-14KB each (excludes SDK)
- **Plugins**: ~20KB (all 5 plugins)

## Examples

- [Basic Node.js](./examples/basic-node) - All providers, plugins, and core features
- [Next.js App](./examples/nextjs-app) - Full Next.js integration with all providers

## React Integration

```bash
pnpm add @fluxmedia/react
```

```typescript
import { useMediaUpload } from '@fluxmedia/react';

function UploadButton() {
  const { upload, uploading, progress, error, result } = useMediaUpload({
    mode: 'signed',
    signUrlEndpoint: '/api/media/sign'
  });

  return (
    <div>
      <input
        type="file"
        onChange={(e) => upload(e.target.files?.[0])}
        disabled={uploading}
      />
      {uploading && <progress value={progress} max={100} />}
      {result && <img src={result.url} alt="Uploaded" />}
      {error && <div>Error: {error.message}</div>}
    </div>
  );
}
```

## Plugins

```bash
pnpm add @fluxmedia/plugins
```

Available plugins:

- **File Validation** - Validate types, sizes, extensions
- **Image Optimization** - Resize, format, quality (requires sharp)
- **Metadata Extraction** - EXIF, dimensions, hashing
- **Analytics** - Logging and tracking with typed events
- **Retry** - Automatic retry with exponential backoff

## Provider Feature Comparison

| Feature               | Cloudinary | S3  | R2  |
| --------------------- | ---------- | --- | --- |
| Image Transformations | Yes        | No  | No  |
| Video Processing      | Yes        | No  | No  |
| AI Tagging            | Yes        | No  | No  |
| Multipart Upload      | Yes        | Yes | Yes |
| Direct Upload         | Yes        | Yes | Yes |

## Development

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test

# Lint
pnpm lint
```

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for details.

## License

MIT © FluxMedia Contributors

---

**Built with TypeScript**

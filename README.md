# FluxMedia

**Switch providers, not code.**

A TypeScript-first media management library that provides a unified API for uploading, managing, and serving media across multiple cloud providers (Cloudinary, AWS S3, Cloudflare R2, etc.).

## Features

- 🔄 **Switch providers with one line of code** - No vendor lock-in
- 🎯 **Type-safe** - Full TypeScript support with intelligent autocomplete
- ⚡ **Tree-shakeable** - Only bundle what you use
- ⚛️ **React integration** - Hooks and components included
- 🔌 **Extensible** - Access native provider APIs when needed
- 📦 **Minimal bundle size** - Lazy loading and dynamic imports

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
    apiSecret: 'your-secret'
  })
);

const result = await uploader.upload(file, {
  folder: 'avatars',
  transformation: {
    width: 400,
    height: 400,
    fit: 'cover',
    format: 'webp'
  }
});

console.log(result.url);
```

## Packages

| Package                                        | Description                 | Version                                                    |
| ---------------------------------------------- | --------------------------- | ---------------------------------------------------------- |
| [@fluxmedia/core](./packages/core)             | Core types and abstractions | ![npm](https://img.shields.io/npm/v/@fluxmedia/core)       |
| [@fluxmedia/cloudinary](./packages/cloudinary) | Cloudinary provider         | ![npm](https://img.shields.io/npm/v/@fluxmedia/cloudinary) |
| [@fluxmedia/s3](./packages/s3)                 | AWS S3 provider             | ![npm](https://img.shields.io/npm/v/@fluxmedia/s3)         |
| [@fluxmedia/r2](./packages/r2)                 | Cloudflare R2 provider      | ![npm](https://img.shields.io/npm/v/@fluxmedia/r2)         |
| [@fluxmedia/react](./packages/react)           | React hooks and components  | ![npm](https://img.shields.io/npm/v/@fluxmedia/react)      |

## Why FluxMedia?

### No Vendor Lock-in

Switch providers by changing **only configuration**, not code:

```typescript
// Before: Cloudinary
const uploader = new MediaUploader(new CloudinaryProvider({ ... }));

// After: S3 (same code works!)
const uploader = new MediaUploader(new S3Provider({ ... }));

// Your upload code stays the same
await uploader.upload(file);
```

### TypeScript First

Full type safety and IntelliSense support:

```typescript
const result = await uploader.upload(file);
// result.url - autocomplete knows all properties
// result.width, result.height, result.format, etc.
```

### Pay Only for What You Use

Tree-shakeable architecture and lazy loading mean you only bundle what you need:

- Core: <5KB gzipped
- Cloudinary provider: <10KB gzipped (excluding SDK)
- S3 provider: <15KB gzipped (excluding SDK)

## Examples

- [Basic Node.js](./examples/basic-node) - Simple upload/delete example
- [Next.js App](./examples/nextjs-app) - Full Next.js integration with all upload modes
- [Provider Switching](./examples/provider-switching) - Same code, different providers

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

## Provider Feature Comparison

| Feature               | Cloudinary | S3  | R2  |
| --------------------- | ---------- | --- | --- |
| Image Transformations | ✅          | ❌   | ❌   |
| Video Processing      | ✅          | ❌   | ❌   |
| AI Tagging            | ✅          | ❌   | ❌   |
| Multipart Upload      | ✅          | ✅   | ✅   |
| Direct Upload         | ✅          | ✅   | ✅   |

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

**Built with ❤️ using TypeScript, pnpm, and tsdown**

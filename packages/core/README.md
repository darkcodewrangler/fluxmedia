# @fluxmedia/core

Core types and abstractions for FluxMedia - a provider-agnostic media upload library.

## Installation

```bash
pnpm add @fluxmedia/core
```

> **Note:** You also need to install a provider package (e.g., `@fluxmedia/cloudinary`, `@fluxmedia/s3`, `@fluxmedia/r2`)

## Usage

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

// Upload a file
const result = await uploader.upload(file, {
  folder: 'avatars',
  transformation: {
    width: 400,
    height: 400,
    fit: 'cover',
    format: 'webp'
  }
});

console.log(result.url); // https://res.cloudinary.com/...
```

## API

### `MediaUploader`

Main class for uploading media.

#### Constructor

```typescript
new MediaUploader(provider: MediaProvider)
```

#### Methods

- `upload(file, options?)` - Upload a file
- `delete(id)` - Delete a file
- `get(id)` - Get file metadata
- `getUrl(id, transform?)` - Generate URL with optional transformations
- `uploadMultiple(files, options?)` - Upload multiple files
- `deleteMultiple(ids)` - Delete multiple files
- `search(query)` - Search files (if provider supports it)
- `supports(feature)` - Check if provider supports a feature

### Types

#### `UploadResult`

```typescript
interface UploadResult {
  id: string;
  url: string;
  publicUrl: string;
  size: number;
  format: string;
  width?: number;
  height?: number;
  provider: string;
  metadata: Record<string,unknown>;
  createdAt: Date;
}
```

#### `UploadOptions`

```typescript
interface UploadOptions {
  filename?: string;
  folder?: string;
  public?: boolean;
  tags?: string[];
  metadata?: Record<string, unknown>;
  onProgress?: (progress: number) => void;
  transformation?: TransformationOptions;
}
```

#### `TransformationOptions`

```typescript
interface TransformationOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'auto' | 'webp' | 'avif' | 'jpg' | 'png';
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
}
```

### Error Handling

All errors are wrapped in `MediaError`:

```typescript
try {
  await uploader.upload(file);
} catch (err) {
  if (err instanceof MediaError) {
    console.log(err.code);         // MediaErrorCode enum
    console.log(err.provider);     // Provider name
    console.log(err.originalError); // Original error
  }
}
```

## License

MIT

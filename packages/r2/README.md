# @fluxmedia/r2

Cloudflare R2 provider for FluxMedia.

## Installation

```bash
pnpm add @fluxmedia/core @fluxmedia/r2 @aws-sdk/client-s3 @aws-sdk/lib-storage
```

## AWS SDK Dependencies

This package requires the following AWS SDK v3 packages as peer dependencies:

- `@aws-sdk/client-s3` - Core S3 client (R2 is S3-compatible)
- `@aws-sdk/lib-storage` - Smart upload manager with automatic multipart handling

## Usage

```typescript
import { MediaUploader } from '@fluxmedia/core';
import { R2Provider } from '@fluxmedia/r2';

const uploader = new MediaUploader(
  new R2Provider({
    accountId: 'your-account-id',// optional if endpoint is provided
    endpoint: 'https://your-account-id.r2.cloudflarestorage.com',// optional if accountId is provided
    bucket: 'my-bucket',
    accessKeyId: 'your-access-key',
    secretAccessKey: 'your-secret-key',
    publicUrl: 'https://cdn.example.com' // optional, but required if you want the objects to be publicly accessible
  })
);

const result = await uploader.upload(file, {
  folder: 'uploads'
});
```

## Features

R2 is a storage-only provider (S3-compatible):

- File upload/download
- Multipart upload for large files
- Zero egress fees
- No image transformations (use Cloudflare Images)
- No video processing

## Configuration

```typescript
interface R2Config {
  endpoint?: string;      // R2 endpoint (optional, will be auto-generated if not provided)
  accountId: string;      // Cloudflare account ID (optional if endpoint is provided)
  bucket: string;         // R2 bucket name
  accessKeyId: string;    // R2 Access Key
  secretAccessKey: string; // R2 Secret Key
  publicUrl?: string;     // Custom public URL
}
```

## License

MIT

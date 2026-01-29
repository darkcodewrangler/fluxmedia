# @fluxmedia/r2

Cloudflare R2 provider for FluxMedia.

## Installation

```bash
pnpm add @fluxmedia/core @fluxmedia/r2 @aws-sdk/client-s3
```

## Usage

```typescript
import { MediaUploader } from '@fluxmedia/core';
import { R2Provider } from '@fluxmedia/r2';

const uploader = new MediaUploader(
  new R2Provider({
    accountId: 'your-account-id',
    bucket: 'my-bucket',
    accessKeyId: 'your-access-key',
    secretAccessKey: 'your-secret-key',
    publicUrl: 'https://cdn.example.com' // optional
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
  accountId: string;      // Cloudflare account ID
  bucket: string;         // R2 bucket name
  accessKeyId: string;    // R2 Access Key
  secretAccessKey: string; // R2 Secret Key
  publicUrl?: string;     // Custom public URL
}
```

## License

MIT

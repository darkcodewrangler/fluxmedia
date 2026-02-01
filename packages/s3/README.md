# @fluxmedia/s3

AWS S3 provider for FluxMedia.

## Installation

```bash
pnpm add @fluxmedia/core @fluxmedia/s3 @aws-sdk/client-s3 @aws-sdk/lib-storage
```

## AWS SDK Dependencies

This package requires the following AWS SDK v3 packages as peer dependencies:

- `@aws-sdk/client-s3` - Core S3 client and commands
- `@aws-sdk/lib-storage` - Smart upload manager with automatic multipart handling

### Why @aws-sdk/lib-storage?

This package uses the `Upload` class from `@aws-sdk/lib-storage` which:

- Automatically handles multipart uploads for files >5MB
- Uploads parts in parallel for better performance
- Provides built-in progress tracking
- Handles retries and error recovery
- Cleans up failed uploads automatically

This means you get enterprise-grade upload reliability without writing complex multipart upload logic.

## Usage

```typescript
import { MediaUploader } from '@fluxmedia/core';
import { S3Provider } from '@fluxmedia/s3';

const uploader = new MediaUploader(
  new S3Provider({
    region: 'us-east-1',
    bucket: 'my-bucket',
    accessKeyId: 'your-access-key',
    secretAccessKey: 'your-secret-key'
  }),
);

const result = await uploader.upload(file, {
  folder: 'uploads',
  filename: 'my-file.jpg'
});

console.log(result.url);
```

## Features

S3 is a storage-only provider:

- File upload/download
- Multipart upload for large files
- Signed upload URLs
- No image transformations (use CloudFront + Lambda@Edge)
- No video processing

## Configuration

```typescript
interface S3Config {
  region: string;        // AWS region
  bucket: string;        // S3 bucket name
  accessKeyId: string;   // AWS Access Key
  secretAccessKey: string; // AWS Secret Key
  endpoint?: string;     // Custom endpoint (for S3-compatible)
  forcePathStyle?: boolean; // Force path style URLs
}
```

## S3-Compatible Services

Works with S3-compatible services like MinIO, DigitalOcean Spaces:

```typescript
const uploader = new MediaUploader(
  new S3Provider({
    region: 'nyc3',
    bucket: 'my-space',
    accessKeyId: 'your-key',
    secretAccessKey: 'your-secret',
    endpoint: 'https://nyc3.digitaloceanspaces.com',
    forcePathStyle: false
  })
);
```

## License

MIT

# @fluxmedia/s3

AWS S3 provider for FluxMedia - simple, reliable file storage with the AWS ecosystem.

## Installation

```bash
pnpm add @fluxmedia/core @fluxmedia/s3 @aws-sdk/client-s3 @aws-sdk/lib-storage
```

## Quick Start

```typescript
import { MediaUploader } from '@fluxmedia/core';
import { S3Provider } from '@fluxmedia/s3';

const uploader = new MediaUploader(
  new S3Provider({
    region: 'us-east-1',
    bucket: 'my-bucket',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  })
);

// Upload a file
const result = await uploader.upload(file, {
  folder: 'uploads',
  filename: 'my-file.jpg'
});

console.log(result.url);
// https://my-bucket.s3.us-east-1.amazonaws.com/uploads/my-file.jpg
```

## Features

- **Automatic multipart uploads** for files >5MB
- **Progress tracking** for individual and batch uploads
- **Batch operations** with concurrency control
- **S3-compatible** - works with MinIO, DigitalOcean Spaces, etc.

## Configuration

```typescript
interface S3Config {
  region: string;           // AWS region (e.g., 'us-east-1')
  bucket: string;           // S3 bucket name
  accessKeyId: string;      // AWS Access Key
  secretAccessKey: string;  // AWS Secret Key
  endpoint?: string;        // Custom endpoint for S3-compatible services
  forcePathStyle?: boolean; // Use path-style URLs
}
```

## Upload with Progress

```typescript
const result = await uploader.upload(file, {
  folder: 'uploads',
  onProgress: (percent) => {
    console.log(`Upload progress: ${percent}%`);
  }
});
```

## Batch Uploads

Upload multiple files with concurrency control:

```typescript
const results = await uploader.uploadMultiple(files, {
  folder: 'batch-uploads',
  concurrency: 5,
  onBatchProgress: (completed, total) => {
    console.log(`Uploaded ${completed}/${total} files`);
  }
});
```

## Delete Files

```typescript
// Delete single file
await uploader.delete(result.id);

// Delete multiple files
await uploader.deleteMultiple(['file1', 'file2', 'file3']);
```

## Native SDK Access

Access the underlying AWS S3 client for advanced operations:

```typescript
const s3Client = uploader.provider.native;

// Use native AWS SDK methods
const { ListBucketsCommand } = await import('@aws-sdk/client-s3');
const buckets = await s3Client.send(new ListBucketsCommand({}));
```

## S3-Compatible Services

Works with DigitalOcean Spaces, MinIO, and other S3-compatible services:

```typescript
// DigitalOcean Spaces
const uploader = new MediaUploader(
  new S3Provider({
    region: 'nyc3',
    bucket: 'my-space',
    accessKeyId: 'your-key',
    secretAccessKey: 'your-secret',
    endpoint: 'https://nyc3.digitaloceanspaces.com'
  })
);

// MinIO (self-hosted)
const uploader = new MediaUploader(
  new S3Provider({
    region: 'us-east-1',
    bucket: 'my-bucket',
    accessKeyId: 'minio-key',
    secretAccessKey: 'minio-secret',
    endpoint: 'http://localhost:9000',
    forcePathStyle: true
  })
);
```

## Environment Variables

```bash
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
S3_BUCKET=my-bucket
```

## License

MIT

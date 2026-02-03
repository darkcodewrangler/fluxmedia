# @fluxmedia/core

Core library for FluxMedia - a provider-agnostic media upload library for JavaScript and TypeScript.

## Installation

```bash
pnpm add @fluxmedia/core
```

> **Note:** You also need a provider package (e.g., `@fluxmedia/cloudinary`, `@fluxmedia/s3`, `@fluxmedia/r2`)

## Quick Start

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
  },
  metadata: {
    userId: '12345',
    uploadedAt: new Date().toISOString()
  }
});

console.log(result.url);
```

## MediaUploader API

### Constructor

```typescript
new MediaUploader(provider: MediaProvider)
```

### Methods

| Method                            | Description                                |
| --------------------------------- | ------------------------------------------ |
| `upload(file, options?)`          | Upload a single file                       |
| `uploadMultiple(files, options?)` | Upload multiple files with concurrency     |
| `delete(id)`                      | Delete a file by ID                        |
| `deleteMultiple(ids)`             | Delete multiple files                      |
| `get(id)`                         | Get file metadata                          |
| `getUrl(id, transform?)`          | Generate URL with optional transformations |
| `supports(feature)`               | Check if provider supports a feature       |

## Upload Options

```typescript
interface UploadOptions {
  filename?: string;           // Custom filename
  folder?: string;             // Destination folder
  tags?: string[];             // Tags for organizing
  metadata?: Record<string, unknown>;
  onProgress?: (percent: number) => void;
  transformation?: TransformationOptions;
  uniqueFilename?: boolean;    // Generate unique name (default: true)
}
```

## Transformations

```typescript
interface TransformationOptions {
  width?: number;
  height?: number;
  quality?: number;            // 0-100
  format?: 'auto' | 'webp' | 'avif' | 'jpg' | 'png';
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
}
```

## Upload Result

```typescript
interface UploadResult {
  id: string;          // Unique file identifier
  url: string;         // Direct URL
  publicUrl: string;   // Public access URL
  size: number;        // Size in bytes
  format: string;      // File format
  width?: number;      // Image/video width
  height?: number;     // Image/video height
  provider: string;    // Provider name
  metadata: Record<string, unknown>;
  createdAt: Date;
}
```

## Using Plugins

Extend functionality with plugins:

```typescript
import { createFileValidationPlugin } from '@fluxmedia/plugins';

const uploader = new MediaUploader(provider);

// Add validation
await uploader.use(createFileValidationPlugin({
  maxSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: ['image/*', 'video/mp4']
}));

// Now uploads are validated
await uploader.upload(file);
```

## File Type Detection

Detect file types using magic bytes (more reliable than extensions):

```typescript
import { getFileType, isImage, isVideo } from '@fluxmedia/core';

const type = await getFileType(buffer);
console.log(type); // { mime: 'image/jpeg', ext: 'jpg' }

if (await isImage(buffer)) {
  // Handle image
}

if (await isVideo(buffer)) {
  // Handle video
}
```

## Error Handling

All errors use standardized `MediaErrorCode`:

```typescript
import { MediaError, MediaErrorCode } from '@fluxmedia/core';

try {
  await uploader.upload(file);
} catch (err) {
  if (err instanceof MediaError) {
    console.log(err.code);      // e.g., 'FILE_TOO_LARGE'
    console.log(err.provider);  // e.g., 'cloudinary'
    console.log(err.message);   // Human-readable message
  }
}
```

### Error Codes

| Code                  | Description              |
| --------------------- | ------------------------ |
| `UPLOAD_FAILED`       | General upload failure   |
| `FILE_TOO_LARGE`      | File exceeds size limit  |
| `INVALID_FILE_TYPE`   | Unsupported file type    |
| `NETWORK_ERROR`       | Network or timeout issue |
| `INVALID_CREDENTIALS` | Bad credentials          |
| `UNAUTHORIZED`        | Access denied            |
| `FILE_NOT_FOUND`      | File doesn't exist       |
| `QUOTA_EXCEEDED`      | Storage quota reached    |

## Feature Detection

Check what your provider supports:

```typescript
// Transformation features
uploader.supports('transformations.resize');
uploader.supports('transformations.blur');

// Capabilities
uploader.supports('capabilities.aiTagging');
uploader.supports('capabilities.videoProcessing');
```

## License

MIT

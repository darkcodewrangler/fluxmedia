# @fluxmedia/plugins

Official plugins for FluxMedia - validation, optimization, analytics, and retry functionality.

## Installation

```bash
pnpm add @fluxmedia/plugins

# For image optimization:
pnpm add sharp
```

## Using Plugins

```typescript
import { MediaUploader } from '@fluxmedia/core';
import { 
  createFileValidationPlugin,
  createAnalyticsPlugin 
} from '@fluxmedia/plugins';

const uploader = new MediaUploader(provider);

// Add validation plugin
await uploader.use(createFileValidationPlugin({
  maxSize: 10 * 1024 * 1024,
  allowedTypes: ['image/*']
}));

// Add analytics plugin
await uploader.use(createAnalyticsPlugin({
  logLevel: 'info'
}));

// Uploads are now validated and logged
await uploader.upload(file);
```

## Available Plugins

### File Validation

Validates files before upload based on type, size, and extension.

```typescript
import { createFileValidationPlugin } from '@fluxmedia/plugins';

const plugin = createFileValidationPlugin({
  allowedTypes: ['image/*', 'video/mp4'],
  maxSize: 10 * 1024 * 1024, // 10MB
  minSize: 1024,             // 1KB minimum
  blockedExtensions: ['.exe', '.bat'],
  allowedExtensions: ['.jpg', '.png', '.webp'],
  useMagicBytes: true,       // Use magic byte detection
  customValidator: async (file, filename) => {
    // Custom validation logic
    return true;
  },
  onValidationFailed: (error) => {
    console.log(`Validation failed: ${error.message}`);
  }
});
```

**Options:**
| Option               | Type       | Description                                            |
| -------------------- | ---------- | ------------------------------------------------------ |
| `allowedTypes`       | `string[]` | Allowed MIME types (supports wildcards like `image/*`) |
| `maxSize`            | `number`   | Maximum file size in bytes                             |
| `minSize`            | `number`   | Minimum file size in bytes                             |
| `allowedExtensions`  | `string[]` | Allowed file extensions                                |
| `blockedExtensions`  | `string[]` | Blocked file extensions                                |
| `useMagicBytes`      | `boolean`  | Use magic byte detection for MIME type                 |
| `customValidator`    | `function` | Custom validation function                             |
| `onValidationFailed` | `function` | Callback when validation fails                         |

### Image Optimization (Server-side)

Optimizes images using sharp before upload. Requires `sharp` as a peer dependency.

```typescript
import { createImageOptimizationPlugin } from '@fluxmedia/plugins';

const plugin = createImageOptimizationPlugin({
  maxWidth: 2000,
  maxHeight: 2000,
  quality: 0.85,
  format: 'webp',
  stripMetadata: true,
  autoOrient: true,
  preserveAspectRatio: true,
});
```

**Options:**
| Option                | Type      | Description                                          |
| --------------------- | --------- | ---------------------------------------------------- |
| `maxWidth`            | `number`  | Maximum width in pixels (default: 2000)              |
| `maxHeight`           | `number`  | Maximum height in pixels (default: 2000)             |
| `quality`             | `number`  | Quality 0-1 for lossy formats (default: 0.85)        |
| `format`              | `string`  | Output format: 'auto', 'webp', 'avif', 'jpeg', 'png' |
| `stripMetadata`       | `boolean` | Strip EXIF and other metadata (default: true)        |
| `autoOrient`          | `boolean` | Auto-orient based on EXIF (default: true)            |
| `preserveAspectRatio` | `boolean` | Preserve aspect ratio (default: true)                |

### Metadata Extraction

Extracts EXIF data, dimensions, and file hashes. Requires `sharp` for image metadata.

```typescript
import { createMetadataExtractionPlugin } from '@fluxmedia/plugins';

const plugin = createMetadataExtractionPlugin({
  extractExif: true,
  extractDimensions: true,
  hashFile: true,
  hashAlgorithm: 'sha256',
});

// Metadata is added to upload result
const result = await uploader.upload(file);
console.log(result.metadata.extracted);
// { dimensions: { width, height }, hash: '...', hashAlgorithm: 'sha256' }
```

**Options:**
| Option              | Type      | Description                                        |
| ------------------- | --------- | -------------------------------------------------- |
| `extractExif`       | `boolean` | Extract EXIF metadata (default: true)              |
| `extractDimensions` | `boolean` | Extract width/height (default: true)               |
| `hashFile`          | `boolean` | Generate file hash (default: false)                |
| `hashAlgorithm`     | `string`  | Hash algorithm: 'md5' or 'sha256' (default: 'md5') |

### Analytics/Logging

Logs and tracks upload operations with environment-aware behavior and **strongly-typed events**.

```typescript
import { 
  createAnalyticsPlugin,
  type TrackFunction,
  type AnalyticsEventType 
} from '@fluxmedia/plugins';

const plugin = createAnalyticsPlugin({
  environment: 'production',
  logLevel: 'info',
  console: true,
  trackPerformance: true,
  // Typed track function - TypeScript verifies event/data match
  track: (event, data) => {
    // event: 'media.upload.started' | 'media.upload.completed' | 'media.delete.completed' | 'media.error'
    // data: typed based on event type
    myAnalytics.track(event, data);
  },
  onUploadStart: (file, options) => {
    console.log('Upload starting...');
  },
  onUploadComplete: (result, durationMs) => {
    console.log(`Completed in ${durationMs}ms`);
  },
  onUploadError: (error, file) => {
    console.error('Upload failed:', error);
  },
  onDelete: (id) => {
    console.log(`Deleted: ${id}`);
  }
});
```

**Event Types:**
| Event                    | Data Type                  | Description                                            |
| ------------------------ | -------------------------- | ------------------------------------------------------ |
| `media.upload.started`   | `UploadStartedEventData`   | fileName, fileSize, folder, uploadId                   |
| `media.upload.completed` | `UploadCompletedEventData` | fileId, fileName, fileSize, format, provider, duration |
| `media.delete.completed` | `DeleteCompletedEventData` | fileId                                                 |
| `media.error`            | `ErrorEventData`           | operation, error, totalErrors                          |

**Options:**
| Option             | Type            | Description                                   |
| ------------------ | --------------- | --------------------------------------------- |
| `environment`      | `string`        | 'development', 'production', 'test', or 'all' |
| `logLevel`         | `string`        | 'none', 'error', 'warn', 'info', or 'debug'   |
| `console`          | `boolean`       | Enable console logging (default: true)        |
| `trackPerformance` | `boolean`       | Track upload duration (default: true)         |
| `track`            | `TrackFunction` | Typed tracking callback                       |
| `onUploadStart`    | `function`      | Called when upload starts                     |
| `onUploadComplete` | `function`      | Called when upload completes                  |
| `onUploadError`    | `function`      | Called on upload error                        |
| `onDelete`         | `function`      | Called when file is deleted                   |

### Retry

Provides automatic retry with exponential backoff. The plugin stores configuration and `withRetry` implements the retry logic.

```typescript
import { createRetryPlugin, withRetry, getRetryConfig } from '@fluxmedia/plugins';

// 1. Add retry plugin to configure retry behavior
await uploader.use(createRetryPlugin({
  maxRetries: 3,
  retryDelay: 1000,
  exponentialBackoff: true,
  onRetry: (attempt, error, delay) => {
    console.log(`Retry ${attempt} after ${delay}ms: ${error.message}`);
  }
}));

// 2. Use withRetry to wrap upload with retry logic
const result = await withRetry(
  () => uploader.upload(file),
  { maxRetries: 3, exponentialBackoff: true }
);

// Or retrieve stored config using getRetryConfig
const options = { folder: 'uploads' };
const retryConfig = getRetryConfig(options);
```

**Options:**
| Option               | Type               | Description                                        |
| -------------------- | ------------------ | -------------------------------------------------- |
| `maxRetries`         | `number`           | Maximum retry attempts (default: 3)                |
| `retryDelay`         | `number`           | Base delay in milliseconds (default: 1000)         |
| `exponentialBackoff` | `boolean`          | Use exponential backoff (default: true)            |
| `retryableErrors`    | `MediaErrorCode[]` | Error codes to retry on                            |
| `onRetry`            | `function`         | Callback when retry is attempted                   |
| `shouldRetry`        | `function`         | Custom function to determine if error should retry |

## Creating Custom Plugins

```typescript
import { createPlugin } from '@fluxmedia/core';

const myPlugin = createPlugin('my-plugin', {
  beforeUpload: async (file, options) => {
    console.log('Uploading:', file);
    return { file, options };
  },
  afterUpload: async (result) => {
    console.log('Uploaded:', result.url);
    return result;
  },
  onError: async (error, context) => {
    console.error('Failed:', error.message);
  }
});

await uploader.use(myPlugin);
```

## License

MIT

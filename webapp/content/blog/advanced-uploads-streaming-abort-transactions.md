---
title: 'Advanced Uploads: Streaming, Abort & Transactions'
date: '2026-03-04'
excerpt: Explore FluxMedia's advanced upload capabilities — streaming from any source, cancellation with AbortController, transactional uploads with rollback, and automatic fallback providers.
author: Victory Lucky
tags: ['advanced', 'streaming', 'transactions', 'tutorial']
---

# Advanced Uploads: Streaming, Abort & Transactions

FluxMedia goes well beyond simple file uploads. This post covers the advanced capabilities that make it production-ready: streaming inputs, upload cancellation, transactional uploads, automatic fallback, structured errors, and progress tracking.

## Streaming Uploads

Most upload libraries expect a `File` or `Buffer`. FluxMedia accepts **four input types** through its `UploadInput` union:

- `File` (browser)
- `Buffer` (Node.js)
- `Readable` (Node.js streams)
- `ReadableStream` (web standard)

This means you can pipe data directly from a file system, an HTTP response, or any other stream source — without buffering the entire file in memory:

```typescript
import { createReadStream } from 'fs';

// Stream a large video from disk
const stream = createReadStream('/path/to/video.mp4');
const result = await uploader.upload(stream, {
  folder: 'videos',
  contentType: 'video/mp4',
});

// Stream from a fetch response
const response = await fetch('https://example.com/photo.jpg');
const result = await uploader.upload(response.body!, {
  folder: 'imports',
});
```

This is particularly useful for server-side processing pipelines where you're moving files between services without wanting to hold everything in memory.

## Cancelling Uploads with AbortController

Long-running uploads can be cancelled using the standard `AbortController` — the same API you use with `fetch`:

```typescript
const controller = new AbortController();

// UI: user clicks "Cancel"
cancelButton.addEventListener('click', () => controller.abort());

try {
  const result = await uploader.upload(file, {
    folder: 'uploads',
    signal: controller.signal,
  });
} catch (error) {
  if (controller.signal.aborted) {
    console.log('Upload was cancelled by user');
  }
}
```

You can also set automatic timeouts:

```typescript
const controller = new AbortController();
setTimeout(() => controller.abort(), 60_000); // 60s timeout

const result = await uploader.upload(largeFile, {
  folder: 'uploads',
  signal: controller.signal,
});
```

## Progress Tracking

FluxMedia provides two levels of progress reporting:

```typescript
const result = await uploader.upload(file, {
  folder: 'uploads',

  // Normalized percentage (0-100)
  onProgress: (percent) => {
    progressBar.style.width = `${percent}%`;
    statusText.textContent = `${Math.round(percent)}%`;
  },

  // Raw byte counts for precise tracking
  onByteProgress: (loaded, total) => {
    const mb = (loaded / 1024 / 1024).toFixed(1);
    const totalMb = (total / 1024 / 1024).toFixed(1);
    console.log(`${mb}MB / ${totalMb}MB`);
  },
});
```

The `onProgress` callback gives you a clean 0–100 value that's ideal for progress bars. The `onByteProgress` callback gives you exact byte counts when you need more precision.

## Transactional Uploads

For workflows where an upload must be atomic — succeed completely or not at all — FluxMedia supports transactional uploads with a callback-based commit/rollback pattern:

```typescript
const { uploadResult, commitResult } = await uploader.uploadWithTransaction(
  file,
  { folder: 'documents', filename: 'contract-v2' },
  {
    onCommit: async (result) => {
      // Perform additional business logic
      await database.updateRecord(result.storageKey);
      await notifyTeam(result.url);
      return { recordId: result.storageKey };
    },
    onRollback: async (result, error) => {
      console.error('Commit failed, rolled back:', error.message);
    },
  }
);

console.log(uploadResult.url);       // The uploaded file URL
console.log(commitResult.recordId);   // Value returned from onCommit
```

If `onCommit` throws, FluxMedia automatically calls your `onRollback` callback. If you don't provide `onRollback`, it defaults to deleting the uploaded file — so orphaned files are cleaned up automatically.

This is invaluable for scenarios like:

- Uploading a file and then saving a database reference — if the DB write fails, the orphan file is cleaned up automatically.
- Multi-step workflows where the upload is only one part of a larger operation.

## Fallback Providers

Configure a secondary provider that kicks in automatically when the primary provider encounters specific errors:

```typescript
import { MediaUploader, MediaErrorCode } from '@fluxmedia/core';

const uploader = new MediaUploader(
  new CloudinaryProvider({ ... }),  // Primary
  [],                                // Plugins
  {
    fallbackProvider: new S3Provider({ ... }),
    fallbackOnErrors: [
      MediaErrorCode.NETWORK_ERROR,
      MediaErrorCode.RATE_LIMITED,
      MediaErrorCode.PROVIDER_ERROR,
    ],
    onFallback: (error, fallbackProvider) => {
      console.warn(
        `Primary failed (${error.code}), using ${fallbackProvider.name}`
      );
    },
  }
);

// If Cloudinary is temporarily down, S3 handles the upload seamlessly
const result = await uploader.upload(file, { folder: 'uploads' });
```

The fallback is transparent to calling code — `result` has the same shape regardless of which provider handled the upload.

## Structured Errors

FluxMedia replaces opaque provider exceptions with typed error codes you can handle programmatically:

```typescript
import { MediaErrorCode } from '@fluxmedia/core';

try {
  await uploader.upload(file, { folder: 'uploads' });
} catch (error) {
  switch (error.code) {
    case MediaErrorCode.INVALID_FILE_TYPE:
      console.error('Invalid file type:', error.message);
      break;
    case MediaErrorCode.FILE_TOO_LARGE:
      console.error('File too large:', error.message);
      break;
    case MediaErrorCode.NETWORK_ERROR:
      console.error('Network issue — try again later');
      break;
    case MediaErrorCode.RATE_LIMITED:
      console.error('Rate limited — backing off');
      break;
    case MediaErrorCode.PROVIDER_ERROR:
      console.error('Provider error:', error.message);
      break;
    default:
      console.error('Unexpected error:', error);
  }
}
```

Every error includes a `code`, `message`, and the original provider error for debugging. This makes error handling consistent across all providers.

## Batch Operations

Upload or delete multiple files in a single call:

```typescript
// Upload multiple files
const results = await uploader.uploadMultiple([file1, file2, file3], { folder: 'batch-uploads' });

// Delete multiple files
await uploader.deleteMultiple(['uploads/file1', 'uploads/file2']);
```

## Feature Detection

Not every provider supports every feature. Use `supports()` to check at runtime:

```typescript
if (uploader.supports('transformations.resize')) {
  const url = uploader.getUrl(id, { width: 400, height: 400, format: 'webp' });
}

if (uploader.supports('capabilities.videoProcessing')) {
  // Provider can handle video transcoding
}
```

## Putting It All Together

Here's a production-ready upload function that combines several of these features:

```typescript
import { MediaUploader, MediaErrorCode } from '@fluxmedia/core';
import { createRetryPlugin, createFileValidationPlugin } from '@fluxmedia/plugins';

// Configure uploader with plugins and fallback
const uploader = new MediaUploader(
  new CloudinaryProvider({ ... }),
  [
    createFileValidationPlugin({ maxSize: 50 * 1024 * 1024 }),
    createRetryPlugin({ maxRetries: 2 }),
  ],
  { fallbackProvider: new S3Provider({ ... }) }
);

async function uploadWithFeedback(
  file: File,
  onProgress: (percent: number) => void,
  signal?: AbortSignal
) {
  const { uploadResult } = await uploader.uploadWithTransaction(
    file,
    { folder: 'user-uploads', onProgress, signal },
    {
      onCommit: async (result) => {
        await saveToDatabase(result);
      },
    }
  );

  // If onCommit throws, FluxMedia auto-deletes the uploaded file
  return uploadResult;
}
```

## Next Steps

- [Getting Started Guide](/blog/getting-started-with-fluxmedia)
- [Plugin System Deep Dive](/blog/understanding-the-plugin-system)
- [Using Multiple Providers Together](/blog/using-multiple-providers-zero-effort)
- [Full Documentation](/docs)

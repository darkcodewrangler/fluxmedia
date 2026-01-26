# Basic Node.js Example

This example demonstrates how to use FluxMedia with Cloudinary in a Node.js application.

## Setup

1. Install dependencies (from the repository root):
```bash
pnpm install
```

2. Build the packages:
```bash
pnpm build
```

3. Create a `.env` file with your Cloudinary credentials:
```bash
cp .env.example .env
# Edit .env and add your credentials
```

4. Run the example:
```bash
cd examples/basic-node
pnpm start
```

## What This Example Shows

- ✅ Creating a MediaUploader with CloudinaryProvider
- ✅ Uploading files with options
- ✅ Uploading with transformations
- ✅ Generating transformed URLs
- ✅ Deleting files
- ✅ Batch operations
- ✅ Feature detection with `supports()`

## Code Structure

```javascript
import { MediaUploader } from '@fluxmedia/core';
import { CloudinaryProvider } from '@fluxmedia/cloudinary';

const uploader = new MediaUploader(
  new CloudinaryProvider({
    cloudName: 'your-cloud',
    apiKey: 'your-key',
    apiSecret: 'your-secret'
  })
);

// Upload
const result = await uploader.upload(file, {
  folder: 'uploads',
  transformation: {
    width: 800,
    format: 'webp'
  }
});

// Delete
await uploader.delete(result.id);
```

## Next Steps

- Check out the [Next.js example](../nextjs-app) for React integration
- See [Provider Switching](../provider-switching) to switch from Cloudinary to S3
- Read the [documentation](../../packages/core/README.md) for full API reference

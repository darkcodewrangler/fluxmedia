# FluxMedia Next.js Example

Demonstrates using FluxMedia with React hooks, multiple providers, and the plugin system.

## Features

- **Multiple Providers**: Cloudinary, AWS S3, Cloudflare R2
- **React Hooks**: `useMediaUpload` for easy client-side uploads
- **Upload Modes**: Signed URL (direct to provider) or Proxy (through server)
- **Plugin System**: Logger, Metadata enrichment, Validation plugins

## Setup

```bash
# Install dependencies
pnpm install

# Copy environment template
cp .env.example .env

# Add your credentials to .env
```

## Run

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

## Architecture

### Client-Side (React Hooks)

```tsx
import { useMediaUpload } from '@fluxmedia/react';

export default function UploadComponent() {
    const { upload, uploading, progress, result } = useMediaUpload({
        mode: 'proxy',
        proxyEndpoint: '/api/upload',
    });

    return (
        <input 
            type="file" 
            onChange={(e) => upload(e.target.files[0])} 
        />
    );
}
```

### Server-Side (with Plugins)

```typescript
// lib/uploaders.ts
import { MediaUploader, createPlugin } from '@fluxmedia/core';
import { CloudinaryProvider } from '@fluxmedia/cloudinary';

const loggerPlugin = createPlugin('logger', {
    beforeUpload: async (file, options) => {
        console.log('Starting upload...');
        return { file, options };
    },
    afterUpload: async (result) => {
        console.log('Upload complete:', result.url);
        return result;
    },
});

export async function createUploader() {
    const uploader = new MediaUploader(
        new CloudinaryProvider({ ... })
    );
    await uploader.use(loggerPlugin);
    return uploader;
}
```

### API Routes

- `POST /api/upload` - Proxy upload (file goes through server)
- `POST /api/upload/sign` - Get signed Cloudinary URL
- `POST /api/media/sign` - Get signed S3/R2 URL

## Plugins Included

| Plugin     | Description                            |
| ---------- | -------------------------------------- |
| Logger     | Logs all upload/delete operations      |
| Metadata   | Adds uploadedAt timestamp to all files |
| Validation | Validates file size (max 50MB)         |

## Environment Variables

See `.env.example` for all required credentials.

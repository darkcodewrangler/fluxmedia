# FluxMedia - Complete Technical Specification & Implementation Guide

**Tagline:** Switch providers, not code.

A TypeScript-first media management library that provides a unified API for uploading, managing, and serving media across multiple cloud providers (Cloudinary, AWS S3, Cloudflare R2, etc.). The library prioritizes developer experience, type safety, and minimal bundle size while avoiding vendor lock-in.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Core API Design](#2-core-api-design)
3. [Provider Implementation](#3-provider-implementation)
4. [React Integration](#4-react-integration)
5. [Advanced Features](#5-advanced-features)
6. [Project Structure](#6-project-structure)
7. [Testing Strategy](#7-testing-strategy)
8. [CI/CD Pipeline](#8-cicd-pipeline)
9. [Documentation](#9-documentation)
10. [Implementation Roadmap](#10-implementation-roadmap)
11. [Success Metrics](#11-success-metrics)
12. [Community & Open Source](#12-community--open-source)

---

## 1. Architecture Overview

### 1.1 Design Principles

1. **Provider Agnostic Interface** - Single API regardless of backend
2. **Zero Lock-in** - Switch providers with configuration only
3. **Type Safety First** - Full TypeScript support with intelligent autocomplete
4. **Minimal Bundle Size** - Pay only for what you use via dynamic imports
5. **Extensibility** - Access native provider APIs when needed
6. **Framework Agnostic Core** - Works anywhere, with React utilities as separate package

### 1.2 Package Structure

```
@fluxmedia/
├── core/                 # Core abstractions and types
├── cloudinary/           # Cloudinary adapter (peer deps)
├── s3/                   # AWS S3 adapter (peer deps)
├── r2/                   # Cloudflare R2 adapter (peer deps)
├── react/                # React hooks and components
└── next/                 # Next.js specific utilities
```

**Why this structure?**
- Tree-shakeable: users install only needed providers
- Clear dependency boundaries
- Easy to add new providers
- Follows established patterns (like `@tanstack/query`)

### 1.3 Technology Stack

**Monorepo Management:**
- **pnpm** - Fast, strict dependency management
- **Turborepo** - Build caching and orchestration
- **Changesets** - Version management and publishing

**Build & Testing:**
- **tsup** - Zero-config TypeScript bundler
- **Vitest** - Fast, modern test runner
- **Testing Library** - React component testing

**Documentation:**
- **VitePress** - Fast, modern documentation site

---

## 2. Core API Design

### 2.1 Base Types

```typescript
// Core upload result - common across all providers
interface UploadResult {
  id: string;
  url: string;
  publicUrl: string;
  size: number;
  format: string;
  width?: number;
  height?: number;
  provider: string;
  metadata: Record<string, any>;
  createdAt: Date;
}

// Upload options
interface UploadOptions {
  filename?: string;
  folder?: string;
  public?: boolean;
  tags?: string[];
  metadata?: Record<string, any>;
  onProgress?: (progress: number) => void;
  transformation?: TransformationOptions;
}

// Transformation options (provider-agnostic subset)
interface TransformationOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'auto' | 'webp' | 'avif' | 'jpg' | 'png';
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
}
```

### 2.2 Provider Interface

```typescript
interface MediaProvider {
  // Core operations
  upload(file: File | Buffer, options?: UploadOptions): Promise<UploadResult>;
  delete(id: string): Promise<void>;
  get(id: string): Promise<UploadResult>;
  getUrl(id: string, transform?: TransformationOptions): string;
  
  // Batch operations
  uploadMultiple(files: File[], options?: UploadOptions): Promise<UploadResult[]>;
  deleteMultiple(ids: string[]): Promise<void>;
  
  // Optional: Advanced features
  search?(query: SearchOptions): Promise<UploadResult[]>;
  
  // Access to native client for advanced usage
  native: any;
  
  // Provider metadata
  readonly features: ProviderFeatures;
  readonly name: string;
}
```

### 2.3 Main Entry Point

```typescript
import { MediaUploader } from '@fluxmedia/core';
import { CloudinaryProvider } from '@fluxmedia/cloudinary';

// Direct instantiation (recommended)
const uploader = new MediaUploader(
  new CloudinaryProvider({
    cloudName: 'xxx',
    apiKey: 'xxx',
    apiSecret: 'xxx'
  })
);

// Usage
const result = await uploader.upload(file, {
  folder: 'avatars',
  transformation: {
    width: 400,
    height: 400,
    fit: 'cover',
    format: 'webp'
  }
});

console.log(result.url); // Ready-to-use URL
```

### 2.4 Error Handling

```typescript
export class MediaError extends Error {
  constructor(
    message: string,
    public code: MediaErrorCode,
    public provider: string,
    public originalError?: any,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'MediaError';
  }
}

export enum MediaErrorCode {
  // Upload errors
  UPLOAD_FAILED = 'UPLOAD_FAILED',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',
  NETWORK_ERROR = 'NETWORK_ERROR',
  
  // Authentication errors
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  UNAUTHORIZED = 'UNAUTHORIZED',
  
  // Provider errors
  PROVIDER_ERROR = 'PROVIDER_ERROR',
  RATE_LIMITED = 'RATE_LIMITED',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  
  // Configuration errors
  INVALID_CONFIG = 'INVALID_CONFIG',
  MISSING_CREDENTIALS = 'MISSING_CREDENTIALS',
  
  // File errors
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  DELETE_FAILED = 'DELETE_FAILED',
}

// Usage
try {
  await uploader.upload(file);
} catch (err) {
  if (err instanceof MediaError) {
    console.log(err.code);         // 'FILE_TOO_LARGE'
    console.log(err.provider);     // 'cloudinary'
    console.log(err.originalError); // Original provider error
  }
}
```

### 2.5 Provider Features

```typescript
interface ProviderFeatures {
  transformations: {
    resize: boolean;
    crop: boolean;
    format: boolean;
    quality: boolean;
    blur: boolean;
    rotate: boolean;
    effects: boolean;
  };
  capabilities: {
    signedUploads: boolean;
    directUpload: boolean;
    multipartUpload: boolean;
    videoProcessing: boolean;
    aiTagging: boolean;
    facialDetection: boolean;
  };
  storage: {
    maxFileSize: number;
    supportedFormats: string[];
  };
}

// Usage
if (uploader.provider.features.transformations.resize) {
  // Provider supports image resizing
}
```

---

## 3. Provider Implementation

### 3.1 Adapter Pattern

```typescript
// @fluxmedia/cloudinary
export class CloudinaryProvider implements MediaProvider {
  private client: any;
  readonly name = 'cloudinary';
  readonly features = CloudinaryFeatures;
  
  constructor(private config: CloudinaryConfig) {
    this.client = null;
  }
  
  private async ensureClient() {
    if (!this.client) {
      const cloudinary = await import('cloudinary');
      this.client = cloudinary.v2;
      this.client.config(this.config);
    }
  }
  
  async upload(file: File | Buffer, options?: UploadOptions): Promise<UploadResult> {
    await this.ensureClient();
    
    try {
      // Convert universal options to Cloudinary-specific
      const cloudinaryOptions = this.mapOptions(options);
      
      const result = await this.client.uploader.upload(file, cloudinaryOptions);
      
      // Convert Cloudinary result to universal format
      return this.normalizeResult(result);
    } catch (error) {
      throw createMediaError(
        MediaErrorCode.UPLOAD_FAILED,
        'cloudinary',
        error
      );
    }
  }
  
  async delete(id: string): Promise<void> {
    await this.ensureClient();
    
    try {
      await this.client.uploader.destroy(id);
    } catch (error) {
      throw createMediaError(
        MediaErrorCode.DELETE_FAILED,
        'cloudinary',
        error
      );
    }
  }
  
  getUrl(id: string, transform?: TransformationOptions): string {
    const options = this.mapTransformations(transform);
    return this.client.url(id, options);
  }
  
  get native() {
    return this.client;
  }
  
  // Helper methods
  private mapOptions(options?: UploadOptions): any {
    return {
      folder: options?.folder,
      public_id: options?.filename,
      tags: options?.tags,
      transformation: options?.transformation ? [
        {
          width: options.transformation.width,
          height: options.transformation.height,
          crop: this.mapFitMode(options.transformation.fit),
          quality: options.transformation.quality,
          fetch_format: options.transformation.format
        }
      ] : undefined
    };
  }
  
  private normalizeResult(result: any): UploadResult {
    return {
      id: result.public_id,
      url: result.secure_url,
      publicUrl: result.secure_url,
      size: result.bytes,
      format: result.format,
      width: result.width,
      height: result.height,
      provider: 'cloudinary',
      metadata: {
        resourceType: result.resource_type,
        version: result.version
      },
      createdAt: new Date(result.created_at)
    };
  }
  
  private mapFitMode(fit?: string): string {
    const mapping: Record<string, string> = {
      'cover': 'fill',
      'contain': 'fit',
      'fill': 'scale',
      'inside': 'limit',
      'outside': 'mfit'
    };
    return mapping[fit || 'cover'] || 'fill';
  }
}

export const CloudinaryFeatures: ProviderFeatures = {
  transformations: {
    resize: true,
    crop: true,
    format: true,
    quality: true,
    blur: true,
    rotate: true,
    effects: true
  },
  capabilities: {
    signedUploads: true,
    directUpload: true,
    multipartUpload: true,
    videoProcessing: true,
    aiTagging: true,
    facialDetection: true
  },
  storage: {
    maxFileSize: 100 * 1024 * 1024, // 100MB
    supportedFormats: ['jpg', 'png', 'gif', 'webp', 'svg', 'mp4', 'mov']
  }
};
```

### 3.2 S3 Provider (with Multipart Upload)

```typescript
// @fluxmedia/s3
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

export class S3Provider implements MediaProvider {
  private client: S3Client;
  readonly name = 's3';
  readonly features = S3Features;
  
  constructor(private config: S3Config) {
    this.client = new S3Client({
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey
      }
    });
  }
  
  async upload(file: File | Buffer, options?: UploadOptions): Promise<UploadResult> {
    const key = this.buildKey(options?.folder, options?.filename || file.name);
    
    // Use multipart upload for large files (>5MB)
    if (file.size > 5 * 1024 * 1024) {
      return this.multipartUpload(file, key, options);
    }
    
    try {
      const command = new PutObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
        Body: file,
        ContentType: file.type,
        Metadata: options?.metadata
      });
      
      await this.client.send(command);
      
      return {
        id: key,
        url: this.getUrl(key),
        publicUrl: this.getUrl(key),
        size: file.size,
        format: file.type.split('/')[1],
        provider: 's3',
        metadata: options?.metadata || {},
        createdAt: new Date()
      };
    } catch (error) {
      throw createMediaError(MediaErrorCode.UPLOAD_FAILED, 's3', error);
    }
  }
  
  getUrl(id: string, transform?: TransformationOptions): string {
    // S3 doesn't support transformations natively
    // Return base URL (transformations would need CloudFront + Lambda@Edge)
    return `https://${this.config.bucket}.s3.${this.config.region}.amazonaws.com/${id}`;
  }
  
  private buildKey(folder?: string, filename?: string): string {
    const parts = [folder, filename].filter(Boolean);
    return parts.join('/');
  }
  
  private async multipartUpload(
    file: File | Buffer,
    key: string,
    options?: UploadOptions
  ): Promise<UploadResult> {
    // Implementation of multipart upload for large files
    // Split file into 5MB chunks and upload in parallel
    // ... (detailed implementation)
  }
  
  get native() {
    return this.client;
  }
}

export const S3Features: ProviderFeatures = {
  transformations: {
    resize: false,
    crop: false,
    format: false,
    quality: false,
    blur: false,
    rotate: false,
    effects: false
  },
  capabilities: {
    signedUploads: true,
    directUpload: true,
    multipartUpload: true,
    videoProcessing: false,
    aiTagging: false,
    facialDetection: false
  },
  storage: {
    maxFileSize: 5 * 1024 * 1024 * 1024, // 5GB
    supportedFormats: ['*']
  }
};
```

---

## 4. React Integration

### 4.1 Upload Modes

```typescript
type UploadMode = 'direct' | 'signed' | 'proxy';

interface DirectUploadConfig {
  mode: 'direct';
  uploader: MediaUploader;
}

interface SignedUploadConfig {
  mode: 'signed';
  signUrlEndpoint: string;
}

interface ProxyUploadConfig {
  mode: 'proxy';
  uploadEndpoint: string;
  headers?: Record<string, string>;
}

type UploadConfig = DirectUploadConfig | SignedUploadConfig | ProxyUploadConfig;
```

### 4.2 useMediaUpload Hook

```typescript
// @fluxmedia/react
export function useMediaUpload(config: UploadConfig) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<Error | null>(null);
  const [result, setResult] = useState<UploadResult | null>(null);

  const upload = async (file: File, options?: UploadOptions): Promise<UploadResult> => {
    setUploading(true);
    setError(null);
    setProgress(0);

    try {
      let uploadResult: UploadResult;

      switch (config.mode) {
        case 'direct':
          uploadResult = await uploadDirect(file, config, options, setProgress);
          break;
        case 'signed':
          uploadResult = await uploadSigned(file, config, options, setProgress);
          break;
        case 'proxy':
          uploadResult = await uploadProxy(file, config, options, setProgress);
          break;
      }

      setResult(uploadResult);
      setProgress(100);
      return uploadResult;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Upload failed');
      setError(error);
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const reset = () => {
    setUploading(false);
    setProgress(0);
    setError(null);
    setResult(null);
  };

  return { upload, uploading, progress, error, result, reset };
}
```

### 4.3 Context Provider

```typescript
// @fluxmedia/react
const MediaContext = createContext<MediaUploader | null>(null);

export function MediaProvider({ 
  uploader, 
  children 
}: { 
  uploader: MediaUploader; 
  children: React.ReactNode 
}) {
  return (
    <MediaContext.Provider value={uploader}>
      {children}
    </MediaContext.Provider>
  );
}

export function useMedia() {
  const uploader = useContext(MediaContext);
  if (!uploader) {
    throw new Error('useMedia must be used within MediaProvider');
  }
  return uploader;
}
```

### 4.4 Usage Examples

```typescript
// Direct upload
function DirectUploadExample() {
  const uploader = useMedia();
  const { upload, uploading, progress } = useMediaUpload({
    mode: 'direct',
    uploader
  });

  return (
    <input
      type="file"
      onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) upload(file);
      }}
    />
  );
}

// Signed URL upload (most secure)
function SignedUploadExample() {
  const { upload, uploading, progress } = useMediaUpload({
    mode: 'signed',
    signUrlEndpoint: '/api/media/sign'
  });

  return (
    <div>
      <input type="file" onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) upload(file, { folder: 'avatars' });
      }} />
      {uploading && <progress value={progress} max={100} />}
    </div>
  );
}

// Proxy upload (server-side)
function ProxyUploadExample() {
  const { upload, uploading, progress, error } = useMediaUpload({
    mode: 'proxy',
    uploadEndpoint: '/api/media/upload',
    headers: { 'Authorization': `Bearer ${token}` }
  });

  return (
    <div>
      <input type="file" onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) upload(file);
      }} />
      {uploading && <div>Uploading: {progress.toFixed(0)}%</div>}
      {error && <div>Error: {error.message}</div>}
    </div>
  );
}
```

---

## 5. Advanced Features

### 5.1 Plugin System

```typescript
interface MediaPlugin {
  name: string;
  version?: string;
  
  beforeUpload?(context: BeforeUploadContext): Promise<BeforeUploadContext>;
  afterUpload?(context: AfterUploadContext): Promise<AfterUploadContext>;
  beforeDelete?(context: BeforeDeleteContext): Promise<BeforeDeleteContext>;
  afterDelete?(context: AfterDeleteContext): Promise<void>;
  onError?(context: ErrorContext): Promise<void>;
  
  init?(uploader: MediaUploader): Promise<void>;
  destroy?(): Promise<void>;
}

// Usage
const uploader = new MediaUploader(
  new CloudinaryProvider({ /* ... */ }),
  [
    createFileTypeValidationPlugin({
      allowedTypes: ['image/*'],
      maxSize: 10 * 1024 * 1024
    }),
    createImageOptimizationPlugin({
      maxWidth: 2000,
      quality: 0.85
    }),
    createAnalyticsPlugin({
      trackingFn: (event, data) => analytics.track(event, data)
    })
  ]
);
```

### 5.2 Transformation Builder

```typescript
// Chainable transformation API
const url = uploader.transform(fileId)
  .resize(400, 400)
  .format('webp')
  .quality(80)
  .blur(5)
  .build();
```

### 5.3 Native Provider Access

```typescript
// Access provider-specific features
const uploader = new MediaUploader(new CloudinaryProvider({ /* ... */ }));

// Universal API
await uploader.upload(file);

// Provider-specific features
const cloudinary = uploader.provider.native;
await cloudinary.uploader.explicit('sample', {
  type: 'upload',
  eager: [{ effect: 'sepia' }]
});
```

---

## 6. Project Structure

```
fluxmedia/
├── .github/
│   ├── workflows/
│   │   ├── ci.yml
│   │   ├── publish.yml
│   │   └── docs.yml
│   ├── ISSUE_TEMPLATE/
│   └── pull_request_template.md
│
├── packages/
│   ├── core/
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── types.ts
│   │   │   ├── media-uploader.ts
│   │   │   ├── errors.ts
│   │   │   ├── features.ts
│   │   │   └── __tests__/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── tsup.config.ts
│   │   └── README.md
│   │
│   ├── cloudinary/
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── cloudinary-provider.ts
│   │   │   ├── types.ts
│   │   │   └── __tests__/
│   │   ├── package.json
│   │   └── README.md
│   │
│   ├── s3/
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── s3-provider.ts
│   │   │   ├── multipart.ts
│   │   │   └── __tests__/
│   │   └── package.json
│   │
│   ├── r2/
│   │   ├── src/
│   │   └── package.json
│   │
│   └── react/
│       ├── src/
│       │   ├── index.ts
│       │   ├── use-media-upload.ts
│       │   ├── use-media.ts
│       │   ├── media-provider.tsx
│       │   └── __tests__/
│       └── package.json
│
├── examples/
│   ├── basic-node/
│   ├── nextjs-app/
│   └── react-vite/
│
├── docs/
│   ├── .vitepress/
│   ├── guide/
│   ├── api/
│   └── examples/
│
├── .changeset/
├── pnpm-workspace.yaml
├── package.json
├── turbo.json
├── tsconfig.base.json
├── LICENSE (MIT)
└── README.md
```

---

## 7. Testing Strategy

### 7.1 Unit Tests

```typescript
// Mock provider SDKs
vi.mock('cloudinary', () => ({
  v2: {
    config: vi.fn(),
    uploader: {
      upload: vi.fn(),
      destroy: vi.fn()
    }
  }
}));

describe('CloudinaryProvider', () => {
  it('should upload file and return normalized result', async () => {
    const provider = new CloudinaryProvider({ /* ... */ });
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const result = await provider.upload(file);
    
    expect(result).toMatchObject({
      id: expect.any(String),
      url: expect.stringContaining('cloudinary.com'),
      provider: 'cloudinary'
    });
  });
});
```

### 7.2 Integration Tests

```typescript
// Only run with real credentials
const shouldRunIntegration = Boolean(process.env.CLOUDINARY_CLOUD_NAME);

describe.skipIf(!shouldRunIntegration)('Cloudinary Integration', () => {
  it('should upload, retrieve, and delete', async () => {
    const provider = new CloudinaryProvider({ /* real credentials */ });
    const uploadResult = await provider.upload(testFile);
    const retrieved = await provider.get(uploadResult.id);
    await provider.delete(uploadResult.id);
    
    expect(retrieved.id).toBe(uploadResult.id);
  }, 30000);
});
```

### 7.3 Contract Tests

```typescript
export function testProviderContract(
  createProvider: () => MediaProvider,
  testFile: File
) {
  describe('Provider Contract', () => {
    it('should implement all required methods', async () => {
      const provider = createProvider();
      const result = await provider.upload(testFile);
      
      expect(result).toMatchObject({
        id: expect.any(String),
        url: expect.any(String),
        size: expect.any(Number),
        provider: expect.any(String)
      });
    });
  });
}

// Run for all providers
testProviderContract(() => new CloudinaryProvider({ /* ... */ }), testFile);
testProviderContract(() => new S3Provider({ /* ... */ }), testFile);
testProviderContract(() => new R2Provider({ /* ... */ }), testFile);
```

---

## 8. CI/CD Pipeline

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      
      - run: pnpm install
      - run: pnpm lint
      - run: pnpm type-check
      - run: pnpm build
      - run: pnpm test
      
      - uses: codecov/codecov-action@v3
```

```yaml
# .github/workflows/publish.yml
name: Publish

on:
  push:
    branches: [main]

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          registry-url: 'https://registry.npmjs.org'
      
      - run: pnpm install
      - run: pnpm build
      - run: pnpm test
      
      - name: Publish
        uses: changesets/action@v1
        with:
          publish: pnpm publish-packages
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
```

---

## 9. Documentation

### 9.1 Documentation Site Structure

```
docs/
├── index.md                    # Homepage
├── guide/
│   ├── getting-started.md
│   ├── installation.md
│   ├── providers/
│   │   ├── cloudinary.md
│   │   ├── s3.md
│   │   └── r2.md
│   ├── react/
│   │   ├── hooks.md
│   │   ├── components.md
│   │   └── upload-modes.md
│   └── advanced/
│       ├── plugins.md
│       ├── transformations.md
│       └── native-access.md
├── api/
│   ├── core.md
│   ├── providers.md
│   └── react.md
├── examples/
│   ├── migration-from-cloudinary.md
│   ├── nextjs-integration.md
│   └── provider-switching.md
└── comparison.md               # vs other solutions
```

### 9.2 README Template

```markdown
# FluxMedia

**Switch providers, not code.**

A TypeScript-first media library for uploading to Cloudinary, S3, R2, and more.

## Features

- 🔄 Switch providers with one line of code
- 🎯 Type-safe with full TypeScript support
- ⚡ Tree-shakeable - only bundle what you use
- ⚛️ React hooks and components included
- 🔌 Extensible plugin system

## Quick Start

\`\`\`bash
pnpm add @fluxmedia/core @fluxmedia/cloudinary cloudinary
\`\`\`

\`\`\`typescript
import { MediaUploader } from '@fluxmedia/core';
import { CloudinaryProvider } from '@fluxmedia/cloudinary';

const uploader = new MediaUploader(
  new CloudinaryProvider({ /* ... */ })
);

const result = await uploader.upload(file);
console.log(result.url);
\`\`\`

[Full Documentation →](https://fluxmedia.dev)

## License

MIT
```

---

## 10. Implementation Roadmap

### Phase 1: MVP (Weeks 1-6)

#### Week 1-2: Core Foundation
- ✅ Set up monorepo (pnpm + Changesets)
- ✅ Create `@fluxmedia/core` package
- ✅ Define all core interfaces and types
- ✅ Implement `CloudinaryProvider`
- ✅ Write unit tests for core + Cloudinary
- ✅ Create basic Node.js example

**Deliverable:** Working Cloudinary integration

#### Week 3-4: Additional Providers
- ✅ Implement `S3Provider` with multipart uploads
- ✅ Implement `R2Provider`
- ✅ Document provider feature matrices
- ✅ Create provider comparison examples
- ✅ Contract tests for all providers

**Deliverable:** 3 working providers with feature parity

#### Week 5-6: React Integration
- ✅ Implement `useMediaUpload` (all 3 modes)
- ✅ Create `MediaProvider` context
- ✅ Build `MediaUploadDropzone` component
- ✅ Add progress tracking and error handling
- ✅ Create Next.js example with API routes
- ✅ Test all upload modes in React

**Deliverable:** Full React integration with examples

**MVP Success Criteria:**
- Can upload to all 3 providers
- Provider switching works with config only
- React hooks work in all upload modes
- 80%+ test coverage
- Basic documentation exists

---

### Phase 2: Polish & Community (Weeks 7-10)

#### Week 7: Developer Experience
- Improve TypeScript autocomplete
- Better error messages with docs links
- Set up VitePress documentation site
- Write migration guides
- Create comparison tables

#### Week 8: Plugin System
- Implement plugin architecture
- Create essential plugins:
  - File type validation
  - Image optimization
  - Analytics/logging
  - Metadata extraction
- Document plugin API
- Create plugin starter template

#### Week 9-10: Community Building
- **Launch Strategy:**
  - Post on r/reactjs, r/webdev, r/node
  - Twitter thread
  - Dev.to article
  - Product Hunt launch
  
- **GitHub Setup:**
  - CONTRIBUTING.md
  - Issue/PR templates
  - Good first issues
  - Code of conduct
  
- **Content:**
  - "I migrated from Cloudinary to R2 in 5 minutes" blog post
  - Video tutorial
  - Real-world examples

---

### Phase 3: Growth (Month 3+)

#### Additional Providers (Priority Order)
1. UploadThing
2. ImageKit
3. Uploadcare
4. Vercel Blob
5. Supabase Storage
6. Azure Blob

#### Advanced Features
**High Priority:**
- Video upload support
- Batch operations optimization
- Retry logic and resumable uploads
- Transformation builder API

**Medium Priority:**
- Next.js App Router SSR support
- Stream uploads for large files
- CDN integration
- Rate limiting per provider

**Future:**
- Admin UI for file browsing
- Media library React component
- Asset organization (folders, tags, search)
- Usage analytics dashboard

---

## 11. Success Metrics

### Technical Metrics
- **Bundle size:** Core + 1 provider < 50KB gzipped ✅
- **Test coverage:** >80% ✅
- **Build time:** <10s for all packages ✅
- **TypeScript:** Strict mode enabled ✅

### Community Metrics (6 months)
- **GitHub stars:** 500+
- **npm downloads:** 1000+/week
- **Contributors:** 10+
- **Issues resolved:** 50+
- **Documentation:** 100% of public API

### Quality Metrics
- **Bug reports:** <5 open at any time
- **Response time:** <48h for issues
- **Breaking changes:** None in minor versions
- **Deprecation warnings:** 3 months before removal

---

## 12. Community & Open Source

### 12.1 Licensing
**MIT License** - Most permissive, encourages adoption

### 12.2 Community Guidelines
1. **Welcoming** - Friendly to beginners
2. **Clear** - Well-documented contribution process
3. **Responsive** - Address issues/PRs within 48h
4. **Transparent** - Public roadmap and decisions

### 12.3 Contribution Flow

```bash
# Good first issues
- Add provider: UploadThing
- Write example: Remix integration
- Fix bug: Progress tracking in Safari
- Improve docs: Migration guide from X

# How to attract contributors
1. Tag issues with "good first issue"
2. Provide detailed issue templates
3. Recognize contributors (CONTRIBUTORS.md)
4. Make PR reviews educational
```

### 12.4 Release Process

```bash
# 1. Make changes to code

# 2. Create a changeset
npx changeset
# Choose packages that changed
# Choose version bump (major/minor/patch)
# Write changelog entry

# 3. Commit and push
git add .changeset/
git commit -m "Add feature X"
git push

# 4. Version packages (when ready)
npx changeset version

# 5. Publish (CI handles this)
# Or manually: npx changeset publish
```

---

## 13. Future Monetization (Post-MVP)

### Option 1: Freemium SaaS
```
Free Tier:
- 1GB storage
- 10GB bandwidth
- Community support

Pro ($29/mo):
- 100GB storage
- 1TB bandwidth
- Priority support

Enterprise:
- Custom storage/bandwidth
- SLA
- Dedicated support
```

### Option 2: Managed Infrastructure
- Host library + infrastructure
- Secure credential management
- Automatic optimization
- Analytics dashboard
- Usage-based pricing

### Option 3: Enterprise Add-ons
Keep core OSS, charge for:
- Enterprise support
- Custom provider adapters
- White-label solutions
- Professional services

**Recommendation:** Focus 100% on OSS quality first. Monetization becomes viable after:
- 5000+ weekly downloads
- Strong community
- Clear value proposition
- Ecosystem trust

---

## 14. Competitive Analysis

| Library      | Language | Providers | Bundle Size | Type Safety | Upload Modes | Active |
|--------------|----------|-----------|-------------|-------------|--------------|--------|
| UploadThing  | TS       | 1 (own)   | Medium      | ✅          | Signed       | ✅     |
| Flysystem    | PHP      | 15+       | N/A         | ❌          | Direct       | ✅     |
| pkgcloud     | JS       | 5+        | Large       | ❌          | Direct       | ⚠️     |
| **FluxMedia**| TS       | 3+ (MVP)  | Small       | ✅          | All 3        | ✅     |

**Differentiation:**
- TypeScript-first with exceptional DX
- Modern React integration (3 upload modes)
- Tree-shakeable architecture
- Provider switching without code changes
- Active maintenance commitment

---

## 15. Week 1 Action Plan

### Day 1: Repository Setup
- [ ] Create GitHub repo: `fluxmediajs/fluxmedia`
- [ ] Initialize with README, LICENSE (MIT)
- [ ] Set up pnpm workspace
- [ ] Configure TypeScript (strict mode)
- [ ] Set up Vitest
- [ ] Configure GitHub Actions

### Day 2-3: Core Package
- [ ] Create `@fluxmedia/core` package structure
- [ ] Define `MediaProvider` interface
- [ ] Define all core types (`UploadResult`, `UploadOptions`, etc.)
- [ ] Implement `MediaUploader` class
- [ ] Implement error handling (`MediaError`, error codes)
- [ ] Write unit tests for core
- [ ] Set up tsup for building

### Day 4-5: Cloudinary Provider
- [ ] Create `@fluxmedia/cloudinary` package
- [ ] Implement `CloudinaryProvider` class
- [ ] Implement option mapping (universal → Cloudinary)
- [ ] Implement result normalization (Cloudinary → universal)
- [ ] Write unit tests (with mocked Cloudinary SDK)
- [ ] Write integration tests (with real credentials)
- [ ] Create basic Node.js example

### Day 6-7: Documentation & Polish
- [ ] Write comprehensive README for monorepo
- [ ] Write README for each package
- [ ] Add JSDoc comments to all public APIs
- [ ] Create CONTRIBUTING.md
- [ ] Set up issue templates
- [ ] Write migration guide from raw Cloudinary
- [ ] Publish v0.1.0-alpha to npm

---

## 16. Key Decisions Summary

### Package Naming
✅ **Chosen:** `@fluxmedia/*`
- GitHub: `fluxmediajs/fluxmedia`
- Domain: `fluxmedia.dev`
- npm: `@fluxmedia/core`, `@fluxmedia/cloudinary`, etc.

### Tagline
✅ **Chosen:** "Switch providers, not code."

### Initial Providers (in order)
1. Cloudinary (most feature-rich, reference implementation)
2. S3 (most common)
3. R2 (cheap alternative to S3)

### Monorepo Stack
- **pnpm** - Package manager
- **Turborepo** - Build orchestration
- **Changesets** - Version management
- **tsup** - TypeScript bundler
- **Vitest** - Testing

### Upload Modes (all supported)
1. **Direct** - Client has provider credentials
2. **Signed** - Server generates signed upload URL
3. **Proxy** - Server proxies upload to provider

### Target Users (MVP)
- Open source community
- React/Next.js developers
- Node.js backend developers
- *Not* enterprise (yet)

---

## 17. FAQ

### Q: Why not use a single package with all providers?
**A:** Bundle size. Users shouldn't download S3 SDK if they only use Cloudinary. Separate packages enable tree-shaking.

### Q: How do I add a new provider?
**A:** Implement the `MediaProvider` interface, write tests, submit PR. See CONTRIBUTING.md for details.

### Q: What if my provider doesn't support transformations?
**A:** That's fine! Set `features.transformations.*` to `false`. Users can check features before using them.

### Q: Can I use this in production?
**A:** Wait for v1.0.0. Use alpha/beta versions at your own risk.

### Q: How do I migrate from direct Cloudinary?
**A:** See migration guide in docs. TL;DR: Install FluxMedia, wrap your Cloudinary config, same code works.

### Q: Does this work with Next.js App Router?
**A:** Yes! Examples included for both Pages and App Router.

### Q: What about server-side rendering?
**A:** Core package works in Node.js. React package works client-side. Next.js integration handles both.

---

## Conclusion

FluxMedia solves a real problem with a proven pattern. Success depends on:

1. **Start focused** - Get Cloudinary + S3 working perfectly
2. **Nail the DX** - Make switching providers feel magical
3. **Stay lean** - Aggressive bundle size management
4. **Document well** - Migration guides, examples, feature matrices
5. **Build community** - Accept contributions, respond quickly

The technical approach is sound, the need is validated, and the TypeScript ecosystem needs this. Let's build something great! 🚀

---

**Ready to start?** Begin with Week 1, Day 1 tasks above. Good luck!
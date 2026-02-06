"use client";

import { Loader2, ExternalLink, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

// FluxMedia demo code that will be embedded in StackBlitz
const DEMO_CODE = `import { MediaUploader, createPlugin } from '@fluxmedia/core';
import { S3Provider } from '@fluxmedia/s3';
import { CloudinaryProvider } from '@fluxmedia/cloudinary';

// =============================================
// FLUXMEDIA PLAYGROUND
// Try editing this code and see it run!
// =============================================

// 1. Create a simple logger plugin
const loggerPlugin = createPlugin('logger', {
  beforeUpload: async (file, options) => {
    console.log('📤 Starting upload:', options.filename || 'unnamed');
    console.log('   Size:', formatBytes(file.size || file.byteLength));
    return { file, options };
  },
  afterUpload: async (result) => {
    console.log('✅ Upload complete!');
    console.log('   URL:', result.url);
    console.log('   ID:', result.id);
    return result;
  },
  onError: async (error) => {
    console.error('❌ Upload failed:', error.message);
  }
});

// 2. Create validation plugin
const validationPlugin = createPlugin('validator', {
  beforeUpload: async (file, options) => {
    const size = file.size || file.byteLength;
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    if (size > maxSize) {
      throw new Error(\`File too large: \${formatBytes(size)} > \${formatBytes(maxSize)}\`);
    }
    console.log('✓ Validation passed');
    return { file, options };
  }
});

// 3. Try different providers with the SAME code!

// S3 Provider
const s3Uploader = new MediaUploader(
  new S3Provider({
    region: 'us-east-1',
    bucket: 'my-bucket',
    accessKeyId: 'YOUR_KEY',
    secretAccessKey: 'YOUR_SECRET'
  })
);

// Cloudinary Provider  
const cloudinaryUploader = new MediaUploader(
  new CloudinaryProvider({
    cloudName: 'demo',
    apiKey: 'YOUR_KEY',
    apiSecret: 'YOUR_SECRET'
  })
);

// 4. Register plugins (works with any provider!)
await s3Uploader.use(loggerPlugin);
await s3Uploader.use(validationPlugin);

// 5. Check capabilities
console.log('\\n📊 Provider Capabilities:');
console.log('S3 supports transformations:', s3Uploader.supports('transformations.resize'));
console.log('Cloudinary supports transformations:', cloudinaryUploader.supports('transformations.resize'));

// 6. Demo upload (would work with real credentials)
console.log('\\n🚀 Ready to upload!');
console.log('The unified API means your upload code works identically across:');
console.log('  - AWS S3');
console.log('  - Cloudflare R2');  
console.log('  - Cloudinary');

// Helper function
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return (bytes / Math.pow(k, i)).toFixed(1) + ' ' + sizes[i];
}

console.log('\\n✨ Edit this code to explore FluxMedia!');
`;

export default function PlaygroundPage() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    // Use StackBlitz's WebContainer URL with custom code
    const stackblitzUrl = `https://stackblitz.com/edit/node-fluxmedia-demo?embed=1&file=index.js&hideNavigation=1&theme=dark&view=editor`;

    const handleRetry = () => {
        setLoading(true);
        setError(false);
        // Force reload iframe by remounting
        const iframe = document.querySelector('iframe');
        if (iframe) {
            iframe.src = iframe.src;
        }
    };

    return (
        <div className="container py-8 h-[calc(100vh-4rem)] flex flex-col max-w-7xl">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Playground</h1>
                    <p className="text-muted-foreground">
                        Explore FluxMedia in a live Node.js environment powered by StackBlitz.
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRetry}
                        className="gap-2"
                    >
                        <RefreshCw className="h-4 w-4" />
                        Reload
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="gap-2"
                    >
                        <a
                            href="https://stackblitz.com/edit/node-fluxmedia-demo"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <ExternalLink className="h-4 w-4" />
                            Open Full Editor
                        </a>
                    </Button>
                </div>
            </div>

            {/* Code preview for reference */}
            <div className="mb-4 text-sm text-muted-foreground bg-muted/50 rounded-lg p-4 border border-border/50">
                <strong>Tip:</strong> The playground demonstrates plugins, providers, and the unified upload API.
                Edit the code directly in StackBlitz to experiment!
            </div>

            <div className="flex-1 rounded-xl border border-border/50 bg-zinc-950 overflow-hidden relative shadow-2xl">
                {loading && !error && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950 text-zinc-500 z-20">
                        <Loader2 className="h-10 w-10 animate-spin mb-4" />
                        <span className="text-lg">Loading StackBlitz WebContainer...</span>
                        <span className="text-sm mt-2">This may take 10-20 seconds on first load</span>
                    </div>
                )}

                {error && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950 text-zinc-500 z-20">
                        <span className="text-lg mb-4">Failed to load playground</span>
                        <Button onClick={handleRetry} variant="outline">
                            Try Again
                        </Button>
                    </div>
                )}

                <iframe
                    src={stackblitzUrl}
                    className="w-full h-full border-0 relative z-10"
                    title="FluxMedia Playground"
                    onLoad={() => setLoading(false)}
                    onError={() => {
                        setLoading(false);
                        setError(true);
                    }}
                    allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
                    sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
                />
            </div>

            <div className="mt-4 text-center text-sm text-muted-foreground">
                Powered by <a href="https://stackblitz.com" target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:underline">StackBlitz WebContainers</a>
            </div>
        </div>
    );
}

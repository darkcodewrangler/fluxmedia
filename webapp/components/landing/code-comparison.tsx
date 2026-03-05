'use client';

import { useEffect, useState } from 'react';
import { codeToHtml } from 'shiki';
import { Check, Copy, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

const OLD_WAY = `// Traditional approach: AWS SDK v3 (Verbose)
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const client = new S3Client({
  region: "us-east-1",
  credentials: { accessKeyId: "...", secretAccessKey: "..." }
});

// Uploading requires manual stream handling & command setup
const command = new PutObjectCommand({
  Bucket: "my-bucket",
  Key: "uploads/avatar.png",
  Body: fileStream,
  ContentType: "image/png"
});

await client.send(command);`;

const PLUGIN_WAY = `// FluxMedia: With Plugins
import { MediaUploader } from "@fluxmedia/core";
import { S3Provider } from "@fluxmedia/s3";
import { 
  createFileValidationPlugin, 
  createAnalyticsPlugin, 
  createRetryPlugin 
} from "@fluxmedia/plugins";

const uploader = new MediaUploader(
  new S3Provider({
    region: "us-east-1",
    bucket: "my-bucket",
    accessKeyId: "...",
    secretAccessKey: "..."
  })
);

// Register official plugins
await uploader.use(createFileValidationPlugin({
  maxSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: ["image/*", "video/*"]
}));

await uploader.use(createAnalyticsPlugin());
await uploader.use(createRetryPlugin({ maxRetries: 3 }));

// One API for S3, R2, and Cloudinary!
await uploader.upload(file, {
  folder: "uploads",
  metadata: { type: "avatar" }
});`;

const BASIC_WAY = `// FluxMedia: Basic Setup
import { MediaUploader } from "@fluxmedia/core";
import { S3Provider } from "@fluxmedia/s3";

const uploader = new MediaUploader(
  new S3Provider({
    region: "us-east-1",
    bucket: "my-bucket",
    accessKeyId: "...",
    secretAccessKey: "..."
  })
);

// One API for S3, R2, and Cloudinary!
await uploader.upload(file, {
  folder: "uploads",
  metadata: { type: "avatar" }
});`;

type Tab = 'plugins' | 'basic';

export function CodeComparison() {
  const [oldHtml, setOldHtml] = useState('');
  const [pluginHtml, setPluginHtml] = useState('');
  const [basicHtml, setBasicHtml] = useState('');
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('plugins');
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const shikiOpts = {
      lang: 'typescript' as const,
      themes: { light: 'github-light' as const, dark: 'github-dark' as const },
      defaultColor: false as const,
    };
    async function highlight() {
      const [old, plugin, basic] = await Promise.all([
        codeToHtml(OLD_WAY, shikiOpts),
        codeToHtml(PLUGIN_WAY, shikiOpts),
        codeToHtml(BASIC_WAY, shikiOpts),
      ]);
      setOldHtml(old);
      setPluginHtml(plugin);
      setBasicHtml(basic);
    }
    highlight();
  }, []);

  const copyCode = () => {
    const code = activeTab === 'plugins' ? PLUGIN_WAY : BASIC_WAY;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentHtml = activeTab === 'plugins' ? pluginHtml : basicHtml;
  const collapsedHeight = 280;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8 max-w-6xl mx-auto">
      {/* Old Way */}
      <div className="terminal-window">
        <div className="terminal-bar">
          <div className="terminal-dots">
            <span />
            <span />
            <span />
          </div>
          <span className="text-xs font-medium text-muted-foreground">The Old Way</span>
        </div>
        <div className="p-5">
          <div
            className="text-sm font-mono overflow-x-auto [&>pre]:bg-transparent! [&>pre]:p-0 opacity-50"
            dangerouslySetInnerHTML={{
              __html: oldHtml || "<div class='text-muted-foreground'>Loading...</div>",
            }}
          />
        </div>
      </div>

      {/* FluxMedia Way */}
      <div className="relative terminal-window ring-1 ring-brand/20 border-brand/30">
        <div className="terminal-bar">
          <div className="terminal-dots">
            <span className="!bg-red-500/70" />
            <span className="!bg-yellow-500/70" />
            <span className="!bg-green-500/70" />
          </div>
          <span className="text-xs font-medium text-brand">FluxMedia Way</span>
        </div>

        <div className="p-5">
          {/* Tabs */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setActiveTab('plugins')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                activeTab === 'plugins'
                  ? 'bg-brand text-primary-foreground'
                  : 'bg-accent text-muted-foreground hover:text-foreground'
              }`}
            >
              With Plugins
            </button>
            <button
              onClick={() => setActiveTab('basic')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                activeTab === 'basic'
                  ? 'bg-brand text-primary-foreground'
                  : 'bg-accent text-muted-foreground hover:text-foreground'
              }`}
            >
              Basic Setup
            </button>
          </div>

          {/* Code with expand/collapse */}
          <div className="relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                style={{
                  maxHeight: isExpanded ? 'none' : collapsedHeight,
                  overflow: 'hidden',
                }}
                className="text-sm font-mono overflow-x-auto [&>pre]:bg-transparent! [&>pre]:p-0"
                dangerouslySetInnerHTML={{
                  __html: currentHtml || "<div class='text-muted-foreground'>Loading...</div>",
                }}
              />
            </AnimatePresence>

            {!isExpanded && (
              <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-surface via-surface/90 to-transparent pointer-events-none" />
            )}
          </div>

          <div className="flex justify-center mt-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1 px-4 py-2 text-xs font-medium text-muted-foreground hover:text-brand transition-colors"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-3 w-3" />
                  See Less
                </>
              ) : (
                <>
                  <ChevronDown className="h-3 w-3" />
                  See More
                </>
              )}
            </button>
          </div>
        </div>

        {/* Copy button */}
        <Button
          size="icon"
          variant="ghost"
          className="absolute top-3 right-3 h-8 w-8 text-muted-foreground hover:text-foreground"
          onClick={copyCode}
        >
          {copied ? <Check className="h-4 w-4 text-brand" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}

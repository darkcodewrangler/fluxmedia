'use client';

import { useEffect, useState } from 'react';
import { codeToHtml } from 'shiki';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

const easeOut = [0.16, 1, 0.3, 1] as const;

const OLD_WAY = `// Traditional approach: AWS SDK v3 (Verbose)
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const client = new S3Client({
  region: "us-east-1",
  credentials: { accessKeyId: "...", secretAccessKey: "..." }
});

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
  createRetryPlugin
} from "@fluxmedia/plugins";

const uploader = new MediaUploader(
  new S3Provider({ region: "us-east-1", bucket: "my-bucket", ... })
);

await uploader.use(createFileValidationPlugin({ maxSize: 10_000_000 }));
await uploader.use(createRetryPlugin({ maxRetries: 3 }));

await uploader.upload(file, { folder: "uploads" });`;

const BASIC_WAY = `// FluxMedia: Basic Setup
import { MediaUploader } from "@fluxmedia/core";
import { S3Provider } from "@fluxmedia/s3";

const uploader = new MediaUploader(
  new S3Provider({ region: "us-east-1", bucket: "my-bucket", ... })
);

await uploader.upload(file, { folder: "uploads" });`;

type Tab = 'plugins' | 'basic';

export function CodeComparison() {
  const [oldHtml, setOldHtml] = useState('');
  const [pluginHtml, setPluginHtml] = useState('');
  const [basicHtml, setBasicHtml] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('plugins');
  const [isExpanded, setIsExpanded] = useState(false);
  const reduceMotion = useReducedMotion();

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

  const currentHtml = activeTab === 'plugins' ? pluginHtml : basicHtml;
  const collapsedHeight = 260;

  return (
    <div className="flex flex-col gap-4">
      <div className="terminal-window">
        <div className="terminal-bar">
          <div className="terminal-dots" aria-hidden>
            <span />
            <span />
            <span />
          </div>
          <span className="font-mono text-xs text-muted-foreground">before</span>
        </div>
        <div className="p-4 sm:p-5">
          <div
            className="overflow-x-auto font-mono text-[0.8125rem] leading-relaxed [&>pre]:m-0 [&>pre]:bg-transparent! [&>pre]:p-0"
            dangerouslySetInnerHTML={{
              __html: oldHtml || "<span class='text-muted-foreground'>Loading…</span>",
            }}
          />
        </div>
      </div>

      <div className="terminal-window border-brand/30 ring-1 ring-brand/15">
        <div className="terminal-bar">
          <div className="terminal-dots" aria-hidden>
            <span className="!bg-brand/50" />
            <span />
            <span />
          </div>
          <span className="font-mono text-xs text-brand">fluxmedia</span>
        </div>
        <div className="p-4 sm:p-5">
          <div className="mb-4 flex gap-2" role="tablist" aria-label="FluxMedia examples">
            {(['plugins', 'basic'] as const).map((tab) => (
              <button
                key={tab}
                role="tab"
                aria-selected={activeTab === tab}
                onClick={() => setActiveTab(tab)}
                className={`rounded-sm px-3 py-1.5 font-mono text-xs transition-colors ${
                  activeTab === tab
                    ? 'bg-brand text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                }`}
              >
                {tab === 'plugins' ? 'with plugins' : 'basic'}
              </button>
            ))}
          </div>

          <div className="relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={reduceMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15, ease: easeOut }}
                style={{
                  maxHeight: isExpanded ? 'none' : collapsedHeight,
                  overflow: 'hidden',
                }}
                className="overflow-x-auto font-mono text-[0.8125rem] leading-relaxed [&>pre]:m-0 [&>pre]:bg-transparent! [&>pre]:p-0"
                dangerouslySetInnerHTML={{
                  __html: currentHtml || "<span class='text-muted-foreground'>Loading…</span>",
                }}
              />
            </AnimatePresence>

            {!isExpanded && (
              <div
                className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-linear-to-t from-surface to-transparent"
                aria-hidden
              />
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-3 flex w-full items-center justify-center gap-1 py-2 font-mono text-xs text-muted-foreground transition-colors hover:text-brand"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-3 w-3" aria-hidden />
                Collapse
              </>
            ) : (
              <>
                <ChevronDown className="h-3 w-3" aria-hidden />
                Expand
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

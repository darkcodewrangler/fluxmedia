'use client';

import {
  Cloud,
  Code2,
  Layers,
  Zap,
  ShieldCheck,
  Boxes,
  Plug,
  RefreshCw,
  Image,
} from 'lucide-react';
import { motion, type Variants } from 'framer-motion';
import { useEffect, useState } from 'react';
import { codeToHtml } from 'shiki';

const UNIFIED_API_CODE = `// Same code for ANY provider!
const uploader = new MediaUploader(
  new S3Provider({ ... })  // or Cloudinary, R2
);

await uploader.upload(file, {
  folder: "uploads",
  onProgress: (p) => console.log(p)
});`;

const features = [
  {
    title: 'Unified API',
    description:
      'One interface for all providers. Use Cloudinary, S3, or R2 with the same clean, type-safe API.',
    icon: Layers,
    className: 'md:col-span-2 md:row-span-2',
    highlight: true,
    hasCode: true,
  },
  {
    title: 'TypeScript First',
    description:
      'Built with strict types for incredible DX. Full autocomplete for provider configs.',
    icon: Code2,
  },
  {
    title: 'Tree-Shakeable',
    description: 'Modular architecture. Core is tiny (<5KB). Only bundle the providers you use.',
    icon: Boxes,
  },
  {
    title: 'Plugin System',
    description: 'Extend with validation, optimization, metadata extraction, analytics, and retry.',
    icon: Plug,
  },
  {
    title: 'React Hooks',
    description: 'Production-ready hooks for upload state, progress tracking, and error handling.',
    icon: Zap,
  },
  {
    title: 'Multi-Provider',
    description: 'S3, Cloudflare R2, Cloudinary, and extensible for custom providers.',
    icon: Cloud,
  },
  {
    title: 'Image Transforms',
    description: 'Resize, format conversion, and quality optimization with Cloudinary.',
    icon: Image,
  },
  {
    title: 'Auto Retry',
    description: 'Built-in retry plugin with exponential backoff for resilient uploads.',
    icon: RefreshCw,
  },
  {
    title: 'Type-Safe Config',
    description: 'Catch configuration errors at compile time, not runtime.',
    icon: ShieldCheck,
  },
];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.07 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
};

function UnifiedApiCodeSnippet() {
  const [highlightedCode, setHighlightedCode] = useState('');

  useEffect(() => {
    async function highlight() {
      const html = await codeToHtml(UNIFIED_API_CODE, {
        lang: 'typescript',
        theme: 'github-dark',
      });
      setHighlightedCode(html);
    }
    highlight();
  }, []);

  return (
    <div className="mt-6 rounded-lg bg-surface border border-border p-3 overflow-hidden">
      <div
        className="text-xs font-mono overflow-x-auto [&>pre]:bg-transparent! [&>pre]:p-0 [&>pre]:m-0"
        dangerouslySetInnerHTML={{
          __html: highlightedCode || '<div class="text-muted-foreground text-xs">Loading...</div>',
        }}
      />
    </div>
  );
}

export function FeatureGrid() {
  return (
    <section className="py-24 lg:py-32 border-t border-border/40">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand mb-4">Features</p>
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl mb-4">
            Everything you need for media uploads
          </h2>
          <p className="text-lg text-muted-foreground">
            FluxMedia handles the complexity of different providers so you can focus on building
            your app.
          </p>
        </div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
        >
          {features.map((feature, i) => (
            <motion.div
              key={i}
              variants={itemVariants}
              className={`group relative overflow-hidden rounded-xl border bg-card p-6 transition-all duration-300 ${
                feature.highlight
                  ? 'border-brand/30 bracket-border'
                  : 'border-border/50 hover:border-brand/30'
              } ${feature.className || ''}`}
            >
              <div className="flex flex-col h-full justify-between relative z-10">
                {/* Numbered index + icon row */}
                <div className="flex items-start justify-between mb-4">
                  <div
                    className={`inline-flex h-11 w-11 items-center justify-center rounded-lg ${
                      feature.highlight
                        ? 'bg-brand text-primary-foreground'
                        : 'bg-brand-muted text-brand group-hover:bg-brand group-hover:text-primary-foreground'
                    } transition-colors duration-300`}
                  >
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-mono text-muted-foreground/40">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                </div>
                <div className="flex-1 mt-auto">
                  <h3 className="mb-2 font-semibold tracking-tight text-foreground text-lg">
                    {feature.title}
                  </h3>
                  <p
                    className={`text-muted-foreground leading-relaxed ${feature.highlight ? 'text-base' : 'text-sm'}`}
                  >
                    {feature.description}
                  </p>
                  {feature.hasCode && <UnifiedApiCodeSnippet />}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

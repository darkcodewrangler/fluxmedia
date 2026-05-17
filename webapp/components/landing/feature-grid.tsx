'use client';

import { motion, useReducedMotion, type Variants } from 'framer-motion';

const easeOut = [0.16, 1, 0.3, 1] as const;

const featureGroups = [
  {
    title: 'Core API',
    items: [
      {
        index: '01',
        title: 'Unified interface',
        description:
          'Cloudinary, S3, and R2 share one upload contract. Swap providers without rewriting call sites.',
        code: true,
      },
      {
        index: '02',
        title: 'TypeScript first',
        description:
          'Strict types on configs, uploads, and plugin hooks. Autocomplete where SDKs usually guess.',
      },
      {
        index: '03',
        title: 'Tree-shakeable packages',
        description:
          'Import only the core and providers you ship. No monolithic client bundle.',
      },
    ],
  },
  {
    title: 'Production tooling',
    items: [
      {
        index: '04',
        title: 'Plugin pipeline',
        description:
          'Validation, optimization, metadata, analytics, and retry attach in a predictable order.',
      },
      {
        index: '05',
        title: 'React hooks',
        description:
          'Upload state, progress, and errors surfaced for UI without reimplementing event wiring.',
      },
      {
        index: '06',
        title: 'Auto retry',
        description:
          'Exponential backoff for transient failures, configured once at the uploader level.',
      },
    ],
  },
  {
    title: 'Provider surface',
    items: [
      {
        index: '07',
        title: 'Transforms when available',
        description:
          'Resize, format, and quality paths on Cloudinary. S3 and R2 stay lean by design.',
      },
      {
        index: '08',
        title: 'Compile-time config',
        description:
          'Catch bucket names, regions, and option shapes before deploy, not in production logs.',
      },
    ],
  },
];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: easeOut },
  },
};

function UnifiedApiCodeSnippet({ highlightedCode }: { highlightedCode: string }) {
  return (
    <div className="mt-5 overflow-hidden rounded-md border border-border bg-surface p-4">
      <div
        className="text-xs font-mono overflow-x-auto [&>pre]:m-0 [&>pre]:bg-transparent! [&>pre]:p-0"
        dangerouslySetInnerHTML={{ __html: highlightedCode }}
      />
    </div>
  );
}

interface FeatureGridProps {
  unifiedApiCodeHtml: string;
}

export function FeatureGrid({ unifiedApiCodeHtml }: FeatureGridProps) {
  const reduceMotion = useReducedMotion();

  return (
    <section className="border-t border-border/60 py-20 lg:py-28">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="mb-14 max-w-2xl">
          <h2 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Built for teams shipping uploads in anger
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            FluxMedia keeps provider differences behind one surface so your app code stays boring
            in the best way.
          </p>
        </div>

        <motion.div
          className="space-y-16"
          variants={containerVariants}
          initial={reduceMotion ? false : 'hidden'}
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
        >
          {featureGroups.map((group) => (
            <div key={group.title}>
              <p className="mb-8 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
                {group.title}
              </p>
              <div className="divide-y divide-border/70">
                {group.items.map((item) => (
                  <motion.article
                    key={item.index}
                    variants={itemVariants}
                    className="grid gap-6 py-10 md:grid-cols-[5rem_minmax(0,1fr)] md:gap-10"
                  >
                    <span className="manifest-index text-4xl text-brand/35 md:text-5xl">
                      {item.index}
                    </span>
                    <div>
                      <h3 className="text-xl font-semibold tracking-tight text-foreground">
                        {item.title}
                      </h3>
                      <p className="mt-2 max-w-prose leading-relaxed text-muted-foreground">
                        {item.description}
                      </p>
                      {'code' in item && item.code && (
                        <UnifiedApiCodeSnippet highlightedCode={unifiedApiCodeHtml} />
                      )}
                    </div>
                  </motion.article>
                ))}
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { Check, Minus } from 'lucide-react';

const providers = ['Cloudinary', 'AWS S3', 'Cloudflare R2'] as const;

const capabilities = [
  { label: 'Image transforms', values: [true, false, false] },
  { label: 'Video processing', values: [true, false, false] },
  { label: 'AI tagging', values: [true, false, false] },
  { label: 'Multipart upload', values: [true, true, true] },
  { label: 'Direct upload', values: [true, true, true] },
] as const;

const easeOut = [0.16, 1, 0.3, 1] as const;

export function ProvidersSection() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="border-t border-border/60 py-20 lg:py-24">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="mb-12 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl">
            <h2 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Same upload call. Different backends.
            </h2>
            <p className="mt-3 text-lg leading-relaxed text-muted-foreground">
              Provider-specific features stay optional. The core contract does not.
            </p>
          </div>
          <p className="max-w-sm font-mono text-sm text-muted-foreground">
            R2 ships with zero egress fees. Cloudinary carries transforms. S3 stays minimal.
          </p>
        </div>

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: easeOut }}
          className="overflow-x-auto rounded-lg border border-border"
        >
          <table className="w-full min-w-[640px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-raised">
                <th scope="col" className="px-5 py-4 font-medium text-muted-foreground">
                  Capability
                </th>
                {providers.map((name) => (
                  <th
                    key={name}
                    scope="col"
                    className="px-5 py-4 font-display text-base font-semibold text-foreground"
                  >
                    {name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {capabilities.map((row, rowIndex) => (
                <tr
                  key={row.label}
                  className={rowIndex % 2 === 0 ? 'bg-background' : 'bg-surface/50'}
                >
                  <th scope="row" className="px-5 py-3.5 font-medium text-foreground">
                    {row.label}
                  </th>
                  {row.values.map((supported, colIndex) => (
                    <td key={colIndex} className="px-5 py-3.5">
                      <span className="sr-only">
                        {supported ? 'Supported' : 'Not supported'}
                      </span>
                      {supported ? (
                        <Check className="h-4 w-4 text-brand" aria-hidden />
                      ) : (
                        <Minus className="h-4 w-4 text-muted-foreground/40" aria-hidden />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>

        <p className="mt-8 max-w-prose text-sm leading-relaxed text-muted-foreground">
          FluxMedia normalizes uploads across providers. Reach for native SDK features only when
          you need provider-specific behavior.
        </p>
      </div>
    </section>
  );
}

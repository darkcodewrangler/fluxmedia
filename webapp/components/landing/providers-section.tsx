'use client';

import { motion } from 'framer-motion';
import { Cloud, Server, HardDrive, Check, X } from 'lucide-react';

const providers = [
  {
    name: 'Cloudinary',
    icon: Cloud,
    features: {
      'Image Transforms': true,
      'Video Processing': true,
      'AI Tagging': true,
      'Multipart Upload': true,
      'Direct Upload': true,
    },
  },
  {
    name: 'AWS S3',
    icon: Server,
    features: {
      'Image Transforms': false,
      'Video Processing': false,
      'AI Tagging': false,
      'Multipart Upload': true,
      'Direct Upload': true,
    },
  },
  {
    name: 'Cloudflare R2',
    icon: HardDrive,
    features: {
      'Image Transforms': false,
      'Video Processing': false,
      'AI Tagging': false,
      'Multipart Upload': true,
      'Direct Upload': true,
    },
    badge: 'No Egress Fees',
  },
];

const featureLabels = [
  'Image Transforms',
  'Video Processing',
  'AI Tagging',
  'Multipart Upload',
  'Direct Upload',
];

export function ProvidersSection() {
  return (
    <section className="py-24 lg:py-32 border-t border-border/40">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-16">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand mb-4">
            Providers
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl mb-4">
            One API, Multiple Providers
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Write your upload logic once. Use it with any provider. Same interface, same
            reliability.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {providers.map((provider) => (
            <div
              key={provider.name}
              className="relative group rounded-xl border border-border/50 bg-card p-6 hover:border-brand/30 transition-all duration-300"
            >
              {provider.badge && (
                <div className="absolute -top-3 right-4 px-3 py-1 text-xs font-medium rounded-md bg-brand-muted text-brand border border-brand/20">
                  {provider.badge}
                </div>
              )}

              <div className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-brand-muted text-brand mb-4">
                <provider.icon className="h-5 w-5" />
              </div>

              <h3 className="text-xl font-semibold mb-4">{provider.name}</h3>

              <ul className="space-y-2.5">
                {featureLabels.map((feature) => (
                  <li key={feature} className="flex items-center gap-2.5 text-sm">
                    {provider.features[feature as keyof typeof provider.features] ? (
                      <Check className="h-4 w-4 text-brand" />
                    ) : (
                      <X className="h-4 w-4 text-muted-foreground/40" />
                    )}
                    <span
                      className={
                        provider.features[feature as keyof typeof provider.features]
                          ? 'text-foreground'
                          : 'text-muted-foreground'
                      }
                    >
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </motion.div>

        <div className="mt-12 text-center text-sm text-muted-foreground">
          All providers support the same unified upload API. Provider-specific features are
          automatically detected.
        </div>
      </div>
    </section>
  );
}

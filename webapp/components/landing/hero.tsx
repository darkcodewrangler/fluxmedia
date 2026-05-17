'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Github } from 'lucide-react';
import { CodeComparison } from './code-comparison';
import { motion, useReducedMotion } from 'framer-motion';

const easeOut = [0.16, 1, 0.3, 1] as const;

export function Hero() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="relative overflow-hidden border-b border-border/60">
      <div className="pointer-events-none absolute inset-0 grid-bg" aria-hidden />

      <div className="container relative z-10 mx-auto max-w-7xl px-4 pb-16 pt-14 lg:pb-24 lg:pt-20">
        <div className="grid items-start gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-16 xl:gap-20">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: easeOut }}
            className="max-w-xl"
          >
            <p className="mb-6 font-mono text-sm text-brand">
              open source · typescript · MIT
            </p>

            <h1 className="font-display text-[clamp(2.5rem,5vw,4.25rem)] font-bold leading-[1.05] tracking-tight text-foreground">
              Write uploads once.
              <span className="mt-2 block text-brand">Run them anywhere.</span>
            </h1>

            <p className="mt-6 max-w-[42ch] text-lg leading-relaxed text-muted-foreground">
              One type-safe API for Cloudinary, S3, R2, and the providers you add next.
              Less SDK noise, more feature work.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button size="lg" asChild>
                <Link href="/docs">
                  Read the docs
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a
                  href="https://github.com/codewithveek/fluxmedia"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Github className="mr-2 h-4 w-4" />
                  View source
                </a>
              </Button>
            </div>

            <div className="mt-10 rounded-md border border-border bg-surface px-4 py-3 font-mono text-[0.8125rem]">
              <span className="text-muted-foreground">$ </span>
              <span className="text-foreground">pnpm add @fluxmedia/core @fluxmedia/s3</span>
            </div>
          </motion.div>

          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: easeOut, delay: 0.08 }}
            className="min-w-0"
          >
            <CodeComparison />
          </motion.div>
        </div>
      </div>
    </section>
  );
}


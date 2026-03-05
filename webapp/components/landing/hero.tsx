'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Star, Package } from 'lucide-react';
import { CodeComparison } from './code-comparison';
import { motion } from 'framer-motion';

export function Hero() {
  return (
    <section className="relative overflow-hidden grid-bg">
      <div className="container relative z-10 mx-auto px-4 max-w-7xl pt-24 pb-28 lg:pt-32 lg:pb-40">
        <div className="mx-auto max-w-3xl text-center mb-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Badge */}
            <div className="inline-flex items-center rounded-md border border-brand/20 bg-brand-muted px-3.5 py-1.5 text-sm font-medium text-brand mb-10">
              <span className="flex h-1.5 w-1.5 rounded-full bg-brand mr-2" />
              Open Source TypeScript Library
            </div>

            <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl leading-[1.1] mb-6">
              One API for all <br className="hidden sm:block" />
              <span className="text-brand">your media uploads</span>
            </h1>

            <p className="mt-4 text-lg text-muted-foreground sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
              Provider-agnostic media uploads for TypeScript. Upload to Cloudinary, S3, R2, and more
              with a single, unified interface. No lock-in. No rewrites.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" asChild>
                <Link href="https://docs.fluxmedia.dev">
                  Get Started <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="amber" asChild>
                <a
                  href="https://github.com/codewithveek/fluxmedia"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Star className="mr-2 h-4 w-4" />
                  Star on GitHub
                </a>
              </Button>
            </div>

            {/* Install command — terminal style */}
            <div className="mt-12 flex justify-center">
              <div className="terminal-window max-w-lg w-full text-left">
                <div className="terminal-bar">
                  <div className="terminal-dots">
                    <span />
                    <span />
                    <span />
                  </div>
                  <span className="text-xs text-muted-foreground">terminal</span>
                </div>
                <div className="terminal-body">
                  <p className="comment"># Install FluxMedia</p>
                  <p>
                    <span className="prompt">$ </span>
                    <span className="cmd">pnpm add @fluxmedia/core @fluxmedia/s3</span>
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
        >
          <CodeComparison />
        </motion.div>
      </div>

      {/* Subtle glow — no heavy gradient blobs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -z-10 w-[600px] h-[400px] opacity-15 pointer-events-none">
        <div className="absolute inset-0 bg-brand rounded-full blur-[160px]" />
      </div>
    </section>
  );
}

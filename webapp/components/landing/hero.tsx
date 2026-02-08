'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, ChevronRight, Package } from 'lucide-react';
import { CodeComparison } from './code-comparison';
import { motion } from 'framer-motion';

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-20 pb-24 lg:pt-28 lg:pb-36">
      <div className="container relative z-10 mx-auto px-4 max-w-7xl">
        <div className="mx-auto max-w-3xl text-center mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Link
              href="/changelog"
              className="inline-flex items-center rounded-full border border-indigo-500/20 bg-indigo-500/10 px-4 py-1.5 text-sm font-medium text-indigo-500 mb-8 backdrop-blur-sm hover:bg-indigo-500/15 transition-colors"
            >
              <span className="flex h-2 w-2 rounded-full bg-indigo-500 mr-2 animate-pulse"></span>
              v0.1.0 is now available
              <ChevronRight className="ml-1 h-3 w-3" />
            </Link>

            <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl mb-6">
              Switch providers, <br className="hidden sm:block" />
              <span className="bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
                not code.
              </span>
            </h1>

            <p className="mt-4 text-lg text-muted-foreground sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
              A unified, TypeScript-first media library for modern applications. Upload to
              Cloudinary, S3, R2, and more with a single API.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                className="w-full sm:w-auto font-semibold bg-indigo-500 hover:bg-indigo-600"
                asChild
              >
                <Link href="https://docs.fluxmedia.dev">
                  Get Started <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto border-border/60"
                asChild
              >
                <Link href="/playground">
                  <Package className="mr-2 h-4 w-4" />
                  Try Playground
                </Link>
              </Button>
            </div>

            {/* Install command */}
            <div className="mt-10 flex justify-center">
              <div className="flex items-center gap-3 px-5 py-2.5 rounded-full bg-zinc-900 border border-zinc-800 text-sm font-mono">
                <span className="text-zinc-500">$</span>
                <span className="text-zinc-300">pnpm add @fluxmedia/core @fluxmedia/s3</span>
                <button
                  className="text-zinc-500 hover:text-zinc-300 transition-colors"
                  onClick={() =>
                    navigator.clipboard.writeText('pnpm add @fluxmedia/core @fluxmedia/s3')
                  }
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                </button>
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

      {/* Abstract Background Elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -z-10 w-[1200px] h-[800px] opacity-40 dark:opacity-25 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/30 via-purple-500/10 to-transparent blur-[120px]" />
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
    </section>
  );
}

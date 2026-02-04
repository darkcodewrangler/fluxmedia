"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, ChevronRight, Star } from "lucide-react";
import { CodeComparison } from "./code-comparison";
import { motion } from "framer-motion";

export function Hero() {
    return (
        <section className="relative overflow-hidden pt-16 pb-20 lg:pt-24 lg:pb-32">
            <div className="container relative z-10 mx-auto px-4 max-w-7xl">
                <div className="mx-auto max-w-3xl text-center mb-16">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <div className="inline-flex items-center rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-sm font-medium text-indigo-500 mb-6 backdrop-blur-sm">
                            <span className="flex h-2 w-2 rounded-full bg-indigo-500 mr-2 animate-pulse"></span>
                            v0.1.0 is now available
                            <ChevronRight className="ml-1 h-3 w-3" />
                        </div>

                        <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-6xl mb-6">
                            Switch providers, <br className="hidden sm:block" />
                            <span className="text-indigo-500">not code.</span>
                        </h1>

                        <p className="mt-4 text-lg text-muted-foreground sm:text-xl max-w-2xl mx-auto mb-8 leading-relaxed">
                            A unified, TypeScript-first media library for modern applications.
                            Upload to Cloudinary, S3, R2, and more with a single API.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Button size="lg" className="w-full sm:w-auto font-semibold" asChild>
                                <Link href="/docs">
                                    Get Started <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                            <Button size="lg" variant="outline" className="w-full sm:w-auto border-border/50" asChild>
                                <Link href="/playground">
                                    Try Playground
                                </Link>
                            </Button>
                        </div>

                        <div className="mt-8 flex items-center justify-center space-x-4 text-sm text-muted-foreground">
                            <div className="flex items-center">
                                <Star className="h-4 w-4 mr-1 fill-yellow-500 text-yellow-500" />
                                <span className="font-medium text-foreground">1.2k</span>
                                <span className="ml-1">stars on GitHub</span>
                            </div>
                            <div className="h-4 w-px bg-border"></div>
                            <div>
                                <span className="font-medium text-foreground">5.4k</span> downloads/week
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
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -z-10 w-[1000px] h-[600px] opacity-30 dark:opacity-20 pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/20 via-background to-background blur-[100px]" />
            </div>
        </section>
    );
}

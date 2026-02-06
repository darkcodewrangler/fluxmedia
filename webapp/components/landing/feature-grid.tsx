"use client";

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
} from "lucide-react";
import { motion, type Variants } from "framer-motion";
import { useEffect, useState } from "react";
import { codeToHtml } from "shiki";

// Code snippet for the Unified API card
const UNIFIED_API_CODE = `// Works the same for ANY provider!
const uploader = new MediaUploader(
  new S3Provider({ ... })  // or Cloudinary, R2
);

await uploader.upload(file, {
  folder: "uploads",
  onProgress: (p) => console.log(p)
});`;

const features = [
    {
        title: "Unified API",
        description: "One interface for all providers. Switch from Cloudinary to S3 or R2 without rewriting a single line of upload logic.",
        icon: Layers,
        className: "md:col-span-2 md:row-span-2",
        highlight: true,
        hasCode: true,
    },
    {
        title: "TypeScript First",
        description: "Built with strict types for incredible DX. Full autocomplete for provider-specific configurations.",
        icon: Code2,
    },
    {
        title: "Tree-Shakeable",
        description: "Modular architecture. Core is tiny (<5KB). Only bundle the providers you use.",
        icon: Boxes,
    },
    {
        title: "Plugin System",
        description: "Extend with validation, optimization, metadata extraction, analytics, and retry plugins.",
        icon: Plug,
    },
    {
        title: "React Hooks",
        description: "Production-ready hooks for upload state, progress tracking, and error handling.",
        icon: Zap,
    },
    {
        title: "Multi-Provider",
        description: "Native support for S3, Cloudflare R2, Cloudinary, and extensible for custom providers.",
        icon: Cloud,
    },
    {
        title: "Image Transforms",
        description: "Resize, format conversion, and quality optimization with Cloudinary provider.",
        icon: Image,
    },
    {
        title: "Auto Retry",
        description: "Built-in retry plugin with exponential backoff for resilient uploads.",
        icon: RefreshCw,
    },
    {
        title: "Type-Safe Config",
        description: "Catch configuration errors at compile time, not runtime.",
        icon: ShieldCheck,
    },
];

const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.08,
        },
    },
};

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.4, ease: "easeOut" },
    },
};

// Component for the code snippet in Unified API card
function UnifiedApiCodeSnippet() {
    const [highlightedCode, setHighlightedCode] = useState("");

    useEffect(() => {
        async function highlight() {
            const html = await codeToHtml(UNIFIED_API_CODE, {
                lang: "typescript",
                theme: "github-dark",
            });
            setHighlightedCode(html);
        }
        highlight();
    }, []);

    return (
        <div className="mt-8 rounded-lg bg-zinc-900 border border-zinc-800 p-3 overflow-hidden">
            <div
                className="text-xs font-mono overflow-x-auto [&>pre]:bg-transparent! [&>pre]:p-0 [&>pre]:m-0"
                dangerouslySetInnerHTML={{
                    __html: highlightedCode || '<div class="text-zinc-500 text-xs">Loading...</div>'
                }}
            />
        </div>
    );
}

export function FeatureGrid() {
    return (
        <section className="py-24 lg:py-32 border-t border-border/40 bg-gradient-to-b from-background to-muted/30">
            <div className="container mx-auto px-4 max-w-7xl">
                <div className="max-w-3xl mx-auto text-center mb-16">
                    <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl mb-4">
                        Everything you need for media uploads
                    </h2>
                    <p className="text-lg text-muted-foreground">
                        FluxMedia handles the complexity of different providers so you can focus on building your app.
                    </p>
                </div>

                <motion.div
                    className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4"
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                >
                    {features.map((feature, i) => (
                        <motion.div
                            key={i}
                            variants={itemVariants}
                            className={`group relative overflow-hidden rounded-2xl border bg-card p-6 transition-all duration-300 hover:shadow-xl ${feature.highlight
                                ? "border-indigo-500/30 bg-gradient-to-br from-indigo-500/5 to-background"
                                : "border-border/50 hover:border-indigo-500/30"
                                } ${feature.className || ""}`}
                        >
                            <div className="flex flex-col h-full justify-between relative z-10">
                                <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl ${feature.highlight
                                    ? "bg-indigo-500 text-white"
                                    : "bg-indigo-500/10 text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white"
                                    } transition-colors duration-300`}>
                                    <feature.icon className="h-6 w-6" />
                                </div>
                                <div className="flex-1 mt-auto">
                                    <h3 className="mb-2 font-semibold tracking-tight text-foreground text-lg">
                                        {feature.title}
                                    </h3>
                                    <p className={`text-muted-foreground leading-relaxed ${feature.highlight ? "text-base" : "text-sm"}`}>
                                        {feature.description}
                                    </p>

                                    {/* Code snippet for Unified API card */}
                                    {feature.hasCode && <UnifiedApiCodeSnippet />}
                                </div>
                            </div>

                            {/* Gradient blob on hover */}
                            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-indigo-500/5 rounded-full blur-3xl group-hover:bg-indigo-500/10 transition-all duration-500" />
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}

"use client";

import { useEffect, useState } from "react";
import { codeToHtml } from "shiki";
import { Check, Copy, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

// Old way - verbose AWS SDK setup
const OLD_WAY = `// Traditional approach: AWS SDK v3 (Verbose)
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const client = new S3Client({
  region: "us-east-1",
  credentials: { accessKeyId: "...", secretAccessKey: "..." }
});

// Uploading requires manual stream handling & command setup
const command = new PutObjectCommand({
  Bucket: "my-bucket",
  Key: "uploads/avatar.png",
  Body: fileStream,
  ContentType: "image/png"
});

await client.send(command);`;

// FluxMedia with plugins
const PLUGIN_WAY = `// FluxMedia: With Plugins
import { MediaUploader } from "@fluxmedia/core";
import { S3Provider } from "@fluxmedia/s3";
import { 
  fileValidationPlugin, 
  loggerPlugin, 
  retryPlugin 
} from "@fluxmedia/plugins";

const uploader = new MediaUploader(
  new S3Provider({
    region: "us-east-1",
    bucket: "my-bucket",
    accessKeyId: "...",
    secretAccessKey: "..."
  })
);

// Register official plugins
await uploader.use(fileValidationPlugin({
  maxSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: ["image/*", "video/*"]
}));

await uploader.use(loggerPlugin());
await uploader.use(retryPlugin({ maxRetries: 3 }));

// Same API for S3, R2, or Cloudinary!
await uploader.upload(file, {
  folder: "uploads",
  metadata: { type: "avatar" }
});`;

// FluxMedia basic setup (without plugins)
const BASIC_WAY = `// FluxMedia: Basic Setup
import { MediaUploader } from "@fluxmedia/core";
import { S3Provider } from "@fluxmedia/s3";

const uploader = new MediaUploader(
  new S3Provider({
    region: "us-east-1",
    bucket: "my-bucket",
    accessKeyId: "...",
    secretAccessKey: "..."
  })
);

// Works the same for S3, R2, or Cloudinary!
await uploader.upload(file, {
  folder: "uploads",
  metadata: { type: "avatar" }
});`;

type Tab = "plugins" | "basic";

export function CodeComparison() {
    const [oldHtml, setOldHtml] = useState("");
    const [pluginHtml, setPluginHtml] = useState("");
    const [basicHtml, setBasicHtml] = useState("");
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState<Tab>("plugins");
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        async function highlight() {
            const [old, plugin, basic] = await Promise.all([
                codeToHtml(OLD_WAY, { lang: "typescript", theme: "github-dark" }),
                codeToHtml(PLUGIN_WAY, { lang: "typescript", theme: "github-dark" }),
                codeToHtml(BASIC_WAY, { lang: "typescript", theme: "github-dark" }),
            ]);
            setOldHtml(old);
            setPluginHtml(plugin);
            setBasicHtml(basic);
        }
        highlight();
    }, []);

    const copyCode = () => {
        const code = activeTab === "plugins" ? PLUGIN_WAY : BASIC_WAY;
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const currentHtml = activeTab === "plugins" ? pluginHtml : basicHtml;
    const collapsedHeight = 280;

    return (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8 max-w-6xl mx-auto">
            {/* Old Way */}
            <div className="rounded-2xl border border-border/50 bg-zinc-950 p-5 shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between mb-4 border-b border-zinc-800 pb-3">
                    <div className="flex space-x-2">
                        <div className="h-3 w-3 rounded-full bg-red-500/30" />
                        <div className="h-3 w-3 rounded-full bg-yellow-500/30" />
                        <div className="h-3 w-3 rounded-full bg-green-500/30" />
                    </div>
                    <span className="text-xs font-medium text-zinc-500">The Old Way</span>
                </div>
                <div
                    className="text-sm font-mono overflow-x-auto [&>pre]:bg-transparent! [&>pre]:p-0 opacity-60"
                    dangerouslySetInnerHTML={{ __html: oldHtml || "<div class='text-zinc-500'>Loading...</div>" }}
                />
            </div>

            {/* FluxMedia Way */}
            <div className="relative rounded-2xl border border-indigo-500/40 bg-zinc-950 p-5 shadow-2xl shadow-indigo-500/10 overflow-hidden ring-1 ring-indigo-500/20">
                <div className="flex items-center justify-between mb-4 border-b border-zinc-800 pb-3">
                    <div className="flex space-x-2">
                        <div className="h-3 w-3 rounded-full bg-red-500" />
                        <div className="h-3 w-3 rounded-full bg-yellow-500" />
                        <div className="h-3 w-3 rounded-full bg-green-500" />
                    </div>
                    <span className="text-xs font-medium text-indigo-400">FluxMedia Way</span>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-4">
                    <button
                        onClick={() => setActiveTab("plugins")}
                        className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all ${activeTab === "plugins"
                            ? "bg-indigo-500 text-white"
                            : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-300"
                            }`}
                    >
                        With Plugins
                    </button>
                    <button
                        onClick={() => setActiveTab("basic")}
                        className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all ${activeTab === "basic"
                            ? "bg-indigo-500 text-white"
                            : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-300"
                            }`}
                    >
                        Basic Setup
                    </button>
                </div>

                {/* Code with expand/collapse */}
                <div className="relative">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            style={{
                                maxHeight: isExpanded ? "none" : collapsedHeight,
                                overflow: "hidden"
                            }}
                            className="text-sm font-mono overflow-x-auto [&>pre]:bg-transparent! [&>pre]:p-0"
                            dangerouslySetInnerHTML={{ __html: currentHtml || "<div class='text-zinc-500'>Loading...</div>" }}
                        />
                    </AnimatePresence>

                    {/* Gradient overlay when collapsed */}
                    {!isExpanded && (
                        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-zinc-950 via-zinc-950/90 to-transparent pointer-events-none" />
                    )}
                </div>

                {/* See More / See Less button */}
                <div className="flex justify-center mt-2">
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="flex items-center gap-1 px-4 py-2 text-xs font-medium text-zinc-400 hover:text-indigo-400 transition-colors"
                    >
                        {isExpanded ? (
                            <>
                                <ChevronUp className="h-3 w-3" />
                                See Less
                            </>
                        ) : (
                            <>
                                <ChevronDown className="h-3 w-3" />
                                See More
                            </>
                        )}
                    </button>
                </div>

                {/* Copy button */}
                <Button
                    size="icon"
                    variant="ghost"
                    className="absolute top-4 right-4 h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-800"
                    onClick={copyCode}
                >
                    {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
            </div>
        </div>
    );
}

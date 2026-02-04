"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, ChevronRight, Play, RefreshCw, Terminal } from "lucide-react";
import { cn } from "@/lib/utils";

const PROVIDERS = [
    { id: "cloudinary", name: "Cloudinary", icon: "☁️" },
    { id: "s3", name: "AWS S3", icon: "📦" },
    { id: "r2", name: "Cloudflare R2", icon: "🌩️" },
];

const CODE_TEMPLATES: Record<string, string> = {
    cloudinary: `import { MediaUploader } from '@fluxmedia/core';
import { CloudinaryProvider } from '@fluxmedia/cloudinary';

const uploader = new MediaUploader(
  new CloudinaryProvider({
    cloudName: 'demo-cloud',
    apiKey: '***',
    apiSecret: '***'
  })
);

// Upload with image transformation
await uploader.upload(file, {
  folder: 'avatars',
  transformation: {
    width: 400,
    height: 400,
    fit: 'cover'
  }
});`,
    s3: `import { MediaUploader } from '@fluxmedia/core';
import { S3Provider } from '@fluxmedia/s3';

const uploader = new MediaUploader(
  new S3Provider({
    region: 'us-east-1',
    bucket: 'my-bucket',
    accessKeyId: '***',
    secretAccessKey: '***'
  })
);

// Standard upload
await uploader.upload(file, {
  folder: 'backups',
  metadata: { userId: '123' }
});`,
    r2: `import { MediaUploader } from '@fluxmedia/core';
import { R2Provider } from '@fluxmedia/r2';

const uploader = new MediaUploader(
  new R2Provider({
    accountId: '***',
    bucket: 'assets',
    accessKeyId: '***',
    secretAccessKey: '***'
  })
);

// Zero egress fee upload!
await uploader.upload(file, {
  folder: 'public-assets'
});`,
};

export default function PlaygroundPage() {
    const [activeProvider, setActiveProvider] = useState("cloudinary");
    const [isRunning, setIsRunning] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);

    const runCode = () => {
        setIsRunning(true);
        setLogs([]);

        // Simulate upload process
        setTimeout(() => setLogs(p => [...p, "> Initializing uploader..."]), 100);
        setTimeout(() => setLogs(p => [...p, `> Configuring ${PROVIDERS.find(p => p.id === activeProvider)?.name} provider...`]), 600);
        setTimeout(() => setLogs(p => [...p, "> Starting upload..."]), 1200);
        setTimeout(() => setLogs(p => [...p, "> Uploading: 45%"]), 1800);
        setTimeout(() => setLogs(p => [...p, "> Uploading: 100%"]), 2400);
        setTimeout(() => {
            setLogs(p => [...p, `✅ Upload complete! URL: https://${activeProvider}.cdn/assets/image-123.jpg`]);
            setIsRunning(false);
        }, 3000);
    };

    return (
        <div className="container py-8 max-w-7xl h-[calc(100vh-3.5rem)] flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Playground</h1>
                    <p className="text-muted-foreground">Test FluxMedia with different providers right in your browser.</p>
                </div>
                <Button onClick={runCode} disabled={isRunning} className="w-32">
                    {isRunning ? (
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Play className="mr-2 h-4 w-4" />
                    )}
                    Run
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
                {/* Left: Configuration */}
                <div className="space-y-6">
                    <div className="rounded-xl border bg-card p-4 h-full">
                        <h3 className="font-medium mb-4 flex items-center">
                            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-500/10 text-indigo-500 mr-2 text-xs">1</span>
                            Select Provider
                        </h3>
                        <div className="space-y-2">
                            {PROVIDERS.map((provider) => (
                                <button
                                    key={provider.id}
                                    onClick={() => setActiveProvider(provider.id)}
                                    className={cn(
                                        "w-full flex items-center justify-between p-3 rounded-lg border transition-all text-sm",
                                        activeProvider === provider.id
                                            ? "border-indigo-500 bg-indigo-500/5 ring-1 ring-indigo-500/20"
                                            : "border-border hover:bg-muted/50"
                                    )}
                                >
                                    <div className="flex items-center">
                                        <span className="mr-3 text-xl">{provider.icon}</span>
                                        <span className="font-medium">{provider.name}</span>
                                    </div>
                                    {activeProvider === provider.id && (
                                        <Check className="h-4 w-4 text-indigo-500" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Center: Code Editor Mock */}
                <div className="lg:col-span-2 flex flex-col gap-6 min-h-0">
                    <div className="flex-1 rounded-xl border bg-zinc-950 overflow-hidden flex flex-col shadow-inner">
                        <div className="bg-zinc-900 px-4 py-2 border-b border-zinc-800 flex items-center justify-between">
                            <span className="text-xs text-zinc-400 font-mono">example.ts</span>
                            <div className="flex space-x-1.5">
                                <div className="w-2.5 h-2.5 rounded-full bg-red-500/20"></div>
                                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20"></div>
                                <div className="w-2.5 h-2.5 rounded-full bg-green-500/20"></div>
                            </div>
                        </div>
                        <div className="p-4 font-mono text-sm overflow-auto flex-1">
                            <pre className="text-zinc-300">
                                <code>{CODE_TEMPLATES[activeProvider]}</code>
                            </pre>
                        </div>
                    </div>

                    {/* Bottom: Console Output */}
                    <div className="h-48 rounded-xl border bg-black overflow-hidden flex flex-col font-mono text-xs">
                        <div className="bg-zinc-900/50 px-4 py-2 border-b border-zinc-900 flex items-center">
                            <Terminal className="h-3 w-3 mr-2 text-zinc-500" />
                            <span className="text-zinc-500">Console</span>
                        </div>
                        <div className="p-4 space-y-1 overflow-auto flex-1">
                            {logs.length === 0 ? (
                                <span className="text-zinc-600 italic">Quick tip: Click 'Run' to simulate an upload.</span>
                            ) : (
                                logs.map((log, i) => (
                                    <div key={i} className={cn(
                                        "font-mono",
                                        log.includes("✅") ? "text-green-400" :
                                            log.includes("Error") ? "text-red-400" : "text-zinc-400"
                                    )}>
                                        {log}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

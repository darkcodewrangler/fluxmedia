import {
    Cloud,
    Code2,
    Layers,
    Zap,
    ShieldCheck,
    Boxes
} from "lucide-react";

const features = [
    {
        title: "Unified API",
        description: "One interface for all providers. Switch from Cloudinary to S3 in seconds without rewriting upload logic.",
        icon: Layers,
        className: "lg:col-span-2 lg:row-span-2",
    },
    {
        title: "TypeScript First",
        description: "Built with strict types for incredible DX. Autocomplete for provider-specific config.",
        icon: Code2,
        className: "lg:col-span-1",
    },
    {
        title: "Tree-Shakeable",
        description: "Modular architecture. Core is tiny (<5KB). Only bundle the providers you actually use.",
        icon: Boxes,
        className: "lg:col-span-1",
    },
    {
        title: "React Integration",
        description: "Production-ready hooks for upload state, progress tracking, and error handling.",
        icon: Zap,
        className: "lg:col-span-2",
    },
    {
        title: "Type-Safe Config",
        description: "Catch configuration errors at compile time, not runtime.",
        icon: ShieldCheck,
        className: "lg:col-span-1",
    },
    {
        title: "Multi-Provider",
        description: "Support for S3, R2, Cloudinary, and local filesystem out of the box.",
        icon: Cloud,
        className: "lg:col-span-1",
    }
];

export function FeatureGrid() {
    return (
        <section className="py-20 lg:py-32 border-t border-border/40 bg-muted/20">
            <div className="container mx-auto px-4 max-w-7xl">
                <div className="max-w-3xl mx-auto text-center mb-16">
                    <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl mb-4">
                        Everything you need for media uploads
                    </h2>
                    <p className="text-lg text-muted-foreground">
                        FluxMedia handles the complexity of different providers so you can focus on building your app.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 lg:auto-rows-[180px]">
                    {features.map((feature, i) => (
                        <div
                            key={i}
                            className={`group relative overflow-hidden rounded-2xl border border-border/50 bg-background p-6 hover:shadow-lg transition-all duration-300 hover:border-indigo-500/30 ${feature.className}`}
                        >
                            <div className="flex flex-col h-full justify-between relative z-10">
                                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white transition-colors duration-300">
                                    <feature.icon className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="mb-2 font-semibold tracking-tight text-foreground text-lg">
                                        {feature.title}
                                    </h3>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        {feature.description}
                                    </p>
                                </div>
                            </div>

                            {/* Subtle gradient blob on hover */}
                            <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-all duration-500" />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

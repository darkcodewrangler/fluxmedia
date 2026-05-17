import { Hero } from '@/components/landing/hero';
import { FeatureGrid } from '@/components/landing/feature-grid';
import { ProvidersSection } from '@/components/landing/providers-section';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, Github } from 'lucide-react';
import { codeToHtml } from 'shiki';

const UNIFIED_API_CODE = `// Same code for ANY provider
const uploader = new MediaUploader(
  new S3Provider({ ... })  // or Cloudinary, R2
);

await uploader.upload(file, {
  folder: "uploads",
  onProgress: (p) => console.log(p)
});`;

export default async function Home() {
  const unifiedApiCodeHtml = await codeToHtml(UNIFIED_API_CODE, {
    lang: 'typescript',
    themes: {
      light: 'github-light',
      dark: 'github-dark',
    },
    defaultColor: false,
  });

  return (
    <>
      <Hero />
      <FeatureGrid unifiedApiCodeHtml={unifiedApiCodeHtml} />
      <ProvidersSection />

      <section className="border-t border-border/60 bg-surface py-20 lg:py-24">
        <div className="container mx-auto flex max-w-7xl flex-col gap-8 px-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <h2 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Ship your first upload in minutes
            </h2>
            <p className="mt-3 text-lg leading-relaxed text-muted-foreground">
              Docs, examples, and a playground. Everything you need to wire FluxMedia into your
              stack tonight.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button size="lg" asChild>
              <Link href="/docs">
                Open documentation
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
                Star on GitHub
              </a>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}

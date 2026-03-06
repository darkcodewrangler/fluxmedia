import { Hero } from '@/components/landing/hero';
import { FeatureGrid } from '@/components/landing/feature-grid';
import { ProvidersSection } from '@/components/landing/providers-section';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { BookOpen, Github } from 'lucide-react';
import { codeToHtml } from 'shiki';

const UNIFIED_API_CODE = `// Same code for ANY provider!
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

      {/* CTA Section */}
      <section className="py-20 lg:py-28 border-t border-border/40 grid-bg">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl mb-4">
            Ready to simplify your media uploads?
          </h2>
          <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
            Join developers building faster with FluxMedia. Get started in minutes with
            comprehensive docs and examples.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/docs">
                <BookOpen className="mr-2 h-4 w-4" />
                Read the Docs
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a
                href="https://github.com/codewithveek/fluxmedia"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="mr-2 h-4 w-4" />
                View on GitHub
              </a>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}

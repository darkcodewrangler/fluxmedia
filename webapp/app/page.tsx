import { Hero } from "@/components/landing/hero";
import { FeatureGrid } from "@/components/landing/feature-grid";
import { ProvidersSection } from "@/components/landing/providers-section";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { BookOpen, Github } from "lucide-react";

export default function Home() {
  return (
    <>
      <Hero />
      <FeatureGrid />
      <ProvidersSection />

      {/* CTA Section */}
      <section className="py-24 lg:py-32 border-t border-border/40 bg-gradient-to-b from-muted/30 to-background">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl mb-4">
            Ready to simplify your media uploads?
          </h2>
          <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
            Join developers building faster with FluxMedia. Get started in minutes with comprehensive documentation and examples.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="font-semibold bg-indigo-500 hover:bg-indigo-600" asChild>
              <Link href="/docs">
                <BookOpen className="mr-2 h-4 w-4" />
                Read the Docs
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href="https://github.com/fluxmedia/fluxmedia" target="_blank" rel="noopener noreferrer">
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

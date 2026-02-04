import { Hero } from "@/components/landing/hero";
import { FeatureGrid } from "@/components/landing/feature-grid";

export default function Home() {
  return (
    <>
      <Hero />
      <FeatureGrid />
      <div className="py-24 text-center border-t border-border/40">
        <div className="container">
          <h2 className="text-2xl font-bold mb-4">Ready to start?</h2>
          <p className="text-muted-foreground mb-8">Join thousands of developers building faster with FluxMedia.</p>
          {/* CTA buttons are already in Hero, no need to duplicate excessively */}
        </div>
      </div>
    </>
  );
}

import Link from 'next/link';
import { UploadCloud } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-border/60 bg-surface pt-16 pb-10 px-4 md:px-6">
      <div className="container max-w-screen-xl mx-auto">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:gap-12">
          <div className="col-span-2 md:col-span-1 space-y-4">
            <div className="flex items-center space-x-2.5">
              <UploadCloud className="h-5 w-5 text-brand" />
              <span className="font-bold tracking-tight">FluxMedia</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-[240px]">
              Switch providers, not code. The TypeScript-first media library for modern
              applications.
            </p>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
              Product
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link
                  href="/docs"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Documentation
                </Link>
              </li>
              <li>
                <Link
                  href="/playground"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Playground
                </Link>
              </li>
              <li>
                <Link
                  href="/changelog"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Changelog
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
              Resources
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link
                  href="/blog"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Blog
                </Link>
              </li>
              <li>
                <Link
                  href="https://github.com/codewithveek/fluxmedia"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  GitHub
                </Link>
              </li>
              <li>
                <Link
                  href="https://www.npmjs.com/package/@fluxmedia/core"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  NPM
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
              Legal
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link
                  href="/privacy"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href="/license"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  MIT License
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-14 pt-6 border-t border-border/40 text-xs text-muted-foreground text-center">
          &copy; {new Date().getFullYear()} FluxMedia Contributors. Built with TypeScript.
        </div>
      </div>
    </footer>
  );
}

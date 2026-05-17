import Link from 'next/link';
import { FluxMediaLogo } from '@/components/brand/fluxmedia-logo';

const columns = [
  {
    title: 'Product',
    links: [
      { href: '/docs', label: 'Documentation' },
      { href: '/playground', label: 'Playground' },
      { href: '/changelog', label: 'Changelog' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { href: '/blog', label: 'Blog' },
      { href: 'https://github.com/codewithveek/fluxmedia', label: 'GitHub' },
      { href: 'https://www.npmjs.com/package/@fluxmedia/core', label: 'NPM' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { href: '/privacy', label: 'Privacy Policy' },
      { href: '/terms', label: 'Terms of Service' },
      { href: '/license', label: 'MIT License' },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-border/60 bg-surface px-4 pb-10 pt-14 md:px-6">
      <div className="container mx-auto max-w-7xl">
        <div className="flex flex-col gap-12 lg:flex-row lg:justify-between">
          <div className="max-w-xs space-y-4">
            <FluxMediaLogo />
            <p className="text-sm leading-relaxed text-muted-foreground">
              TypeScript-first media uploads with one API across Cloudinary, S3, R2, and more.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 sm:gap-14">
            {columns.map((col) => (
              <div key={col.title}>
                <h4 className="mb-4 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  {col.title}
                </h4>
                <ul className="space-y-2.5 text-sm">
                  {col.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <p className="mt-14 border-t border-border/50 pt-6 text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} FluxMedia Contributors. Built with TypeScript.
        </p>
      </div>
    </footer>
  );
}

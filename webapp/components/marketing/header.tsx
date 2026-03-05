'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Github, UploadCloud, Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ThemeToggle } from '@/components/theme-toggle';

export function Header({ stats }: { stats?: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setMobileMenuOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const navLinks = [
    { href: '/docs', label: 'Docs' },
    { href: '/playground', label: 'Playground' },
    { href: '/blog', label: 'Blog' },
    { href: '/changelog', label: 'Changelog' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-14 max-w-screen-2xl items-center px-4 md:px-6">
        <Link href="/" className="mr-8 flex items-center space-x-2.5">
          <UploadCloud className="h-5 w-5 text-brand" />
          <span className="font-bold text-base tracking-tight">FluxMedia</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6 text-sm">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex flex-1 items-center justify-end space-x-3">
          {stats}
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            asChild
            className="hidden sm:inline-flex text-muted-foreground hover:text-foreground"
          >
            <Link href="https://github.com/codewithveek/fluxmedia" target="_blank" rel="noreferrer">
              <Github className="h-4 w-4" />
              <span className="sr-only">GitHub</span>
            </Link>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-muted-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            <span className="sr-only">Toggle menu</span>
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border/40 bg-background">
          <nav className="container flex flex-col py-4 px-4 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-muted-foreground hover:text-foreground py-2.5 px-3 rounded-md hover:bg-accent transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-2 mt-2 border-t border-border/40">
              <Link
                href="https://github.com/codewithveek/fluxmedia"
                target="_blank"
                rel="noreferrer"
                className="flex items-center space-x-2 text-sm text-muted-foreground py-2.5 px-3"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Github className="h-4 w-4" />
                <span>GitHub</span>
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

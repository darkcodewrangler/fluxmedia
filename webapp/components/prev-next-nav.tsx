import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export interface PrevNextLink {
  href: string;
  title: string;
}

interface PrevNextNavProps {
  prev?: PrevNextLink | null;
  next?: PrevNextLink | null;
}

export function PrevNextNav({ prev, next }: PrevNextNavProps) {
  if (!prev && !next) return null;

  return (
    <nav
      className="mt-14 grid grid-cols-1 gap-6 border-t border-border/60 pt-10 sm:grid-cols-2"
      aria-label="Page navigation"
    >
      {prev ? (
        <Link
          href={prev.href}
          className="group flex flex-col gap-1 transition-colors hover:text-brand"
        >
          <span className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
            <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
            Previous
          </span>
          <span className="text-sm font-semibold text-foreground group-hover:text-brand line-clamp-2">
            {prev.title}
          </span>
        </Link>
      ) : (
        <div />
      )}

      {next ? (
        <Link
          href={next.href}
          className="group flex flex-col items-start gap-1 text-left transition-colors hover:text-brand sm:items-end sm:text-right"
        >
          <span className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
            Next
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </span>
          <span className="text-sm font-semibold text-foreground group-hover:text-brand line-clamp-2">
            {next.title}
          </span>
        </Link>
      ) : (
        <div />
      )}
    </nav>
  );
}

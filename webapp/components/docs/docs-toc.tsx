'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowUp, MessageSquare, PencilLine } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DocHeading } from '@/lib/docs';

interface DocsTocProps {
  headings: DocHeading[];
  editUrl: string;
  feedbackUrl: string;
  lastUpdated: string;
}

export function DocsToc({ headings, editUrl, feedbackUrl, lastUpdated }: DocsTocProps) {
  const [activeHeadingId, setActiveHeadingId] = useState<string>(headings[0]?.id ?? '');

  useEffect(() => {
    if (headings.length === 0) return;

    const updateFromHash = () => {
      const hash = window.location.hash.slice(1);
      if (hash) {
        setActiveHeadingId(hash);
      }
    };

    updateFromHash();
    window.addEventListener('hashchange', updateFromHash);

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visible[0]?.target?.id) {
          setActiveHeadingId(visible[0].target.id);
        }
      },
      {
        rootMargin: '-92px 0px -70% 0px',
        threshold: [0, 1],
      }
    );

    const headingElements = headings
      .map((heading) => document.getElementById(heading.id))
      .filter((element): element is HTMLElement => Boolean(element));

    headingElements.forEach((element) => observer.observe(element));

    return () => {
      observer.disconnect();
      window.removeEventListener('hashchange', updateFromHash);
    };
  }, [headings]);

  const formattedLastUpdated = useMemo(() => {
    const parsedDate = new Date(lastUpdated);
    if (Number.isNaN(parsedDate.getTime())) {
      return 'Unknown';
    }

    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }).format(parsedDate);
  }, [lastUpdated]);

  return (
    <aside className="hidden xl:block">
      <div className="sticky top-24">
        <div className="flex min-h-0 flex-col gap-6 max-h-[calc(100vh-8rem)]">
          <div className="flex min-h-0 flex-1 flex-col rounded-md border border-border bg-surface p-4">
            <h2 className="font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground">
              On this page
            </h2>

            <nav className="mt-3 min-h-0 flex-1 overflow-y-auto pr-1 pb-3">
              <ul className="space-y-1.5">
                {headings.map((heading) => (
                  <li key={heading.id}>
                    <a
                      href={`#${heading.id}`}
                      className={cn(
                        'block rounded-sm px-2.5 py-1.5 text-sm leading-5 transition-colors',
                        heading.level === 3 ? 'pl-5' : '',
                        activeHeadingId === heading.id
                          ? 'bg-brand-muted font-medium text-brand'
                          : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground'
                      )}
                    >
                      {heading.text}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            {headings.length > 0 ? (
              <button
                type="button"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="mt-4 inline-flex shrink-0 items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowUp className="h-3.5 w-3.5" />
                Scroll to top
              </button>
            ) : null}
          </div>

          <div className="shrink-0 rounded-md border border-border bg-surface p-4 text-sm">
            <a
              href={feedbackUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
            >
              <MessageSquare className="h-4 w-4" />
              Question? Give us feedback
            </a>

            <a
              href={editUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
            >
              <PencilLine className="h-4 w-4" />
              Edit this page
            </a>

            <p className="mt-3 border-t border-border/70 pt-3 text-xs text-muted-foreground">
              Last updated on {formattedLastUpdated}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}

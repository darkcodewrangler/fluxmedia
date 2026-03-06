'use client';

import { useState } from 'react';
import { Check, ChevronDown, Copy, ExternalLink } from 'lucide-react';

interface DocsPageActionsProps {
  title: string;
  markdown: string;
  canonicalUrl: string;
}

type CopiedTarget = 'url' | 'markdown' | null;

function buildAssistantPrompt(title: string, canonicalUrl: string): string {
  return `I am reading "${title}" from FluxMedia docs: ${canonicalUrl}\n\nPlease help me understand this page, summarize key points, and suggest implementation tips.`;
}

export function DocsPageActions({ title, markdown, canonicalUrl }: DocsPageActionsProps) {
  const [copiedTarget, setCopiedTarget] = useState<CopiedTarget>(null);

  const assistantPrompt = buildAssistantPrompt(title, canonicalUrl);
  const chatGptUrl = `https://chatgpt.com/?q=${encodeURIComponent(assistantPrompt)}`;
  const claudeUrl = `https://claude.ai/new?q=${encodeURIComponent(assistantPrompt)}`;

  const copyText = async (text: string, target: CopiedTarget) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedTarget(target);
      window.setTimeout(() => setCopiedTarget(null), 1800);
    } catch {
      setCopiedTarget(null);
    }
  };

  return (
    <details className="group relative">
      <summary className="flex cursor-pointer list-none items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent/40 [&::-webkit-details-marker]:hidden">
        <Copy className="h-4 w-4 text-muted-foreground" />
        Copy page
        <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180" />
      </summary>

      <div className="absolute right-0 z-30 mt-2 w-68 rounded-lg border border-border bg-popover p-2 shadow-xl">
        {/* <button
          type="button"
          onClick={() => copyText(canonicalUrl, 'url')}
          className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm text-popover-foreground transition-colors hover:bg-accent/60"
        >
          <span>Copy page URL</span>
          {copiedTarget === 'url' ? <Check className="h-4 w-4 text-brand" /> : null}
        </button> */}

        <button
          type="button"
          onClick={() => copyText(markdown, 'markdown')}
          className="flex gap-2 w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm text-popover-foreground transition-colors hover:bg-accent/60"
        >
          {copiedTarget === 'markdown' ? (
            <Check className="h-4 w-4 text-brand" />
          ) : (
            <Copy className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="flex flex-col gap-1">
            <span className="font-semibold">Copy page</span>
            <span className="text-xs text-muted-foreground">Copy page as Markdown for LLMs</span>
          </span>
        </button>

        <a
          href={chatGptUrl}
          target="_blank"
          rel="noreferrer"
          className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm text-popover-foreground transition-colors hover:bg-accent/60"
        >
          <span>Open in ChatGPT</span>
          <ExternalLink className="h-4 w-4 text-muted-foreground" />
        </a>

        <a
          href={claudeUrl}
          target="_blank"
          rel="noreferrer"
          className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm text-popover-foreground transition-colors hover:bg-accent/60"
        >
          <span>Open in Claude</span>
          <ExternalLink className="h-4 w-4 text-muted-foreground" />
        </a>
      </div>
    </details>
  );
}

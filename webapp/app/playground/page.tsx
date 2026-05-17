'use client';

import { Loader2, ExternalLink, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

const stackblitzUrl =
  'https://stackblitz.com/github/codewithveek/fluxmedia/tree/main/examples/basic-node?embed=1&file=index.js&hideNavigation=1&theme=dark&view=editor';

export default function PlaygroundPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const handleRetry = () => {
    setLoading(true);
    setError(false);
    const iframe = document.querySelector<HTMLIFrameElement>('#playground-frame');
    if (iframe) {
      iframe.src = iframe.src;
    }
  };

  return (
    <div className="container mx-auto flex max-w-6xl flex-col px-4 py-10 lg:py-14">
      <header className="page-header mb-8 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="page-kicker">interactive</p>
          <h1 className="font-display">Playground</h1>
          <p className="page-lede">
            Run FluxMedia in a live Node environment. Edit providers, plugins, and uploads in place.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button variant="outline" size="sm" onClick={handleRetry} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Reload
          </Button>
          <Button variant="outline" size="sm" asChild className="gap-2">
            <a
              href="https://stackblitz.com/github/codewithveek/fluxmedia/tree/main/examples/basic-node"
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="h-4 w-4" />
              Open editor
            </a>
          </Button>
        </div>
      </header>

      <p className="mb-5 max-w-prose rounded-md border border-border bg-surface px-4 py-3 font-mono text-sm text-muted-foreground">
        Tip: try swapping S3 for Cloudinary in the example. The upload call stays the same.
      </p>

      <div className="relative min-h-[32rem] flex-1 overflow-hidden rounded-md border border-border bg-surface">
        {loading && !error && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-surface text-muted-foreground">
            <Loader2 className="mb-4 h-10 w-10 animate-spin" />
            <span className="text-lg text-foreground">Loading WebContainer</span>
            <span className="mt-2 text-sm">First load can take 15–20 seconds</span>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-surface">
            <span className="mb-4 text-lg text-foreground">Could not load playground</span>
            <Button onClick={handleRetry} variant="outline">
              Try again
            </Button>
          </div>
        )}

        <iframe
          id="playground-frame"
          src={stackblitzUrl}
          className="relative z-10 h-[32rem] w-full border-0"
          title="FluxMedia Playground"
          onLoad={() => setLoading(false)}
          onError={() => {
            setLoading(false);
            setError(true);
          }}
          allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
          sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
        />
      </div>

      <p className="mt-4 text-center font-mono text-xs text-muted-foreground">
        Powered by{' '}
        <a
          href="https://stackblitz.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand hover:underline"
        >
          StackBlitz WebContainers
        </a>
      </p>
    </div>
  );
}

import { getProjectMetrics, formatMetric } from '@/lib/metrics';
import { Star, Download } from 'lucide-react';

export async function ProjectStats() {
  const { stars, downloads } = await getProjectMetrics();

  return (
    <div className="hidden md:flex items-center space-x-3 text-xs font-medium text-muted-foreground bg-surface-raised px-3 py-1.5 rounded-md border border-border/40">
      <a
        href="https://github.com/codewithveek/fluxmedia"
        target="_blank"
        rel="noreferrer"
        className="flex items-center hover:text-foreground transition-colors"
      >
        <Star className="mr-1 h-3.5 w-3.5 text-amber" />
        {formatMetric(stars)}
      </a>
      <div className="h-3 w-px bg-border" />
      <a
        href="https://www.npmjs.com/package/@fluxmedia/core"
        target="_blank"
        rel="noreferrer"
        className="flex items-center hover:text-foreground transition-colors"
      >
        <Download className="mr-1 h-3.5 w-3.5 text-brand" />
        {formatMetric(downloads)}
      </a>
    </div>
  );
}

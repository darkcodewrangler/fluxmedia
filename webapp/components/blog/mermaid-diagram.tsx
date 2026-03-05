'use client';

import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

interface MermaidDiagramProps {
  chart: string;
}

// Initialize mermaid with dark theme
mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  themeVariables: {
    primaryColor: '#00e5a0',
    primaryTextColor: '#060609',
    primaryBorderColor: '#00c98c',
    lineColor: '#00e5a066',
    secondaryColor: '#0d0d14',
    tertiaryColor: '#12121c',
    background: '#060609',
    mainBkg: '#0d0d14',
    secondBkg: '#12121c',
    nodeBorder: '#00e5a0',
    clusterBkg: '#0d0d14',
    clusterBorder: '#00c98c',
    titleColor: '#f5f5f5',
    edgeLabelBackground: '#0d0d14',
  },
  flowchart: {
    htmlLabels: true,
    curve: 'basis',
  },
});

export function MermaidDiagram({ chart }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    async function renderChart() {
      if (!containerRef.current || !chart) return;

      try {
        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
        const { svg: renderedSvg } = await mermaid.render(id, chart);
        setSvg(renderedSvg);
        setError('');
      } catch (err) {
        console.error('Mermaid rendering error:', err);
        setError('Failed to render diagram');
      }
    }

    renderChart();
  }, [chart]);

  if (error) {
    return (
      <div className="my-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
        {error}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="my-6 p-4 rounded-lg bg-surface border border-border overflow-x-auto flex justify-center"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

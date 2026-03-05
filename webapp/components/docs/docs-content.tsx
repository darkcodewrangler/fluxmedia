import './docs-content.css';

interface DocsContentProps {
  title: string;
  content: string;
}

export function DocsContent({ content }: DocsContentProps) {
  return (
    <article
      className="docs-content prose prose-invert max-w-none"
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}

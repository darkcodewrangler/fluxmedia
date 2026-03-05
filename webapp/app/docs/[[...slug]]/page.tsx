import { getDocBySlug, getAllDocSlugs } from '@/lib/docs';
import { notFound } from 'next/navigation';
import { DocsContent } from '@/components/docs/docs-content';

export async function generateStaticParams() {
  const slugs = getAllDocSlugs();
  // Include the index page (empty slug)
  const params = [
    { slug: [''] },
    ...slugs.filter((s) => s !== 'index').map((slug) => ({ slug: [slug] })),
  ];
  return params;
}

interface Props {
  params: Promise<{ slug?: string[] }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const docSlug = slug?.[0] || '';
  const doc = await getDocBySlug(docSlug);

  return {
    title: doc ? `${doc.title} - FluxMedia Docs` : 'FluxMedia Documentation',
    description: `FluxMedia documentation - ${doc?.title || 'Provider-agnostic media uploads for TypeScript'}`,
  };
}

export default async function DocsPage({ params }: Props) {
  const { slug } = await params;
  const docSlug = slug?.[0] || '';
  const doc = await getDocBySlug(docSlug);

  if (!doc) {
    notFound();
  }

  return <DocsContent title={doc.title} content={doc.content} />;
}

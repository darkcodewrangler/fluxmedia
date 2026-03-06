import type { Metadata } from 'next';
import Link from 'next/link';
import {
  getDocBySlug,
  getAllDocSlugs,
  getDocPrevNext,
  getDocBreadcrumbs,
} from '@/lib/docs';
import { notFound } from 'next/navigation';
import { DocsContent } from '@/components/docs/docs-content';
import { DocsToc } from '@/components/docs/docs-toc';
import { DocsPageActions } from '@/components/docs/docs-page-actions';
import { PrevNextNav } from '@/components/prev-next-nav';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.fluxmedia.dev';
const docsRepositoryBase = 'https://github.com/codewithveek/fluxmedia/blob/main/webapp';

function toDocPath(slug: string): string {
  return slug === '' ? '/docs' : `/docs/${slug}`;
}

function toJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

export async function generateStaticParams() {
  const slugs = getAllDocSlugs();
  // Include the index page (empty slug)
  const params = [{ slug: [] }, ...slugs.filter(Boolean).map((slug) => ({ slug: [slug] }))];
  return params;
}

interface Props {
  params: Promise<{ slug?: string[] }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const docSlug = slug?.[0] || '';
  const doc = await getDocBySlug(docSlug);

  if (!doc) {
    return {
      title: 'FluxMedia Documentation',
      description: 'Unified media uploads for TypeScript applications.',
      alternates: {
        canonical: '/docs',
      },
      robots: {
        index: false,
        follow: true,
      },
    } satisfies Metadata;
  }

  const canonicalPath = toDocPath(docSlug);
  const canonicalUrl = `${siteUrl}${canonicalPath}`;
  const pageTitle = `${doc.title} | FluxMedia Docs`;

  return {
    title: {
      absolute: pageTitle,
    },
    description: doc.description,
    keywords: [
      'FluxMedia docs',
      'TypeScript uploads',
      'Cloudinary',
      'AWS S3',
      'Cloudflare R2',
      'media upload API',
    ],
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      type: 'article',
      url: canonicalUrl,
      title: pageTitle,
      description: doc.description,
      siteName: 'FluxMedia',
      images: [`${siteUrl}/fluxmedia-logo.svg`],
    },
    twitter: {
      card: 'summary_large_image',
      title: pageTitle,
      description: doc.description,
      images: [`${siteUrl}/fluxmedia-logo.svg`],
    },
    robots: {
      index: true,
      follow: true,
    },
  } satisfies Metadata;
}

export default async function DocsPage({ params }: Props) {
  const { slug } = await params;
  const docSlug = slug?.[0] || '';
  const doc = await getDocBySlug(docSlug);

  if (!doc) {
    notFound();
  }

  const { prev, next } = getDocPrevNext(docSlug);
  const breadcrumbs = getDocBreadcrumbs(docSlug);
  const canonicalPath = toDocPath(docSlug);
  const canonicalUrl = `${siteUrl}${canonicalPath}`;
  const editUrl = `${docsRepositoryBase}/${doc.sourcePath}`;
  const feedbackUrl = `https://github.com/codewithveek/fluxmedia/issues/new?labels=documentation,feedback&title=${encodeURIComponent(`[Docs] Feedback: ${doc.title}`)}&body=${encodeURIComponent(`Page: ${canonicalUrl}\n\nWhat can we improve?`)}`;

  const breadcrumbItems = [
    {
      name: 'Documentation',
      item: `${siteUrl}/docs`,
    },
    ...breadcrumbs.map((crumb) => ({
      name: crumb.title,
      item: `${siteUrl}${toDocPath(crumb.slug)}`,
    })),
  ];

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbItems.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.item,
    })),
  };

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: doc.title,
    description: doc.description,
    dateModified: doc.lastModified,
    url: canonicalUrl,
    mainEntityOfPage: canonicalUrl,
    author: {
      '@type': 'Organization',
      name: 'FluxMedia',
    },
    publisher: {
      '@type': 'Organization',
      name: 'FluxMedia',
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}/fluxmedia-logo-mark.svg`,
      },
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLd(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLd(articleJsonLd) }}
      />

      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/docs" className="transition-colors hover:text-foreground">
              Docs
            </Link>
            {breadcrumbs.map((crumb, index) => {
              const href = toDocPath(crumb.slug);
              const isLast = index === breadcrumbs.length - 1;
              return (
                <span key={`${crumb.slug}-${crumb.title}`} className="flex items-center gap-2">
                  <span>/</span>
                  {isLast ? (
                    <span className="font-medium text-foreground">{crumb.title}</span>
                  ) : (
                    <Link href={href} className="transition-colors hover:text-foreground">
                      {crumb.title}
                    </Link>
                  )}
                </span>
              );
            })}
          </nav>

          <DocsPageActions title={doc.title} markdown={doc.markdown} canonicalUrl={canonicalUrl} />
        </div>

        <div className="xl:grid xl:grid-cols-[minmax(0,1fr)_17rem] xl:gap-10">
          <div className="min-w-0 max-w-4xl">
            <DocsContent title={doc.title} content={doc.content} />
            <PrevNextNav
              prev={
                prev
                  ? { href: prev.slug === '' ? '/docs' : `/docs/${prev.slug}`, title: prev.title }
                  : null
              }
              next={
                next
                  ? { href: next.slug === '' ? '/docs' : `/docs/${next.slug}`, title: next.title }
                  : null
              }
            />
          </div>

          <DocsToc
            headings={doc.headings}
            editUrl={editUrl}
            feedbackUrl={feedbackUrl}
            lastUpdated={doc.lastModified}
          />
        </div>
      </div>
    </>
  );
}

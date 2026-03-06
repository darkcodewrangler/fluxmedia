import type { MetadataRoute } from 'next';
import { getAllPosts } from '@/lib/blog';
import { getAllDocEntries } from '@/lib/docs';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.fluxmedia.dev';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const docsEntries = getAllDocEntries();
  const docsIndex = docsEntries.find((entry) => entry.slug === '');

  const staticRoutes = ['', '/blog', '/changelog', '/docs', '/playground'];
  const staticUrls = staticRoutes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: route === '/docs' && docsIndex ? docsIndex.lastModified : now,
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1 : 0.7,
  }));

  const postUrls = getAllPosts().map((post) => ({
    url: `${siteUrl}/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  const docUrls = docsEntries
    .filter((entry) => entry.slug !== '')
    .map((entry) => ({
      url: `${siteUrl}/docs/${entry.slug}`,
      lastModified: entry.lastModified,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));

  const validPostUrls = postUrls.map((post) => ({
    ...post,
    lastModified: Number.isNaN(post.lastModified.getTime()) ? now : post.lastModified,
  }));

  return [...staticUrls, ...validPostUrls, ...docUrls];
}

import type { MetadataRoute } from 'next';
import { getAllPostSlugs } from '@/lib/blog';
import { getAllDocSlugs } from '@/lib/docs';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.fluxmedia.dev';

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = ['', '/blog', '/changelog', '/docs', '/playground'];
  const staticUrls = staticRoutes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1 : 0.7,
  }));

  const postUrls = getAllPostSlugs().map((slug) => ({
    url: `${siteUrl}/blog/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  const docUrls = getAllDocSlugs()
    .filter((slug) => slug !== 'index')
    .map((slug) => ({
      url: `${siteUrl}/docs/${slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));

  return [...staticUrls, ...postUrls, ...docUrls];
}

import { getAllPostSlugs, getPostContent, getBlogPrevNext } from '@/lib/blog';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, Clock } from 'lucide-react';
import { BlogContent } from '@/components/blog/blog-content';
import { PrevNextNav } from '@/components/prev-next-nav';
import './blog-post.css';

export async function generateStaticParams() {
  const slugs = getAllPostSlugs();
  return slugs.map((slug) => ({ slug }));
}

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPostContent(slug);

  if (!post) {
    notFound();
  }

  const { meta, htmlContent } = post;
  const { prev, next } = getBlogPrevNext(slug);

  return (
    <article className="container mx-auto max-w-3xl px-4 py-12 md:py-16" data-pagefind-body>
      <header className="mb-10">
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="mb-6 -ml-2 text-muted-foreground hover:text-foreground"
        >
          <Link href="/blog">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to blog
          </Link>
        </Button>

        <div className="mb-6 flex flex-wrap items-center gap-3 font-mono text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            {new Date(meta.date).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </span>
          <span className="text-border">•</span>
          <span className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            {meta.readingTime}
          </span>
          {meta.author && (
            <>
              <span className="text-border">•</span>
              <span>by {meta.author}</span>
            </>
          )}
        </div>

        <h1 className="font-display text-[clamp(2rem,4vw,2.75rem)] font-bold leading-tight tracking-tight">
          {meta.title}
        </h1>

        {meta.tags && (
          <ul className="mt-6 flex flex-wrap gap-2">
            {meta.tags.map((tag) => (
              <li
                key={tag}
                className="rounded-sm bg-brand-muted px-2 py-0.5 font-mono text-xs text-brand"
              >
                {tag}
              </li>
            ))}
          </ul>
        )}
      </header>

      <BlogContent htmlContent={htmlContent} />

      <PrevNextNav
        prev={prev ? { href: `/blog/${prev.slug}`, title: prev.title } : null}
        next={next ? { href: `/blog/${next.slug}`, title: next.title } : null}
      />
    </article>
  );
}

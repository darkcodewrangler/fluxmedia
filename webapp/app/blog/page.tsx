import { getAllPosts } from '@/lib/blog';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, Clock, ArrowRight } from 'lucide-react';

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <div className="container mx-auto max-w-3xl px-4 py-14 lg:py-20">
      <header className="page-header">
        <p className="page-kicker">engineering notes</p>
        <h1 className="font-display">Blog</h1>
        <p className="page-lede">
          Guides and deep dives on plugins, providers, and the unified upload API.
        </p>
      </header>

      {posts.length === 0 ? (
        <div className="py-12 text-center">
          <p className="mb-6 text-muted-foreground">No posts yet. Check back soon.</p>
          <Button variant="outline" asChild>
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back home
            </Link>
          </Button>
        </div>
      ) : (
        <div className="content-list">
          {posts.map((post) => (
            <article key={post.slug}>
              <Link href={`/blog/${post.slug}`} className="group block">
                <div className="mb-2 flex flex-wrap items-center gap-4 font-mono text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {new Date(post.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {post.readingTime}
                  </span>
                </div>

                <h2 className="text-xl font-semibold tracking-tight text-foreground transition-colors group-hover:text-brand">
                  {post.title}
                </h2>

                <p className="mt-2 leading-relaxed text-muted-foreground">{post.excerpt}</p>

                {post.tags && post.tags.length > 0 && (
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {post.tags.map((tag) => (
                      <li
                        key={tag}
                        className="rounded-sm bg-brand-muted px-2 py-0.5 font-mono text-xs text-brand"
                      >
                        {tag}
                      </li>
                    ))}
                  </ul>
                )}

                <span className="mt-4 inline-flex items-center text-sm font-medium text-brand">
                  Read post
                  <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

import { getAllPostSlugs, getPostContent } from "@/lib/blog";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, Clock } from "lucide-react";
import "./blog-post.css";

export async function generateStaticParams() {
    const slugs = getAllPostSlugs();
    return slugs.map(slug => ({ slug }));
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

    return (
        <article className="container py-12 md:py-16 max-w-3xl px-4 md:px-8">
            <div className="mb-10">
                <Button variant="ghost" size="sm" asChild className="mb-6 -ml-2 text-muted-foreground hover:text-foreground">
                    <Link href="/blog">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Blog
                    </Link>
                </Button>

                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-6">
                    <span className="flex items-center gap-1.5">
                        <Calendar className="h-4 w-4" />
                        {new Date(meta.date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
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

                <h1 className="text-3xl md:text-4xl font-bold mb-6 leading-tight">{meta.title}</h1>

                {meta.tags && (
                    <div className="flex flex-wrap gap-2">
                        {meta.tags.map(tag => (
                            <span
                                key={tag}
                                className="px-3 py-1 text-sm rounded-full bg-indigo-500/10 text-indigo-500 font-medium"
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            <div
                className="blog-content"
                dangerouslySetInnerHTML={{ __html: htmlContent }}
            />

            <div className="mt-16 pt-8 border-t border-border/50">
                <Button variant="outline" asChild>
                    <Link href="/blog">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        All Posts
                    </Link>
                </Button>
            </div>
        </article>
    );
}

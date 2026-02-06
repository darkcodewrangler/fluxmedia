import { getAllPosts } from "@/lib/blog";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, Clock, ArrowRight } from "lucide-react";

export default function BlogPage() {
    const posts = getAllPosts();

    return (
        <div className="container py-16 max-w-4xl px-4 md:px-8">
            <div className="mb-12">
                <h1 className="text-4xl font-bold mb-4">Blog</h1>
                <p className="text-lg text-muted-foreground">
                    Guides, tutorials, and deep dives into FluxMedia.
                </p>
            </div>

            {posts.length === 0 ? (
                <div className="text-center py-16">
                    <p className="text-muted-foreground mb-6">No posts yet. Check back soon!</p>
                    <Button variant="outline" asChild>
                        <Link href="/">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back Home
                        </Link>
                    </Button>
                </div>
            ) : (
                <div className="space-y-8">
                    {posts.map((post) => (
                        <article
                            key={post.slug}
                            className="group rounded-2xl border border-border/50 bg-card p-6 hover:border-indigo-500/30 hover:shadow-lg transition-all duration-300"
                        >
                            <Link href={`/blog/${post.slug}`} className="block">
                                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                                    <span className="flex items-center gap-1">
                                        <Calendar className="h-4 w-4" />
                                        {new Date(post.date).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Clock className="h-4 w-4" />
                                        {post.readingTime}
                                    </span>
                                </div>

                                <h2 className="text-xl font-semibold mb-2 group-hover:text-indigo-500 transition-colors">
                                    {post.title}
                                </h2>

                                <p className="text-muted-foreground mb-4">
                                    {post.excerpt}
                                </p>

                                {post.tags && (
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {post.tags.map(tag => (
                                            <span
                                                key={tag}
                                                className="px-2 py-1 text-xs rounded-full bg-indigo-500/10 text-indigo-500"
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                <span className="inline-flex items-center text-sm font-medium text-indigo-500">
                                    Read more <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                </span>
                            </Link>
                        </article>
                    ))}
                </div>
            )}
        </div>
    );
}

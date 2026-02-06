import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';
import remarkGfm from 'remark-gfm';
import { codeToHtml } from 'shiki';

const postsDirectory = path.join(process.cwd(), 'content/blog');

export interface BlogPost {
    slug: string;
    title: string;
    date: string;
    excerpt: string;
    readingTime: string;
    content: string;
    author?: string;
    tags?: string[];
}

export interface BlogPostMeta {
    slug: string;
    title: string;
    date: string;
    excerpt: string;
    readingTime: string;
    author?: string;
    tags?: string[];
}

function calculateReadingTime(content: string): string {
    const wordsPerMinute = 200;
    const words = content.split(/\s+/).length;
    const minutes = Math.ceil(words / wordsPerMinute);
    return `${minutes} min read`;
}

export function getAllPostSlugs(): string[] {
    if (!fs.existsSync(postsDirectory)) {
        return [];
    }
    const fileNames = fs.readdirSync(postsDirectory);
    return fileNames
        .filter(name => name.endsWith('.md'))
        .map(name => name.replace(/\.md$/, ''));
}

export function getAllPosts(): BlogPostMeta[] {
    const slugs = getAllPostSlugs();
    const posts = slugs
        .map(slug => getPostBySlug(slug))
        .filter((post): post is BlogPost => post !== null)
        .sort((a, b) => (new Date(b.date).getTime() - new Date(a.date).getTime()));

    return posts.map(({ content, ...meta }) => meta);
}

export function getPostBySlug(slug: string): BlogPost | null {
    try {
        const fullPath = path.join(postsDirectory, `${slug}.md`);
        if (!fs.existsSync(fullPath)) {
            return null;
        }

        const fileContents = fs.readFileSync(fullPath, 'utf8');
        const { data, content } = matter(fileContents);

        return {
            slug,
            title: data.title || slug,
            date: data.date || new Date().toISOString(),
            excerpt: data.excerpt || content.slice(0, 160) + '...',
            readingTime: calculateReadingTime(content),
            content,
            author: data.author,
            tags: data.tags,
        };
    } catch {
        return null;
    }
}

// Highlight code blocks using shiki
async function highlightCodeBlocks(htmlContent: string): Promise<string> {
    // Match code blocks with language specifier
    const codeBlockRegex = /<pre><code class="language-(\w+)">([\s\S]*?)<\/code><\/pre>/g;

    let result = htmlContent;
    let match;

    // Find all code blocks and replace with highlighted versions
    const replacements: Array<{ original: string; highlighted: string }> = [];

    while ((match = codeBlockRegex.exec(htmlContent)) !== null) {
        const language = match[1];
        const code = match[0];
        // Decode HTML entities
        const decodedCode = match[2]
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&amp;/g, '&')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'");

        try {
            const highlighted = await codeToHtml(decodedCode, {
                lang: language,
                theme: 'github-dark',
            });
            replacements.push({ original: code, highlighted });
        } catch {
            // If language not supported, keep original
            continue;
        }
    }

    // Also match code blocks without language (plain <pre><code>)
    const plainCodeRegex = /<pre><code>([\s\S]*?)<\/code><\/pre>/g;
    while ((match = plainCodeRegex.exec(htmlContent)) !== null) {
        const code = match[0];
        const decodedCode = match[1]
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&amp;/g, '&')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'");

        try {
            const highlighted = await codeToHtml(decodedCode, {
                lang: 'text',
                theme: 'github-dark',
            });
            replacements.push({ original: code, highlighted });
        } catch {
            continue;
        }
    }

    // Apply replacements
    for (const { original, highlighted } of replacements) {
        result = result.replace(original, highlighted);
    }

    return result;
}

export async function getPostContent(slug: string): Promise<{ meta: BlogPostMeta; htmlContent: string } | null> {
    const post = getPostBySlug(slug);
    if (!post) return null;

    const processedContent = await remark()
        .use(remarkGfm)
        .use(html)
        .process(post.content);

    let htmlContent = processedContent.toString();

    // Apply syntax highlighting to code blocks
    htmlContent = await highlightCodeBlocks(htmlContent);

    const { content, ...meta } = post;

    return { meta, htmlContent };
}

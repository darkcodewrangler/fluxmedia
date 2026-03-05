import fs from 'fs';
import path from 'path';
import { codeToHtml } from 'shiki';

const docsDirectory = path.join(process.cwd(), 'content/docs');

export interface DocPage {
  slug: string;
  title: string;
  content: string;
}

export interface DocNavItem {
  slug: string;
  title: string;
  children?: DocNavItem[];
}

// Navigation structure for the docs sidebar
export const docsNavigation: DocNavItem[] = [
  { slug: '', title: 'Introduction' },
  { slug: 'getting-started', title: 'Getting Started' },
  {
    slug: 'providers',
    title: 'Providers',
    children: [
      { slug: 'providers', title: 'Overview' },
      { slug: 'cloudinary', title: 'Cloudinary' },
      { slug: 's3', title: 'AWS S3' },
      { slug: 'r2', title: 'Cloudflare R2' },
    ],
  },
  { slug: 'plugins', title: 'Plugins' },
  { slug: 'react', title: 'React Integration' },
  { slug: 'api', title: 'API Reference' },
];

export function getAllDocSlugs(): string[] {
  if (!fs.existsSync(docsDirectory)) {
    return [];
  }
  const files = fs.readdirSync(docsDirectory);
  return files
    .filter((name) => name.endsWith('.mdx'))
    .map((name) => name.replace(/\.mdx$/, ''))
    .filter((name) => name !== '_meta');
}

function extractTitle(content: string): string {
  const match = content.match(/^#\s+(.+)$/m);
  return match ? match[1] : 'Documentation';
}

async function highlightCodeBlocks(htmlContent: string): Promise<string> {
  const codeBlockRegex = /<pre><code class="language-(\w+)">([\s\S]*?)<\/code><\/pre>/g;

  const replacements: Array<{ original: string; highlighted: string }> = [];
  let match;

  while ((match = codeBlockRegex.exec(htmlContent)) !== null) {
    const language = match[1];
    const code = match[0];
    const decodedCode = match[2]
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");

    try {
      const highlighted = await codeToHtml(decodedCode, {
        lang: language === 'tsx' ? 'tsx' : language === 'bash' ? 'bash' : language,
        theme: 'github-dark',
      });
      replacements.push({ original: code, highlighted });
    } catch {
      // If highlighting fails, keep original
    }
  }

  let result = htmlContent;
  for (const { original, highlighted } of replacements) {
    result = result.replace(original, highlighted);
  }

  return result;
}

export async function getDocBySlug(slug: string): Promise<DocPage | null> {
  try {
    // Map 'index' to the main docs page
    const fileName = slug === '' || slug === 'index' ? 'index' : slug;
    const fullPath = path.join(docsDirectory, `${fileName}.mdx`);

    if (!fs.existsSync(fullPath)) {
      return null;
    }

    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const title = extractTitle(fileContents);

    // Process MDX as markdown (our MDX files are pure markdown + code blocks)
    const { remark } = await import('remark');
    const { default: remarkGfm } = await import('remark-gfm');
    const { default: remarkHtml } = await import('remark-html');

    const processed = await remark()
      .use(remarkGfm)
      .use(remarkHtml, { sanitize: false })
      .process(fileContents);

    let htmlContent = processed.toString();
    htmlContent = await highlightCodeBlocks(htmlContent);

    return {
      slug,
      title,
      content: htmlContent,
    };
  } catch {
    return null;
  }
}

export function getDocNavigation(): DocNavItem[] {
  return docsNavigation;
}

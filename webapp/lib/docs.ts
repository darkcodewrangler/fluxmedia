import fs from 'fs';
import path from 'path';
import { codeToHtml } from 'shiki';

const docsDirectory = path.join(process.cwd(), 'content/docs');

export interface DocPage {
  slug: string;
  title: string;
  description: string;
  content: string;
  markdown: string;
  headings: DocHeading[];
  sourcePath: string;
  lastModified: string;
}

export interface DocHeading {
  id: string;
  text: string;
  level: number;
}

export interface DocSitemapEntry {
  slug: string;
  lastModified: Date;
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

/** Flatten docsNavigation into an ordered list of leaf pages (sidebar order). */
function flattenNav(items: DocNavItem[]): { slug: string; title: string }[] {
  const result: { slug: string; title: string }[] = [];
  for (const item of items) {
    if (item.children && item.children.length > 0) {
      result.push(...flattenNav(item.children));
    } else {
      result.push({ slug: item.slug, title: item.title });
    }
  }
  return result;
}

/**
 * Get prev/next doc pages for a given slug, based on sidebar order.
 */
export function getDocPrevNext(slug: string): {
  prev: { slug: string; title: string } | null;
  next: { slug: string; title: string } | null;
} {
  const flat = flattenNav(docsNavigation);
  const idx = flat.findIndex((item) => item.slug === slug);
  if (idx === -1) return { prev: null, next: null };
  return {
    prev: idx > 0 ? flat[idx - 1] : null,
    next: idx < flat.length - 1 ? flat[idx + 1] : null,
  };
}

export function getAllDocSlugs(): string[] {
  return getAllDocEntries().map((entry) => entry.slug);
}

function getDocFileName(slug: string): string {
  return slug === '' || slug === 'index' ? 'index' : slug;
}

function getDocFilePath(slug: string): string {
  return path.join(docsDirectory, `${getDocFileName(slug)}.mdx`);
}

function getDocSourcePath(slug: string): string {
  return `content/docs/${getDocFileName(slug)}.mdx`;
}

function getDocLastModifiedIso(fullPath: string): string {
  return fs.statSync(fullPath).mtime.toISOString();
}

export function getAllDocEntries(): DocSitemapEntry[] {
  if (!fs.existsSync(docsDirectory)) {
    return [];
  }
  const files = fs.readdirSync(docsDirectory);
  return files
    .filter((name) => name.endsWith('.mdx'))
    .filter((name) => name !== '_meta.mdx')
    .map((name) => {
      const slug = name.replace(/\.mdx$/, '');
      const normalizedSlug = slug === 'index' ? '' : slug;
      const fullPath = path.join(docsDirectory, name);
      return {
        slug: normalizedSlug,
        lastModified: fs.statSync(fullPath).mtime,
      };
    });
}

function extractTitle(content: string): string {
  const match = content.match(/^#\s+(.+)$/m);
  return match ? match[1] : 'Documentation';
}

function extractDescription(markdown: string, fallbackTitle: string): string {
  const text = markdown
    .replace(/^---[\s\S]*?---\s*/m, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^#+\s+/gm, '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^>\s?/gm, '')
    .replace(/\|/g, ' ')
    .replace(/\n{2,}/g, '\n\n')
    .trim();

  const paragraphs = text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.replace(/\s+/g, ' ').trim())
    .filter(Boolean);

  const firstParagraph =
    paragraphs.find((paragraph) => paragraph.length > 30 && !paragraph.startsWith('-')) ||
    paragraphs[0] ||
    fallbackTitle;

  if (firstParagraph.length <= 165) {
    return firstParagraph;
  }

  return `${firstParagraph.slice(0, 162).trimEnd()}...`;
}

function stripHtmlTags(input: string): string {
  return input.replace(/<[^>]*>/g, '');
}

function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function addHeadingIdsAndCollectToc(html: string): { html: string; headings: DocHeading[] } {
  const headingCounts = new Map<string, number>();
  const headings: DocHeading[] = [];

  const htmlWithAnchors = html.replace(
    /<h([1-6])>([\s\S]*?)<\/h\1>/g,
    (_, levelValue: string, innerHtml: string) => {
      const level = Number(levelValue);
      const headingText = decodeHtmlEntities(stripHtmlTags(innerHtml)).replace(/\s+/g, ' ').trim();
      const baseSlug = slugifyHeading(headingText) || `section-${level}`;
      const existingCount = headingCounts.get(baseSlug) || 0;
      const nextCount = existingCount + 1;
      headingCounts.set(baseSlug, nextCount);

      const id = nextCount === 1 ? baseSlug : `${baseSlug}-${nextCount}`;
      const escapedHeadingText = headingText.replace(/"/g, '&quot;');

      if (level >= 2 && level <= 3) {
        headings.push({ id, text: headingText, level });
      }

      return `<h${level} id="${id}" tabindex="-1">${innerHtml}<a class="heading-anchor" href="#${id}" aria-label="Link to ${escapedHeadingText} section"><span aria-hidden="true">#</span></a></h${level}>`;
    }
  );

  return { html: htmlWithAnchors, headings };
}

/**
 * Decode all HTML entities (named, decimal, hex) to their characters.
 */
function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)));
}

/**
 * Convert an npm install command to the equivalent for other package managers.
 */
function convertNpmCommand(npmCmd: string): Record<string, string> {
  const commands: Record<string, string> = { npm: npmCmd };

  commands.yarn = npmCmd.replace(/^npm install/, 'yarn add').replace(/^npm i /, 'yarn add ');
  commands.pnpm = npmCmd.replace(/^npm install/, 'pnpm add').replace(/^npm i /, 'pnpm add ');
  commands.bun = npmCmd.replace(/^npm install/, 'bun add').replace(/^npm i /, 'bun add ');

  return commands;
}

/**
 * Extract ```bash npm2yarn blocks, store commands, replace with HTML comment
 * markers that survive remark processing.  Returns commands array.
 */
function extractNpm2YarnBlocks(markdown: string): { markdown: string; commands: string[] } {
  const commands: string[] = [];
  const regex = /```bash\s+npm2yarn\r?\n([\s\S]*?)```/g;
  const result = markdown.replace(regex, (_, cmdBlock: string) => {
    const idx = commands.length;
    commands.push(cmdBlock.trim());
    // Blank lines ensure remark treats the comment as a block-level HTML element
    return `\n\n<!--NPM2YARN_${idx}-->\n\n`;
  });
  return { markdown: result, commands };
}

/**
 * Build a tabbed package-manager UI with shiki-highlighted code for each tab.
 */
async function buildNpm2YarnTabs(npmCmd: string): Promise<string> {
  const cmds = convertNpmCommand(npmCmd);
  const managers = ['npm', 'yarn', 'pnpm', 'bun'] as const;

  const tabs = managers
    .map(
      (pm, i) => `<button class="pm-tab${i === 0 ? ' active' : ''}" data-tab="${pm}">${pm}</button>`
    )
    .join('');

  const panels: string[] = [];
  for (let i = 0; i < managers.length; i++) {
    const pm = managers[i];
    const highlighted = await codeToHtml(cmds[pm], {
      lang: 'bash',
      themes: { light: 'github-light', dark: 'github-dark' },
      defaultColor: false,
    });
    panels.push(
      `<div class="pm-tab-panel${i === 0 ? ' active' : ''}" data-tab-panel="${pm}">${highlighted}</div>`
    );
  }

  return `<div class="pm-tabs" data-pm-tabs><div class="pm-tabs-header">${tabs}</div>${panels.join('')}</div>`;
}

async function highlightCodeBlocks(htmlContent: string): Promise<string> {
  const codeBlockRegex = /<pre><code class="language-(\w+)">([\s\S]*?)<\/code><\/pre>/g;

  const replacements: Array<{ original: string; highlighted: string }> = [];
  let match;

  while ((match = codeBlockRegex.exec(htmlContent)) !== null) {
    const language = match[1];
    const code = match[0];
    const decodedCode = decodeHtmlEntities(match[2]);

    try {
      const highlighted = await codeToHtml(decodedCode, {
        lang: language,
        themes: {
          light: 'github-light',
          dark: 'github-dark',
        },
        defaultColor: false,
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

/**
 * Post-process HTML to wrap code blocks with a container that enables copy.
 */
function wrapCodeBlocksWithCopy(html: string): string {
  // Wrap each <pre> (shiki-generated or plain) in a .code-block-wrapper
  return html.replace(
    /(<pre[^>]*>[\s\S]*?<\/pre>)/g,
    '<div class="code-block-wrapper">$1<button class="copy-btn" data-copy-code aria-label="Copy code"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg></button></div>'
  );
}

export async function getDocBySlug(slug: string): Promise<DocPage | null> {
  try {
    const fullPath = getDocFilePath(slug);

    if (!fs.existsSync(fullPath)) {
      return null;
    }

    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const title = extractTitle(fileContents);
    const description = extractDescription(fileContents, title);
    const lastModified = getDocLastModifiedIso(fullPath);
    const sourcePath = getDocSourcePath(slug);

    // 1. Extract npm2yarn blocks → markers that survive remark
    const { markdown: preprocessed, commands: npm2yarnCommands } =
      extractNpm2YarnBlocks(fileContents);

    // 2. Process markdown with remark (HTML comment markers pass through)
    const { remark } = await import('remark');
    const { default: remarkGfm } = await import('remark-gfm');
    const { default: remarkHtml } = await import('remark-html');

    const processed = await remark()
      .use(remarkGfm)
      .use(remarkHtml, { sanitize: false })
      .process(preprocessed);

    let htmlContent = processed.toString();

    // 3. Highlight existing code blocks with shiki
    htmlContent = await highlightCodeBlocks(htmlContent);

    // 4. Replace npm2yarn markers with shiki-highlighted tabbed UI
    for (let i = 0; i < npm2yarnCommands.length; i++) {
      const marker = `<!--NPM2YARN_${i}-->`;
      const tabsHtml = await buildNpm2YarnTabs(npm2yarnCommands[i]);
      htmlContent = htmlContent.replace(marker, tabsHtml);
    }

    // 5. Wrap all code blocks (including tab panels) with copy buttons
    htmlContent = wrapCodeBlocksWithCopy(htmlContent);

    // 6. Add heading ids/anchors and extract TOC entries.
    const headingData = addHeadingIdsAndCollectToc(htmlContent);
    htmlContent = headingData.html;

    return {
      slug,
      title,
      description,
      content: htmlContent,
      markdown: fileContents,
      headings: headingData.headings,
      sourcePath,
      lastModified,
    };
  } catch {
    return null;
  }
}

export function getDocNavigation(): DocNavItem[] {
  return docsNavigation;
}

function findNavPath(
  items: DocNavItem[],
  targetSlug: string,
  trail: Array<{ slug: string; title: string }> = []
): Array<{ slug: string; title: string }> | null {
  for (const item of items) {
    const nextTrail = [...trail, { slug: item.slug, title: item.title }];
    if (item.slug === targetSlug && (!item.children || item.children.length === 0)) {
      return nextTrail;
    }

    if (item.children && item.children.length > 0) {
      const nested = findNavPath(item.children, targetSlug, nextTrail);
      if (nested) {
        return nested;
      }
    }
  }

  return null;
}

export function getDocBreadcrumbs(slug: string): Array<{ slug: string; title: string }> {
  const normalizedSlug = slug === 'index' ? '' : slug;
  const path = findNavPath(docsNavigation, normalizedSlug);
  return path || [];
}

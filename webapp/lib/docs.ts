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
    // Map 'index' to the main docs page
    const fileName = slug === '' || slug === 'index' ? 'index' : slug;
    const fullPath = path.join(docsDirectory, `${fileName}.mdx`);

    if (!fs.existsSync(fullPath)) {
      return null;
    }

    let fileContents = fs.readFileSync(fullPath, 'utf8');
    const title = extractTitle(fileContents);

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

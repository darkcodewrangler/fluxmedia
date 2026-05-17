import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface ChangelogEntry {
  version: string;
  date: string;
  title: string;
  features?: string[];
  fixes?: string[];
  improvements?: string[];
}

const changelog: ChangelogEntry[] = [
  {
    version: 'v2.0.0',
    date: 'Mar 5, 2026',
    title: 'Retry Resume & Stream Uploads',
    features: [
      'PartialUploadError support: resume uploads from the last known state',
      'withRetry accepts an optional resumeContext parameter for retry attempts',
      'R2 and S3 providers accept UploadInput (streams) in upload methods',
      'Multipart uploads retain parts for potential resume when retry is enabled',
      'Content type detection based on input type, skipping magic-byte detection for streams',
    ],
    improvements: [
      'Refactored plugin system for improved readability and maintainability',
      'Cleaned up code formatting across core, plugins, and provider packages',
      'Updated package versions and dependencies for all packages',
      'Expanded test coverage for partial upload and resume context scenarios',
    ],
  },
  {
    version: 'v1.0.1',
    date: 'Feb 15, 2026',
    title: 'Documentation & Messaging Update',
    improvements: [
      'Updated descriptions, READMEs, and documentation to reflect the new "One API" messaging strategy',
    ],
  },
  {
    version: 'v0.1.1',
    date: 'Feb 3, 2026',
    title: 'Package Optimizations',
    improvements: [
      'Externalized vitest from testing module to reduce package size',
      'Disabled source maps and removed tsdown dependency',
      'Added typed analytics events',
      'Updated repository URL',
    ],
  },
  {
    version: 'v0.1.0',
    date: 'Jan 28, 2026',
    title: 'Initial Release',
    features: [
      'Unified API for Cloudinary, S3, and R2',
      'TypeScript-first architecture with full type safety',
      'Plugin system with file validation, image optimization, metadata extraction, analytics, and retry',
      'Magic-byte based file type detection in core',
    ],
  },
];

function EntryList({ label, items }: { label: string; items: string[] }) {
  return (
    <div className="mt-4">
      <h3 className="mb-2 font-mono text-xs text-brand">{label}</h3>
      <ul className="space-y-1.5 text-sm leading-relaxed text-muted-foreground">
        {items.map((item) => (
          <li key={item} className="pl-4 before:relative before:-left-4 before:content-['—']">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function ChangelogPage() {
  return (
    <div className="container mx-auto max-w-2xl px-4 py-14 lg:py-20">
      <header className="page-header">
        <p className="page-kicker">release history</p>
        <h1 className="font-display">Changelog</h1>
        <p className="page-lede">What shipped, when, and what it means for your upload stack.</p>
      </header>

      <div className="content-list">
        {changelog.map((entry) => (
          <article key={entry.version}>
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
              <span className="font-mono text-sm font-medium text-brand">{entry.version}</span>
              <time className="font-mono text-xs text-muted-foreground">{entry.date}</time>
            </div>
            <h2 className="text-xl font-semibold tracking-tight text-foreground">{entry.title}</h2>

            {entry.features && entry.features.length > 0 && (
              <EntryList label="Features" items={entry.features} />
            )}
            {entry.fixes && entry.fixes.length > 0 && (
              <EntryList label="Fixes" items={entry.fixes} />
            )}
            {entry.improvements && entry.improvements.length > 0 && (
              <EntryList label="Improvements" items={entry.improvements} />
            )}
          </article>
        ))}
      </div>

      <div className="mt-12">
        <Button variant="outline" asChild>
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back home
          </Link>
        </Button>
      </div>
    </div>
  );
}

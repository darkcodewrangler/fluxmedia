import { DocsSidebar } from '@/components/docs/docs-sidebar';
import { docsNavigation } from '@/lib/docs';

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="container mx-auto max-w-370 px-4 py-8 lg:py-12">
      <div className="flex gap-8 lg:gap-12">
        {/* Sidebar */}
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="sticky top-24">
            <DocsSidebar navigation={docsNavigation} />
          </div>
        </aside>

        {/* Main content */}
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}

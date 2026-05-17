import { DocsSidebar } from '@/components/docs/docs-sidebar';
import { docsNavigation } from '@/lib/docs';

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-b border-border/40 bg-surface/30">
      <div className="container mx-auto max-w-[90rem] px-4 py-8 lg:py-10">
        <div className="flex gap-10 lg:gap-14">
          <aside className="hidden w-56 shrink-0 lg:block xl:w-60">
            <div className="sticky top-[4.5rem] max-h-[calc(100vh-5.5rem)] overflow-y-auto pb-8">
              <DocsSidebar navigation={docsNavigation} />
            </div>
          </aside>

          <div className="min-w-0 flex-1">{children}</div>
        </div>
      </div>
    </div>
  );
}

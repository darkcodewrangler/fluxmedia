'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { DocNavItem } from '@/lib/docs';

interface DocsSidebarProps {
  navigation: DocNavItem[];
}

function filterNavigation(items: DocNavItem[], rawQuery: string): DocNavItem[] {
  const query = rawQuery.trim().toLowerCase();
  if (!query) {
    return items;
  }

  return items.reduce<DocNavItem[]>((acc, item) => {
    const titleMatch = item.title.toLowerCase().includes(query);
    const slugMatch = item.slug.toLowerCase().includes(query);

    if (item.children && item.children.length > 0) {
      if (titleMatch || slugMatch) {
        acc.push(item);
        return acc;
      }

      const filteredChildren = filterNavigation(item.children, query);
      if (filteredChildren.length > 0) {
        acc.push({ ...item, children: filteredChildren });
      }
      return acc;
    }

    if (titleMatch || slugMatch) {
      acc.push(item);
    }
    return acc;
  }, []);
}

function NavItem({ item, depth = 0 }: { item: DocNavItem; depth?: number }) {
  const pathname = usePathname();
  const href = item.slug === '' ? '/docs' : `/docs/${item.slug}`;
  const isActive = pathname === href;
  const hasChildren = item.children && item.children.length > 0;

  // For parent items with children, check if any child is active
  const isParentActive =
    hasChildren &&
    item.children!.some((child) => {
      const childHref = `/docs/${child.slug}`;
      return pathname === childHref;
    });

  if (hasChildren) {
    return (
      <div className="space-y-1">
        <span
          className={cn(
            'text-xs font-semibold uppercase tracking-wider block py-2',
            isParentActive ? 'text-brand' : 'text-muted-foreground'
          )}
          style={{ paddingLeft: `${depth * 12}px` }}
        >
          {item.title}
        </span>
        <div className="space-y-0.5">
          {item.children!.map((child) => (
            <NavItem key={child.slug} item={child} depth={depth + 1} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <Link
      href={href}
      className={cn(
        'block rounded-md px-3 py-1.5 text-sm transition-colors',
        isActive
          ? 'bg-brand/10 text-brand font-medium'
          : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
      )}
      style={{ paddingLeft: `${depth * 12 + 12}px` }}
    >
      {item.title}
    </Link>
  );
}

export function DocsSidebar({ navigation }: DocsSidebarProps) {
  const [query, setQuery] = useState('');
  const filteredNavigation = useMemo(
    () => filterNavigation(navigation, query),
    [navigation, query]
  );

  return (
    <nav className="space-y-3 pr-4 border-r border-r-border">
      <div>
        <label
          htmlFor="docs-filter"
          className="mb-1 block text-xs font-medium text-muted-foreground"
        >
          Search docs
        </label>
        <input
          id="docs-filter"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Filter pages..."
          className="h-9 w-full rounded-md border border-border bg-card px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-brand"
        />
      </div>

      {filteredNavigation.length === 0 ? (
        <p className="rounded-md border border-dashed border-border px-3 py-2 text-sm text-muted-foreground">
          No docs pages match that search.
        </p>
      ) : null}

      {filteredNavigation.map((item) => (
        <NavItem key={item.slug || 'index'} item={item} />
      ))}
    </nav>
  );
}

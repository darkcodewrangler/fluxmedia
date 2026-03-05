'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { DocNavItem } from '@/lib/docs';

interface DocsSidebarProps {
  navigation: DocNavItem[];
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
  return (
    <nav className="space-y-2 pr-4">
      {navigation.map((item) => (
        <NavItem key={item.slug || 'index'} item={item} />
      ))}
    </nav>
  );
}

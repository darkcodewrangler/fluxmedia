'use client';

import { useEffect, useRef } from 'react';
import './docs-content.css';

interface DocsContentProps {
  title: string;
  content: string;
}

export function DocsContent({ content }: DocsContentProps) {
  const contentRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    // ── Copy buttons ──
    const copyButtons = el.querySelectorAll<HTMLButtonElement>('[data-copy-code]');
    const handleCopy = async (btn: HTMLButtonElement) => {
      const wrapper = btn.closest('.code-block-wrapper');
      const code = wrapper?.querySelector('pre')?.textContent ?? '';
      try {
        await navigator.clipboard.writeText(code);
        btn.classList.add('copied');
        btn.innerHTML =
          '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
        setTimeout(() => {
          btn.classList.remove('copied');
          btn.innerHTML =
            '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
        }, 2000);
      } catch {
        /* clipboard unsupported */
      }
    };
    copyButtons.forEach((btn) => {
      btn.addEventListener('click', () => handleCopy(btn));
    });

    // ── Package manager tabs ──
    const tabContainers = el.querySelectorAll<HTMLElement>('[data-pm-tabs]');
    tabContainers.forEach((container) => {
      const tabs = container.querySelectorAll<HTMLButtonElement>('.pm-tab');
      const panels = container.querySelectorAll<HTMLElement>('.pm-tab-panel');
      tabs.forEach((tab) => {
        tab.addEventListener('click', () => {
          const pm = tab.dataset.tab;
          tabs.forEach((t) => t.classList.remove('active'));
          panels.forEach((p) => p.classList.remove('active'));
          tab.classList.add('active');
          container.querySelector(`.pm-tab-panel[data-tab-panel="${pm}"]`)?.classList.add('active');
        });
      });
    });

    return () => {
      copyButtons.forEach((btn) => {
        btn.replaceWith(btn.cloneNode(true)); // remove listeners
      });
    };
  }, [content]);

  return (
    <article
      ref={contentRef}
      className="docs-content prose prose-invert max-w-none"
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}

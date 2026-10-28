"use client";

import type { MouseEvent } from "react";
import { ChevronDown, List } from "lucide-react";

type TermsTableOfContentsProps = {
  sections: readonly { id: string; title: string }[];
};

export default function TermsTableOfContents({
  sections,
}: TermsTableOfContentsProps) {
  function navigateToSection(event: MouseEvent<HTMLAnchorElement>, id: string) {
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    const heading = document.getElementById(id);
    if (!heading) return;

    event.preventDefault();

    // Collapse before scrolling so the mobile contents do not shift the target.
    const details = event.currentTarget.closest("details");
    if (details) details.open = false;

    if (window.location.hash !== `#${id}`) {
      window.history.pushState(null, "", `#${id}`);
    }
    heading.focus({ preventScroll: true });
    heading.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
      block: "start",
    });
  }

  const links = (
    <ol className="space-y-1">
      {sections.map(({ id, title }) => (
        <li key={id}>
          <a
            href={`#${id}`}
            onClick={(event) => navigateToSection(event, id)}
            className="block rounded-lg px-3 py-2.5 text-sm leading-6 text-foreground/80 transition-colors hover:bg-orange-50 hover:text-orange-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600"
          >
            {title}
          </a>
        </li>
      ))}
    </ol>
  );

  return (
    <>
      <div className="hidden rounded-2xl border border-border bg-card p-4 shadow-sm lg:block">
        <h2 className="mb-3 flex items-center gap-2 px-3 text-base font-bold">
          <List aria-hidden="true" className="h-4 w-4 text-orange-700" />
          Mục lục
        </h2>
        <nav
          aria-label="Mục lục điều khoản sử dụng"
          className="max-h-[calc(100dvh-12rem)] overflow-y-auto overscroll-contain p-1"
        >
          {links}
        </nav>
      </div>

      <details className="group rounded-2xl border border-border bg-card shadow-sm lg:hidden">
        <summary className="flex min-h-14 cursor-pointer list-none items-center gap-2 rounded-2xl px-5 py-4 text-base font-bold focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange-600 [&::-webkit-details-marker]:hidden">
          <List aria-hidden="true" className="h-4 w-4 text-orange-700" />
          Mục lục
          <span className="ml-auto text-xs font-normal text-muted-foreground">
            16 mục
          </span>
          <ChevronDown
            aria-hidden="true"
            className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180 motion-reduce:transition-none"
          />
        </summary>
        <nav
          aria-label="Mục lục điều khoản sử dụng"
          className="border-t border-border px-3 py-3"
        >
          {links}
        </nav>
      </details>
    </>
  );
}

// Theme-agnostic home section engine. The merchant controls which sections
// are on and their order; each theme supplies a registry of renderers.

import { Fragment, type ReactNode } from "react";

import { DEFAULT_SECTION_ORDER, type HomePageSections, type SectionKey } from "@/types/store-theme.types";

/** Saved order first, then any enabled section that isn't in it yet. */
export function resolveSectionOrder(sections: HomePageSections): SectionKey[] {
  const base = sections.sectionOrder ?? DEFAULT_SECTION_ORDER;
  return [...base, ...DEFAULT_SECTION_ORDER.filter((k) => !base.includes(k) && sections[k as keyof HomePageSections] === true)];
}

export type SectionRegistry<Ctx> = Partial<Record<SectionKey, (ctx: Ctx) => ReactNode>>;

/** Renders enabled sections in merchant order; keys missing from the registry
 *  go to `fallback` (e.g. a shared implementation). */
export function renderSections<Ctx>({
  sections,
  registry,
  ctx,
  fallback,
}: {
  sections: HomePageSections;
  registry: SectionRegistry<Ctx>;
  ctx: Ctx;
  fallback?: (key: SectionKey) => ReactNode;
}) {
  return resolveSectionOrder(sections).map((key) => {
    if (!sections[key as keyof HomePageSections]) return null;
    const render = registry[key];
    const node = render ? render(ctx) : fallback?.(key);
    return node ? <Fragment key={key}>{node}</Fragment> : null;
  });
}

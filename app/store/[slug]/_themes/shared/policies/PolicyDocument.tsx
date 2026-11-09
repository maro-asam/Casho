import Link from "next/link";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { policyPath } from "@/lib/store-policies";
import { cn } from "@/lib/utils";
import type { PolicyViewProps } from "../../types";

/** The theme's own classes — the document's layout and structure are shared. */
export type PolicySkin = {
  /** Section headings. */
  heading: string;
  /** Paragraphs and bullet points. */
  text: string;
  /** "Last updated" line. */
  meta: string;
  /** Links between the store's policies (chips on phones, a column on desktop). */
  navItem: string;
  /** The policy being read. */
  navActive: string;
  /** CSS color of the bullet dots. */
  marker: string;
};

const dateFormat = new Intl.DateTimeFormat("ar-EG", { day: "numeric", month: "long", year: "numeric" });

/**
 * A storefront legal page, shared by every theme: the merchant's text (or the
 * ready-made template) as headings, paragraphs and lists, plus a switcher
 * between the store's other policies.
 */
export function PolicyDocument({
  storeSlug,
  policy,
  policies,
  skin,
}: {
  storeSlug: string;
  policy: PolicyViewProps["policy"];
  policies: PolicyViewProps["policies"];
  skin: PolicySkin;
}) {
  const showNav = policies.length > 1;
  const updated = policy.updatedAt ? new Date(policy.updatedAt) : null;

  return (
    <div className={cn(showNav && "lg:grid lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-14")}>
      {showNav && (
        <nav aria-label="سياسات المتجر" className="mb-8 lg:sticky lg:top-28 lg:mb-0 lg:self-start">
          <ul className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] lg:flex-col lg:gap-1 lg:overflow-visible lg:pb-0">
            {policies.map((p) => {
              const active = p.type === policy.type;
              return (
                <li key={p.type} className="shrink-0">
                  <Link
                    href={buildStoreUrl(storeSlug, policyPath(p.type))}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "inline-flex min-h-10 items-center whitespace-nowrap text-sm transition-colors lg:flex lg:w-full lg:whitespace-normal",
                      skin.navItem,
                      active && skin.navActive,
                    )}
                  >
                    {p.title}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      )}

      <article className="min-w-0 max-w-[68ch]">
        {updated && !Number.isNaN(updated.getTime()) && (
          <p className={cn("mb-6 text-sm", skin.meta)}>
            آخر تحديث: <time dateTime={policy.updatedAt!}>{dateFormat.format(updated)}</time>
          </p>
        )}

        {policy.blocks.map((block, i) =>
          block.kind === "heading" ? (
            <h2 key={i} className={cn("mb-3 mt-10 text-balance first:mt-0", skin.heading)}>
              {block.text}
            </h2>
          ) : block.kind === "paragraph" ? (
            <p key={i} className={cn("mt-4 whitespace-pre-line text-[0.9375rem] leading-8 first:mt-0 sm:text-base sm:leading-8", skin.text)}>
              {block.text}
            </p>
          ) : (
            <ul key={i} className={cn("mt-4 space-y-2.5 text-[0.9375rem] leading-8 first:mt-0 sm:text-base sm:leading-8", skin.text)}>
              {block.items.map((item, j) => (
                <li key={j} className="flex gap-3">
                  <span aria-hidden className="mt-[0.85em] size-1.5 shrink-0 rounded-full" style={{ background: skin.marker }} />
                  <span className="min-w-0">{item}</span>
                </li>
              ))}
            </ul>
          ),
        )}
      </article>
    </div>
  );
}

import Link from "next/link";

import CashoLogo from "@/components/common/CashoLogo";
import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import type { StoreShell } from "../../types";
import { getSocialLinks, whatsappHref } from "../../shared/social";
import { Arrow, StarMark } from "../ui";

type LinkItem = { label: string; href: string; external?: boolean; ltr?: boolean };

function Column({ title, links }: { title: string; links: LinkItem[] }) {
  if (links.length === 0) return null;
  return (
    <div className="min-w-0 border-t border-current/20 pt-4">
      <h2 className="mb-3 text-xs font-semibold opacity-60">{title}</h2>
      <ul>
        {links.map((l) => (
          <li key={l.href + l.label}>
            <Link
              href={l.href}
              {...(l.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              className="rq-link inline-flex min-h-10 max-w-full items-center text-[0.9375rem] opacity-90 hover:opacity-100"
            >
              <span dir={l.ltr ? "ltr" : undefined} className="truncate">
                {l.label}
                {l.external && " ↗"}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** The back cover: a closing statement, ruled link columns, the store name
 *  set as a full-width wordmark, then the colophon. */
export default function RiwaqFooter({ shell }: { shell: StoreShell }) {
  const url = (p: string) => buildStoreUrl(shell.slug, p);
  const wa = whatsappHref(shell.contact.whatsapp);
  const socials = getSocialLinks(shell.contact);
  const year = new Date().getFullYear();

  const shop: LinkItem[] = [
    { label: "الرئيسية", href: url("") },
    { label: "كل المنتجات", href: url("/products") },
    { label: "التصنيفات", href: url("/categories") },
    { label: "سلة المشتريات", href: url("/cart") },
  ];
  const categories: LinkItem[] = [
    ...shell.categories.slice(0, 7).map((c) => ({ label: c.name, href: url(`/categories/${c.slug}`) })),
    ...(shell.categories.length > 7 ? [{ label: "كل التصنيفات", href: url("/categories") }] : []),
  ];
  const help: LinkItem[] = [
    { label: "تتبّع طلبك", href: url("/track") },
    { label: "تواصل معنا", href: url("/contact") },
    { label: "عن المتجر", href: url("/about") },
    ...(wa ? [{ label: "واتساب", href: wa, external: true }] : []),
    ...(shell.contact.email ? [{ label: shell.contact.email, href: `mailto:${shell.contact.email}`, ltr: true }] : []),
  ];
  const follow: LinkItem[] = socials.map((s) => ({ label: s.label, href: s.href, external: true }));

  // The wordmark fills the width: size it from the name's length.
  const len = Math.max(4, [...shell.name].length);
  const markSize = `min(12rem, calc(min(100vw, 90rem) * 0.86 / ${(len * 0.56).toFixed(2)}))`;

  return (
    <footer className="mt-(--rq-section) bg-(--rq-footer-bg) text-(--rq-footer-ink)">
      <div className="rq-wrap pt-14 lg:pt-24">
        {/* Statement */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-10">
          <p className="rq-face text-[1.625rem] font-semibold leading-snug sm:text-[2.25rem] lg:col-span-7">
            {shell.description?.trim()
              ? shell.description.trim().split(/(?<=[.!؟?])\s/)[0].slice(0, 160)
              : `شكرًا إنك وصلت لآخر الصفحة. لو محتاج أي حاجة، ${shell.name} معاك.`}
          </p>
          <div className="flex flex-col items-start gap-3 lg:col-span-4 lg:col-start-9 lg:items-end lg:justify-end">
            <Link href={url("/products")} className="group inline-flex min-h-12 items-center gap-3 text-lg font-semibold">
              <span className="rq-link">تسوّق كل المنتجات</span>
              <Arrow />
            </Link>
            {wa && (
              <a href={wa} target="_blank" rel="noopener noreferrer" className="group inline-flex min-h-12 items-center gap-3 text-lg font-semibold">
                <span className="rq-link">كلّمنا على واتساب</span>
                <Arrow />
              </a>
            )}
          </div>
        </div>

        {/* Columns */}
        <div className="mt-14 grid grid-cols-2 gap-x-6 gap-y-9 lg:mt-20 lg:grid-cols-4 lg:gap-x-10">
          <Column title="المتجر" links={shop} />
          <Column title="التصنيفات" links={categories} />
          <Column title="المساعدة" links={help} />
          <Column title="تابعنا" links={follow} />
        </div>
      </div>

      {/* Wordmark */}
      <div className="rq-wrap mt-14 overflow-hidden lg:mt-20" aria-hidden>
        <p
          className="rq-face whitespace-nowrap text-center font-semibold leading-[1.05] opacity-95"
          style={{ fontSize: markSize }}
        >
          {shell.name}
        </p>
      </div>

      {/* Colophon */}
      <div className="rq-wrap">
        <div className="flex flex-col items-center gap-3 border-t border-current/20 py-6 text-xs sm:flex-row sm:justify-between">
          <p className="flex items-center gap-2 opacity-70">
            <StarMark className="size-2.5" />© {year} {shell.name}. كل الحقوق محفوظة.
          </p>
          {shell.showPoweredByCasho && (
            <a
              href="https://casho.store"
              target="_blank"
              rel="noopener"
              className="inline-flex min-h-10 items-center gap-2 opacity-70 transition-opacity hover:opacity-100"
            >
              متجر مبني على
              <CashoLogo withSubTitle={false} />
            </a>
          )}
        </div>
      </div>
    </footer>
  );
}

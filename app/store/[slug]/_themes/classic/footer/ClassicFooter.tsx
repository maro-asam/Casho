import Link from "next/link";
import { ChevronDown, Mail, MessageCircle } from "lucide-react";

import CashoLogo from "@/components/common/CashoLogo";
import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import type { StoreShell } from "../../types";
import StoreLogo from "../header/StoreLogo";
import { SocialLinks, whatsappHref } from "../social";

type LinkItem = { label: string; href: string; external?: boolean; dir?: "ltr" };
type Group = { title: string; links: LinkItem[] };

function buildGroups(shell: StoreShell): Group[] {
  const url = (p: string) => buildStoreUrl(shell.slug, p);
  const wa = whatsappHref(shell.contact.whatsapp);

  const groups: Group[] = [
    {
      title: "تسوق",
      links: [
        { label: "الرئيسية", href: url("") },
        { label: "كل المنتجات", href: url("/products") },
        { label: "التصنيفات", href: url("/categories") },
        { label: "سلة المشتريات", href: url("/cart") },
      ],
    },
  ];

  if (shell.categories.length > 0) {
    groups.push({
      title: "التصنيفات",
      links: [
        ...shell.categories.slice(0, 6).map((c) => ({ label: c.name, href: url(`/categories/${c.slug}`) })),
        ...(shell.categories.length > 6 ? [{ label: "كل التصنيفات", href: url("/categories") }] : []),
      ],
    });
  }

  groups.push({
    title: "المساعدة",
    links: [
      { label: "تواصل معنا", href: url("/contact") },
      { label: "عن المتجر", href: url("/about") },
      ...(wa ? [{ label: "واتساب", href: wa, external: true }] : []),
      ...(shell.contact.email
        ? [{ label: shell.contact.email, href: `mailto:${shell.contact.email}`, dir: "ltr" as const }]
        : []),
    ],
  });

  return groups;
}

function FooterLink({ link }: { link: LinkItem }) {
  const props = link.external ? { target: "_blank", rel: "noopener noreferrer" } : {};
  return (
    <Link
      href={link.href}
      {...props}
      className="inline-flex min-h-10 items-center text-sm text-muted-foreground transition-colors hover:text-foreground lg:min-h-8"
    >
      <span dir={link.dir} className="truncate">
        {link.label}
      </span>
    </Link>
  );
}

export default function ClassicFooter({ shell }: { shell: StoreShell }) {
  const groups = buildGroups(shell);
  const wa = whatsappHref(shell.contact.whatsapp);
  const year = new Date().getFullYear();

  return (
    <footer className="mt-[var(--c-section-y)] border-t border-border bg-(--c-subtle)">
      <div className="c-container pb-6 pt-10 lg:pb-8 lg:pt-14">
        <div className="lg:grid lg:grid-cols-12 lg:gap-10">
          {/* Brand */}
          <div className="lg:col-span-4">
            <StoreLogo
              storeSlug={shell.slug}
              storeName={shell.name}
              logo={shell.logo}
              logoRadius={shell.logoRadius}
              logoSize={shell.logoSize}
              showStoreName
              maxHeight={44}
            />
            {shell.description && (
              <p className="mt-4 line-clamp-4 max-w-sm text-sm leading-7 text-muted-foreground">{shell.description}</p>
            )}

            {(wa || shell.contact.email) && (
              <div className="mt-5 flex flex-wrap gap-2 lg:hidden">
                {wa && (
                  <a
                    href={wa}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-11 items-center gap-2 rounded-(--c-btn-radius) border border-border bg-background px-4 text-sm font-semibold"
                  >
                    <MessageCircle className="size-[1.125rem]" />
                    واتساب
                  </a>
                )}
                {shell.contact.email && (
                  <a
                    href={`mailto:${shell.contact.email}`}
                    className="inline-flex h-11 items-center gap-2 rounded-(--c-btn-radius) border border-border bg-background px-4 text-sm font-semibold"
                  >
                    <Mail className="size-[1.125rem]" />
                    راسلنا
                  </a>
                )}
              </div>
            )}

            <SocialLinks contact={shell.contact} className="-ms-3 mt-4" />
          </div>

          {/* Link groups — accordions on phones */}
          <div className="mt-6 divide-y divide-border border-y border-border lg:hidden">
            {groups.map((group) => (
              <details key={group.title} className="c-accordion group">
                <summary className="flex min-h-13 items-center justify-between text-[0.9375rem] font-semibold">
                  {group.title}
                  <ChevronDown aria-hidden className="c-accordion-icon size-5 text-muted-foreground" />
                </summary>
                <ul className="-mt-1 pb-3">
                  {group.links.map((link) => (
                    <li key={link.href}>
                      <FooterLink link={link} />
                    </li>
                  ))}
                </ul>
              </details>
            ))}
          </div>

          {/* Link groups — columns on desktop */}
          <div className="hidden lg:col-span-8 lg:grid lg:grid-cols-3 lg:gap-8">
            {groups.map((group) => (
              <div key={group.title} className="min-w-0">
                <h2 className="mb-3 text-sm font-bold">{group.title}</h2>
                <ul>
                  {group.links.map((link) => (
                    <li key={link.href}>
                      <FooterLink link={link} />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 flex flex-col-reverse items-center gap-4 border-border text-center sm:flex-row sm:justify-between sm:text-start lg:mt-12 lg:border-t lg:pt-6">
          <p className="text-xs text-muted-foreground">
            © {year} {shell.name}. جميع الحقوق محفوظة.
          </p>
          {shell.showPoweredByCasho && (
            <a
              href="https://casho.store"
              target="_blank"
              rel="noopener"
              className="inline-flex min-h-10 items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
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

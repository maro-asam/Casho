import Link from "next/link";
import { Mail, MessageCircle } from "lucide-react";

import { GetStoreCheckoutPaymentMethodsAction } from "@/actions/payment-methods/payment-methods.actions";
import CashoLogo from "@/components/common/CashoLogo";
import { PAYMENT_METHODS_BY_KEY, type PaymentMethodKey } from "@/constants/payment-methods";
import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import type { StoreShell } from "../../types";
import { getSocialLinks, whatsappHref } from "../../shared/social";
import StoreMark from "../header/StoreMark";

type LinkItem = { label: string; href: string; external?: boolean; ltr?: boolean };

function Links({ links }: { links: LinkItem[] }) {
  return (
    <ul>
      {links.map((l) => (
        <li key={l.label + l.href}>
          <Link
            href={l.href}
            {...(l.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            className="inline-flex min-h-10 max-w-full items-center text-[0.9375rem] lg:min-h-9 lg:text-sm"
          >
            <span dir={l.ltr ? "ltr" : undefined} className="dn-link truncate">
              {l.label}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

async function paymentLogos(slug: string) {
  try {
    const methods = await GetStoreCheckoutPaymentMethodsAction(slug);
    return methods.map((m) => ({ key: m.key, label: m.label, logo: PAYMENT_METHODS_BY_KEY[m.key as PaymentMethodKey]?.logo })).filter((m) => m.logo);
  } catch {
    return [];
  }
}

/** Store column, link columns (accordions on phones), a contact column,
 *  then payment marks and the colophon. */
export default async function DuneFooter({ shell }: { shell: StoreShell }) {
  const url = (p: string) => buildStoreUrl(shell.slug, p);
  const wa = whatsappHref(shell.contact.whatsapp);
  const socials = getSocialLinks(shell.contact);
  const payments = await paymentLogos(shell.slug);
  const year = new Date().getFullYear();

  const groups: { title: string; links: LinkItem[] }[] = [
    {
      title: "تسوّق",
      links: [
        { label: "كل المنتجات", href: url("/products") },
        { label: "وصل حديثًا", href: url("/products?sort=newest") },
        { label: "اختيارات المتجر", href: url("/products?featured=true") },
        { label: "التصنيفات", href: url("/categories") },
      ],
    },
    ...(shell.categories.length ? [{ title: "التصنيفات", links: shell.categories.slice(0, 6).map((c) => ({ label: c.name, href: url(`/categories/${c.slug}`) })) }] : []),
    {
      title: "المساعدة",
      links: [
        { label: "عن المتجر", href: url("/about") },
        { label: "تواصل معنا", href: url("/contact") },
        { label: "سلة المشتريات", href: url("/cart") },
      ],
    },
  ];

  return (
    <footer className="mt-[calc(var(--dn-section)/2)] bg-(--dn-tile) text-(--dn-ink)">
      <div className="dn-wrap pb-8 pt-14 lg:pt-20">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-4">
            <StoreMark shell={shell} />
            {shell.description && <p className="mt-5 line-clamp-4 max-w-sm text-sm leading-7 text-(--dn-quiet)">{shell.description}</p>}
            {socials.length > 0 && (
              <ul className="mt-5 flex gap-1">
                {socials.map(({ label, href, Icon }) => (
                  <li key={label}>
                    <a href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className="dn-icon -ms-2.5 [&_svg]:size-5">
                      <Icon aria-hidden />
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Phones: accordions */}
          <div className="border-t border-(--dn-line-ink) lg:hidden">
            {groups.map((g) => (
              <details key={g.title} className="dn-details border-b border-(--dn-line-ink)">
                <summary className="flex min-h-14 items-center justify-between">
                  <span className="dn-label">{g.title}</span>
                  <span className="dn-plus" aria-hidden />
                </summary>
                <div className="pb-4">
                  <Links links={g.links} />
                </div>
              </details>
            ))}
          </div>

          {/* Desktop: columns */}
          <div className="hidden gap-8 lg:col-span-5 lg:grid lg:grid-cols-3">
            {groups.map((g) => (
              <div key={g.title} className="min-w-0">
                <h2 className="dn-label mb-4">{g.title}</h2>
                <Links links={g.links} />
              </div>
            ))}
          </div>

          {(wa || shell.contact.email) && (
            <div className="lg:col-span-3">
              <h2 className="dn-h3">محتاج مساعدة؟</h2>
              <p className="mt-2 text-sm text-(--dn-quiet)">كلّم {shell.name} مباشرة وهيردوا عليك.</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {wa && (
                  <a href={wa} target="_blank" rel="noopener noreferrer" className="dn-btn dn-btn--solid dn-btn--sm">
                    <MessageCircle />
                    واتساب
                  </a>
                )}
                {shell.contact.email && (
                  <a href={`mailto:${shell.contact.email}`} className="dn-btn dn-btn--outline dn-btn--sm">
                    <Mail />
                    إيميل
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="mt-14 flex flex-col gap-6 border-t border-(--dn-line-ink) pt-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-2 text-xs text-(--dn-quiet) sm:flex-row sm:items-center sm:gap-6">
            <p>
              © {year} {shell.name}
            </p>
            {shell.showPoweredByCasho && (
              <a href="https://casho.store" target="_blank" rel="noopener" className="inline-flex min-h-10 items-center gap-2 transition-opacity hover:opacity-80">
                متجر مبني على
                <CashoLogo withSubTitle={false} />
              </a>
            )}
          </div>
          {payments.length > 0 && (
            <ul className="flex flex-wrap items-center gap-2" aria-label="طرق الدفع المتاحة">
              {payments.map((p) => (
                <li key={p.key} className="grid h-8 min-w-12 place-items-center bg-white px-2" title={p.label}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.logo} alt={p.label} className="h-4 w-auto max-w-14 object-contain" loading="lazy" />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </footer>
  );
}

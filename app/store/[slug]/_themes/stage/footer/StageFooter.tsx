import Link from "next/link";
import { ChevronDown, Headset, Mail, MessageCircle } from "lucide-react";

import { GetStoreCheckoutPaymentMethodsAction } from "@/actions/payment-methods/payment-methods.actions";
import CashoLogo from "@/components/common/CashoLogo";
import { PAYMENT_METHODS_BY_KEY, type PaymentMethodKey } from "@/constants/payment-methods";
import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import type { StoreShell } from "../../types";
import { policyFooterLinks } from "../../shared/policies/links";
import { getSocialLinks, whatsappHref } from "../../shared/social";
import { AppearanceSegments } from "../header/AppearanceToggle";
import StoreMark from "../header/StoreMark";

type LinkItem = { label: string; href: string };

function Links({ links }: { links: LinkItem[] }) {
  return (
    <ul className="space-y-0.5">
      {links.map((l) => (
        <li key={l.label + l.href}>
          <Link href={l.href} className="inline-flex min-h-9 max-w-full items-center text-(--sg-label-2) transition-colors hover:text-(--sg-ink) lg:min-h-7">
            <span className="truncate">{l.label}</span>
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

/** apple.com's footer in small quiet type on the light gray: the store column,
 *  link columns (disclosure rows on phones), payment methods, the light/dark
 *  control and the colophon with "Powered by Casho". */
export default async function StageFooter({ shell }: { shell: StoreShell }) {
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
        { label: "مختاراتنا", href: url("/products?featured=true") },
        { label: "المتوفر حالًا", href: url("/products?inStock=true") },
      ],
    },
    ...(shell.categories.length ? [{ title: "الأقسام", links: shell.categories.slice(0, 6).map((c) => ({ label: c.name, href: url(`/categories/${c.slug}`) })) }] : []),
    {
      title: "مساعدة",
      links: [
        { label: "تتبّع طلبك", href: url("/track") },
        { label: "تواصل معانا", href: url("/contact") },
        { label: "عن المتجر", href: url("/about") },
        { label: "كل الأقسام", href: url("/categories") },
        { label: "الحقيبة", href: url("/cart") },
        ...policyFooterLinks(shell),
      ],
    },
  ];

  return (
    <footer className="sg-footer">
      <div className="sg-wrap">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.5fr)_repeat(3,minmax(0,1fr))]">
          <div className="min-w-0">
            <StoreMark shell={shell} />
            {shell.description && <p className="mt-3 line-clamp-3 max-w-sm text-[0.8125rem] leading-5">{shell.description}</p>}
            <ul className="mt-3 space-y-1">
              {wa && (
                <li>
                  <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-9 items-center gap-2 text-(--sg-ink)">
                    <MessageCircle className="size-4" />
                    <span dir="ltr">{shell.contact.whatsapp}</span>
                  </a>
                </li>
              )}
              {shell.contact.email && (
                <li>
                  <a href={`mailto:${shell.contact.email}`} className="inline-flex min-h-9 items-center gap-2 text-(--sg-ink)">
                    <Mail className="size-4" />
                    {shell.contact.email}
                  </a>
                </li>
              )}
            </ul>
            {!wa && !shell.contact.email && (
              <Link href={url("/contact")} className="mt-3 inline-flex min-h-9 items-center gap-2 text-(--sg-ink)">
                <Headset className="size-4" />
                صفحة التواصل
              </Link>
            )}
            {socials.length > 0 && (
              <ul className="mt-2 flex gap-1 text-(--sg-ink)">
                {socials.map(({ label, href, Icon }) => (
                  <li key={label}>
                    <a href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className="sg-icon -ms-2 [&_svg]:size-5">
                      <Icon aria-hidden />
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Phones: disclosure rows */}
          <div className="lg:hidden">
            {groups.map((g) => (
              <details key={g.title} className="sg-details border-t border-(--sg-sep)">
                <summary className="flex min-h-11 items-center justify-between font-medium text-(--sg-ink)">
                  {g.title}
                  <ChevronDown className="sg-chev" />
                </summary>
                <div className="pb-3">
                  <Links links={g.links} />
                </div>
              </details>
            ))}
          </div>

          {/* Desktop: columns */}
          {groups.map((g) => (
            <div key={g.title} className="hidden min-w-0 lg:block">
              <h2 className="mb-2 font-semibold text-(--sg-ink)">{g.title}</h2>
              <Links links={g.links} />
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-(--sg-sep) pt-4">
          <AppearanceSegments />
          {payments.length > 0 && (
            <ul className="flex flex-wrap items-center gap-1.5" aria-label="طرق الدفع المتاحة">
              {payments.map((p) => (
                <li key={p.key} className="grid h-7 min-w-11 place-items-center rounded-lg bg-white px-1.5" title={p.label}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.logo} alt={p.label} className="h-3.5 w-auto max-w-12 object-contain" loading="lazy" />
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-3 flex flex-col items-center justify-between gap-x-6 gap-y-1 sm:flex-row">
          <p>
            حقوق النشر © {year} {shell.name}. كل الحقوق محفوظة.
          </p>
          {shell.showPoweredByCasho && (
            <a href="https://casho.store" target="_blank" rel="noopener" className="inline-flex min-h-10 items-center gap-2 transition-opacity hover:opacity-80">
              متجر مبني على
              <CashoLogo withSubTitle={false} iconClassName="size-6" />
            </a>
          )}
        </div>
      </div>
    </footer>
  );
}

import Link from "next/link";
import { ChevronDown, Mail, MessageCircle } from "lucide-react";

import { GetStoreCheckoutPaymentMethodsAction } from "@/actions/payment-methods/payment-methods.actions";
import CashoLogo from "@/components/common/CashoLogo";
import { PAYMENT_METHODS_BY_KEY, type PaymentMethodKey } from "@/constants/payment-methods";
import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import type { StoreShell } from "../../types";
import { getSocialLinks, whatsappHref } from "../../shared/social";
import { AppearanceSegments } from "../header/AppearanceToggle";
import StoreMark from "../header/StoreMark";
import { Ornament } from "../ui";

type LinkItem = { label: string; href: string };

function Links({ links }: { links: LinkItem[] }) {
  return (
    <ul className="space-y-1">
      {links.map((l) => (
        <li key={l.label + l.href}>
          <Link href={l.href} className="qr-footer-link">
            <span className="qr-underline truncate">{l.label}</span>
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

/** The velvet footer: the house mark centered over the ornament, link
 *  columns (disclosure rows on phones), contact, payment methods, the
 *  light/dark control and the colophon with "Powered by Casho". */
export default async function QiratFooter({ shell }: { shell: StoreShell }) {
  const url = (p: string) => buildStoreUrl(shell.slug, p);
  const wa = whatsappHref(shell.contact.whatsapp);
  const socials = getSocialLinks(shell.contact);
  const payments = await paymentLogos(shell.slug);
  const year = new Date().getFullYear();

  const groups: { title: string; links: LinkItem[] }[] = [
    {
      title: "تسوّق",
      links: [
        { label: "كل القطع", href: url("/products") },
        { label: "وصل حديثًا", href: url("/products?sort=newest") },
        { label: "مختارات المتجر", href: url("/products?featured=true") },
        { label: "المتوفر حالًا", href: url("/products?inStock=true") },
      ],
    },
    ...(shell.categories.length ? [{ title: "المجموعات", links: shell.categories.slice(0, 6).map((c) => ({ label: c.name, href: url(`/categories/${c.slug}`) })) }] : []),
    {
      title: "خدمة العملاء",
      links: [
        { label: "تتبّع طلبك", href: url("/track") },
        { label: "تواصل معانا", href: url("/contact") },
        { label: `عن ${shell.name}`, href: url("/about") },
        { label: "الحقيبة", href: url("/cart") },
      ],
    },
  ];

  return (
    <footer className="qr-footer" data-tone="velvet">
      <div className="qr-wrap">
        <div className="qr-footer-head">
          <StoreMark shell={shell} className="qr-footer-mark" max={64} />
          <Ornament className="mt-5" />
          {shell.description && <p className="mx-auto mt-5 line-clamp-3 max-w-xl text-center text-sm leading-7 text-(--qr-ink-2)">{shell.description}</p>}
          {(wa || shell.contact.email || socials.length > 0) && (
            <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
              {wa && (
                <li>
                  <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center gap-2 text-(--qr-ink) hover:text-(--qr-gold)">
                    <MessageCircle className="size-4" />
                    <span dir="ltr">{shell.contact.whatsapp}</span>
                  </a>
                </li>
              )}
              {shell.contact.email && (
                <li>
                  <a href={`mailto:${shell.contact.email}`} className="inline-flex min-h-10 items-center gap-2 text-(--qr-ink) hover:text-(--qr-gold)">
                    <Mail className="size-4" />
                    {shell.contact.email}
                  </a>
                </li>
              )}
              {socials.map(({ label, href, Icon }) => (
                <li key={label}>
                  <a href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className="qr-icon">
                    <Icon aria-hidden className="size-5" />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Phones: disclosure rows */}
        <div className="mt-10 lg:hidden">
          {groups.map((g) => (
            <details key={g.title} className="qr-details border-t border-(--qr-line)">
              <summary className="flex min-h-12 items-center justify-between text-(--qr-ink)">
                <span className="qr-kicker !mb-0">{g.title}</span>
                <ChevronDown className="qr-chev" />
              </summary>
              <div className="pb-4">
                <Links links={g.links} />
              </div>
            </details>
          ))}
        </div>

        {/* Desktop: columns */}
        <div className="qr-footer-cols max-lg:hidden" style={{ ["--n" as string]: groups.length }}>
          {groups.map((g) => (
            <div key={g.title} className="min-w-0">
              <h2 className="qr-kicker mb-4">{g.title}</h2>
              <Links links={g.links} />
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-(--qr-line) pt-6">
          <AppearanceSegments />
          {payments.length > 0 && (
            <ul className="flex flex-wrap items-center gap-1.5" aria-label="طرق الدفع المتاحة">
              {payments.map((p) => (
                <li key={p.key} className="grid h-7 min-w-11 place-items-center rounded-[0.25rem] bg-white px-1.5" title={p.label}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.logo} alt={p.label} className="h-3.5 w-auto max-w-12 object-contain" loading="lazy" />
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-5 flex flex-col items-center justify-between gap-x-6 gap-y-2 text-xs text-(--qr-ink-2) sm:flex-row">
          <p>
            © {year} {shell.name}. كل الحقوق محفوظة.
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

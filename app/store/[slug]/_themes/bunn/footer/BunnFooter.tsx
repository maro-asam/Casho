import Link from "next/link";
import { ChevronDown, Mail, MessageCircle } from "lucide-react";

import { GetStoreCheckoutPaymentMethodsAction } from "@/actions/payment-methods/payment-methods.actions";
import CashoLogo from "@/components/common/CashoLogo";
import {
  PAYMENT_METHODS_BY_KEY,
  type PaymentMethodKey,
} from "@/constants/payment-methods";
import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import type { StoreShell } from "../../types";
import { policyFooterLinks } from "../../shared/policies/links";
import { getSocialLinks, whatsappHref } from "../../shared/social";
import { AppearanceSegments } from "../header/AppearanceToggle";
import StoreMark from "../header/StoreMark";
import { st } from "@/lib/i18n/storefront";

type LinkItem = { label: string; href: string };

function Links({ links }: { links: LinkItem[] }) {
  return (
    <ul className="space-y-1">
      {links.map((l) => (
        <li key={l.label + l.href}>
          <Link href={l.href} className="bn-footer-link">
            <span className="bn-underline truncate">{l.label}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

async function paymentLogos(slug: string) {
  try {
    const methods = await GetStoreCheckoutPaymentMethodsAction(slug);
    return methods
      .map((m) => ({
        key: m.key,
        label: m.label,
        logo: PAYMENT_METHODS_BY_KEY[m.key as PaymentMethodKey]?.logo,
      }))
      .filter((m) => m.logo);
  } catch {
    return [];
  }
}

/** The espresso footer: the store's mark, its words and contact on the
 *  start, link columns beside them (disclosure rows on phones), payment
 *  methods, the light/dark control, then the store's name set huge across
 *  the bottom like the type on a bag, and the colophon with "Powered by Casho". */
export default async function BunnFooter({ shell }: { shell: StoreShell }) {
  const url = (p: string) => buildStoreUrl(shell.slug, p);
  const wa = whatsappHref(shell.contact.whatsapp);
  const socials = getSocialLinks(shell.contact);
  const payments = await paymentLogos(shell.slug);
  const year = new Date().getFullYear();

  const groups: { title: string; links: LinkItem[] }[] = [
    {
      title: st("تسوّق"),
      links: [
        { label: st("كل المنتجات"), href: url("/products") },
        { label: st("وصل جديد"), href: url("/products?sort=newest") },
        { label: st("اختيارات المحمصة"), href: url("/products?featured=true") },
        { label: st("المتوفر حالًا"), href: url("/products?inStock=true") },
      ],
    },
    ...(shell.categories.length
      ? [
          {
            title: st("الأقسام"),
            links: shell.categories
              .slice(0, 6)
              .map((c) => ({
                label: c.name,
                href: url(`/categories/${c.slug}`),
              })),
          },
        ]
      : []),
    {
      title: st("خدمة العملاء"),
      links: [
        { label: st("تتبّع طلبك"), href: url("/track") },
        { label: st("تواصل معانا"), href: url("/contact") },
        { label: st("عن {0}", shell.name), href: url("/about") },
        { label: st("السلة"), href: url("/cart") },
        ...policyFooterLinks(shell),
      ],
    },
  ];

  return (
    <footer className="bn-footer" data-tone="espresso">
      <div className="bn-wrap">
        <div className="bn-footer-top">
          <div className="bn-footer-head">
            <StoreMark shell={shell} className="bn-footer-mark" max={56} />
            {shell.description && (
              <p className="mt-5 line-clamp-4 max-w-md text-sm leading-7 text-(--bn-ink-2)">
                {shell.description}
              </p>
            )}
            {(wa || shell.contact.email || socials.length > 0) && (
              <ul className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                {wa && (
                  <li>
                    <a
                      href={wa}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-10 items-center gap-2 text-(--bn-ink) hover:text-(--bn-crema)"
                    >
                      <MessageCircle className="size-4" />
                      <span dir="ltr">{shell.contact.whatsapp}</span>
                    </a>
                  </li>
                )}
                {shell.contact.email && (
                  <li>
                    <a
                      href={`mailto:${shell.contact.email}`}
                      className="inline-flex min-h-10 items-center gap-2 text-(--bn-ink) hover:text-(--bn-crema)"
                    >
                      <Mail className="size-4" />
                      {shell.contact.email}
                    </a>
                  </li>
                )}
                {socials.map(({ label, href, Icon }) => (
                  <li key={label}>
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={label}
                      className="bn-icon"
                    >
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
              <details
                key={g.title}
                className="bn-details border-t border-(--bn-line)"
              >
                <summary className="flex min-h-12 items-center justify-between text-(--bn-ink)">
                  <span className="bn-kicker !mb-0">{g.title}</span>
                  <ChevronDown className="bn-chev" />
                </summary>
                <div className="pb-4">
                  <Links links={g.links} />
                </div>
              </details>
            ))}
          </div>

          {/* Desktop: columns */}
          <div
            className="bn-footer-cols max-lg:hidden"
            style={{ ["--n" as string]: groups.length }}
          >
            {groups.map((g) => (
              <div key={g.title} className="min-w-0">
                <h2 className="bn-kicker mb-4">{g.title}</h2>
                <Links links={g.links} />
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-(--bn-line) pt-6">
          <AppearanceSegments />
          {payments.length > 0 && (
            <ul
              className="flex flex-wrap items-center gap-1.5"
              aria-label={st("طرق الدفع المتاحة")}
            >
              {payments.map((p) => (
                <li
                  key={p.key}
                  className="grid h-7 min-w-11 place-items-center rounded-[0.25rem] bg-white px-1.5"
                  title={p.label}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.logo}
                    alt={p.label}
                    className="h-3.5 w-auto max-w-12 object-contain"
                    loading="lazy"
                  />
                </li>
              ))}
            </ul>
          )}
        </div>

        <p aria-hidden className="bn-footer-word">
          {shell.name}
        </p>

        <div className="flex flex-col items-center justify-between gap-x-6 gap-y-2 text-xs text-(--bn-ink-2) sm:flex-row">
          <p>{st("© {0} {1}. كل الحقوق محفوظة.", year, shell.name)}</p>
          {shell.showPoweredByCasho && (
            <a
              href="https://casho.store"
              target="_blank"
              rel="noopener"
              className="inline-flex min-h-10 items-center gap-2 transition-opacity hover:opacity-80"
            >
              {st("متجر مبني على")}
              <CashoLogo withSubTitle={false} iconClassName="size-6" />
            </a>
          )}
        </div>
      </div>
    </footer>
  );
}

import Link from "next/link";
import { ChevronDown, Mail, MessageCircle } from "lucide-react";

import { GetStoreCheckoutPaymentMethodsAction } from "@/actions/payment-methods/payment-methods.actions";
import CashoLogo from "@/components/common/CashoLogo";
import { PAYMENT_METHODS_BY_KEY, type PaymentMethodKey } from "@/constants/payment-methods";
import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import type { StoreShell } from "../../types";
import { getSocialLinks, whatsappHref } from "../../shared/social";
import { StoreMark } from "../header/parts";
import { Arrow, btn } from "../ui";

type LinkItem = { label: string; href: string; external?: boolean; ltr?: boolean };

function Links({ links }: { links: LinkItem[] }) {
  return (
    <ul className="space-y-0.5">
      {links.map((l) => (
        <li key={l.label + l.href}>
          <Link
            href={l.href}
            {...(l.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            className="inline-flex min-h-10 max-w-full items-center text-[0.9375rem] opacity-75 transition-opacity hover:opacity-100 lg:min-h-9 lg:text-sm"
          >
            <span dir={l.ltr ? "ltr" : undefined} className="truncate">
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

/** Contact band, link columns (accordions on phones), payment logos, colophon. */
export default async function MadaFooter({ shell }: { shell: StoreShell }) {
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
        { label: "وصل حديثًا", href: url("/products") },
        { label: "اختيارات المتجر", href: url("/products?featured=true") },
        { label: "التصنيفات", href: url("/categories") },
      ],
    },
    ...(shell.categories.length
      ? [{ title: "التصنيفات", links: shell.categories.slice(0, 6).map((c) => ({ label: c.name, href: url(`/categories/${c.slug}`) })) }]
      : []),
    {
      title: "المساعدة",
      links: [
        { label: "تواصل معنا", href: url("/contact") },
        { label: "عن المتجر", href: url("/about") },
        { label: "سلة المشتريات", href: url("/cart") },
        ...(wa ? [{ label: "واتساب", href: wa, external: true }] : []),
        ...(shell.contact.email ? [{ label: shell.contact.email, href: `mailto:${shell.contact.email}`, ltr: true }] : []),
      ],
    },
  ];

  return (
    <footer className="mt-(--md-section)">
      {(wa || shell.contact.email) && (
        <div className="md-wrap mb-[calc(var(--md-section)/2)]">
          <div className="flex flex-col items-start gap-5 rounded-[1.75rem] bg-(--md-signal) px-6 py-8 text-(--md-signal-ink) sm:px-10 lg:flex-row lg:items-center lg:justify-between lg:px-14">
            <div>
              <p className="md-h3">محتاج مساعدة في طلبك؟</p>
              <p className="mt-1 text-sm opacity-75">كلّم {shell.name} مباشرة وهيردوا عليك.</p>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {wa && (
                <a href={wa} target="_blank" rel="noopener noreferrer" className={btn({ className: "bg-[#121714] text-white hover:bg-black" })}>
                  <MessageCircle />
                  واتساب
                </a>
              )}
              {shell.contact.email && (
                <a href={`mailto:${shell.contact.email}`} className={btn({ variant: "outline", className: "border-current/30 text-inherit hover:bg-white/30" })}>
                  <Mail />
                  إيميل
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="bg-(--md-brand) text-(--md-brand-ink) dark:bg-(--md-surface) dark:text-(--md-ink)">
        <div className="md-wrap py-12 lg:py-16">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <StoreMark shell={shell} className="[&_span]:text-inherit" />
              {shell.description && <p className="mt-4 line-clamp-4 max-w-sm text-sm leading-7 opacity-75">{shell.description}</p>}
              {socials.length > 0 && (
                <ul className="mt-5 flex gap-2">
                  {socials.map(({ label, href, Icon }) => (
                    <li key={label}>
                      <a href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className="grid size-11 place-items-center rounded-full bg-white/10 transition-colors hover:bg-(--md-signal) hover:text-(--md-signal-ink) [&_svg]:size-5">
                        <Icon aria-hidden />
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Phones: accordions */}
            <div className="divide-y divide-current/15 border-y border-current/15 lg:hidden">
              {groups.map((g) => (
                <details key={g.title} className="md-details">
                  <summary className="flex min-h-14 items-center justify-between text-[0.9375rem] font-semibold">
                    {g.title}
                    <ChevronDown aria-hidden className="md-details-icon size-5 opacity-60" />
                  </summary>
                  <div className="-mt-1 pb-3">
                    <Links links={g.links} />
                  </div>
                </details>
              ))}
            </div>

            {/* Desktop: columns */}
            <div className="hidden lg:col-span-8 lg:grid lg:grid-cols-3 lg:gap-8">
              {groups.map((g) => (
                <div key={g.title} className="min-w-0">
                  <h2 className="mb-3 text-sm font-semibold">{g.title}</h2>
                  <Links links={g.links} />
                </div>
              ))}
            </div>
          </div>

          <div className="mt-12 flex flex-col gap-6 border-t border-current/15 pt-6 lg:flex-row lg:items-center lg:justify-between">
            {payments.length > 0 ? (
              <ul className="flex flex-wrap items-center gap-2" aria-label="طرق الدفع المتاحة">
                {payments.map((p) => (
                  <li key={p.key} className="grid h-9 min-w-14 place-items-center rounded-lg bg-white px-2" title={p.label}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.logo} alt={p.label} className="h-5 w-auto max-w-16 object-contain" loading="lazy" />
                  </li>
                ))}
              </ul>
            ) : (
              <Link href={url("/products")} className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold">
                ابدأ التسوق
                <Arrow />
              </Link>
            )}
            <div className="flex flex-col gap-2 text-xs opacity-70 sm:flex-row sm:items-center sm:gap-6">
              <p>© {year} {shell.name}. كل الحقوق محفوظة.</p>
              {shell.showPoweredByCasho && (
                <a href="https://casho.store" target="_blank" rel="noopener" className="inline-flex min-h-10 items-center gap-2 transition-opacity hover:opacity-100">
                  متجر مبني على
                  <CashoLogo withSubTitle={false} />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

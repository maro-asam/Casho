import Link from "next/link";
import { ChevronDown, Headset, Mail, MessageCircle } from "lucide-react";

import { GetStoreCheckoutPaymentMethodsAction } from "@/actions/payment-methods/payment-methods.actions";
import CashoLogo from "@/components/common/CashoLogo";
import { PAYMENT_METHODS_BY_KEY, type PaymentMethodKey } from "@/constants/payment-methods";
import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import type { StoreShell } from "../../types";
import { getSocialLinks, whatsappHref } from "../../shared/social";
import StoreMark from "../header/StoreMark";

type LinkItem = { label: string; href: string };

function Links({ links }: { links: LinkItem[] }) {
  return (
    <ul className="space-y-1">
      {links.map((l) => (
        <li key={l.label + l.href}>
          <Link href={l.href} className="inline-flex min-h-10 max-w-full items-center text-[0.9375rem] text-(--ce-dark-quiet) hover:text-white lg:min-h-9 lg:text-base">
            <span className="ce-hover-line truncate">{l.label}</span>
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

/** Cello's navy footer: the store column (logo, about, real contact
 *  channels, socials), link columns (accordions on phones), the accepted
 *  payment methods, and a centered colophon with "Powered by Casho". */
export default async function CelloFooter({ shell }: { shell: StoreShell }) {
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
        { label: "المتوفر حالًا", href: url("/products?inStock=true") },
      ],
    },
    ...(shell.categories.length ? [{ title: "التصنيفات", links: shell.categories.slice(0, 6).map((c) => ({ label: c.name, href: url(`/categories/${c.slug}`) })) }] : []),
    {
      title: "معلومات",
      links: [
        { label: "البحث", href: url("/products") },
        { label: "عن المتجر", href: url("/about") },
        { label: "تواصل معنا", href: url("/contact") },
        { label: "كل التصنيفات", href: url("/categories") },
        { label: "سلة المشتريات", href: url("/cart") },
      ],
    },
  ];

  return (
    <footer className="bg-(--ce-navy) text-(--ce-dark-ink)" dir={shell.dir}>
      <div className="ce-wrap pt-10 lg:pt-12">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4 lg:gap-10">
          {/* Store column: logo, about, real contact channels, socials */}
          <div className="min-w-0">
            <StoreMark shell={shell} tone="dark" />
            {shell.description && <p className="mt-5 line-clamp-4 text-[0.9375rem] leading-7 text-(--ce-dark-quiet)">{shell.description}</p>}
            {(wa || shell.contact.email) && (
              <ul className="mt-5 space-y-3 text-[0.9375rem]">
                {wa && (
                  <li>
                    <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-9 items-center gap-2.5">
                      <MessageCircle className="size-5 shrink-0" strokeWidth={1.5} />
                      <span dir="ltr" className="underline underline-offset-4 hover:no-underline">
                        {shell.contact.whatsapp}
                      </span>
                    </a>
                  </li>
                )}
                {shell.contact.email && (
                  <li>
                    <a href={`mailto:${shell.contact.email}`} className="inline-flex min-h-9 max-w-full items-center gap-2.5">
                      <Mail className="size-5 shrink-0" strokeWidth={1.5} />
                      <span dir="ltr" className="truncate underline underline-offset-4 hover:no-underline">
                        {shell.contact.email}
                      </span>
                    </a>
                  </li>
                )}
              </ul>
            )}
            {!wa && !shell.contact.email && (
              <Link href={url("/contact")} className="mt-5 inline-flex min-h-9 items-center gap-2.5 text-[0.9375rem] underline underline-offset-4 hover:no-underline">
                <Headset className="size-5" strokeWidth={1.5} />
                صفحة التواصل
              </Link>
            )}
            {socials.length > 0 && (
              <ul className="mt-4 flex gap-1">
                {socials.map(({ label, href, Icon }) => (
                  <li key={label}>
                    <a href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className="ce-icon -ms-2 text-white [&_svg]:size-5">
                      <Icon aria-hidden />
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Phones: accordions */}
          <div className="border-t border-(--ce-dark-line) lg:hidden">
            {groups.map((g) => (
              <details key={g.title} className="ce-details border-b border-(--ce-dark-line)">
                <summary className="flex min-h-13 items-center justify-between text-lg font-medium text-white">
                  {g.title}
                  <ChevronDown className="ce-chev" />
                </summary>
                <div className="pb-4">
                  <Links links={g.links} />
                </div>
              </details>
            ))}
          </div>

          {/* Desktop: columns */}
          {groups.map((g) => (
            <div key={g.title} className="hidden min-w-0 lg:block">
              <h2 className="mb-5 text-2xl font-medium text-white">{g.title}</h2>
              <Links links={g.links} />
            </div>
          ))}
        </div>

        {payments.length > 0 && (
          <div className="mt-10 flex flex-col gap-4 border-t border-(--ce-dark-line) py-6 lg:flex-row lg:items-center lg:justify-between">
            <p className="text-lg font-medium text-white">طرق الدفع المتاحة</p>
            <ul className="flex flex-wrap items-center gap-2" aria-label="طرق الدفع المتاحة">
              {payments.map((p) => (
                <li key={p.key} className="grid h-8 min-w-12 place-items-center rounded-(--ce-r-sm) bg-white px-2" title={p.label}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.logo} alt={p.label} className="h-4 w-auto max-w-14 object-contain" loading="lazy" />
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className={`flex flex-col items-center justify-center gap-x-6 gap-y-1 border-t border-(--ce-dark-line) py-4 ${payments.length ? "" : "mt-10"} text-sm text-(--ce-dark-quiet) sm:flex-row`}>
          <p>
            © {year} {shell.name}
          </p>
          {shell.showPoweredByCasho && (
            <a href="https://casho.store" target="_blank" rel="noopener" className="inline-flex min-h-10 items-center gap-2 transition-opacity hover:opacity-80">
              متجر مبني على
              <CashoLogo withSubTitle={false} iconClassName="size-7" textClassName="text-white" />
            </a>
          )}
        </div>
      </div>
    </footer>
  );
}

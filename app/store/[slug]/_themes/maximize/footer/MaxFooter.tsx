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
    <ul className="space-y-0.5">
      {links.map((l) => (
        <li key={l.label + l.href}>
          <Link href={l.href} className="inline-flex min-h-10 max-w-full items-center text-[0.9375rem] text-(--mx-dark-ink) lg:min-h-9 lg:text-sm">
            <span className="mx-hover-line truncate">{l.label}</span>
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

/** Dark footer: logo + a row of quick links, then a "need help" column with
 *  the store's real contact channels, link columns (accordions on phones),
 *  socials, and a colophon with the accepted payment methods. */
export default async function MaxFooter({ shell }: { shell: StoreShell }) {
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
        { label: "عن المتجر", href: url("/about") },
        { label: "تواصل معنا", href: url("/contact") },
        { label: "تتبّع طلبك", href: url("/track") },
        { label: "كل التصنيفات", href: url("/categories") },
        { label: "سلة المشتريات", href: url("/cart") },
      ],
    },
  ];

  return (
    <footer className="mt-[calc(var(--mx-section)/2)] bg-(--mx-dark) text-(--mx-dark-ink)" dir={shell.dir}>
      <div className="mx-wrap pb-6 pt-12 lg:pt-14">
        <div className="flex flex-col gap-6 border-b border-(--mx-dark-line) pb-8 lg:flex-row lg:items-center lg:gap-16">
          <StoreMark shell={shell} tone="dark" className="shrink-0" />
          {shell.categories.length > 0 && (
            <ul className="flex flex-wrap gap-x-6 gap-y-1">
              {shell.categories.slice(0, 7).map((c) => (
                <li key={c.id}>
                  <Link href={url(`/categories/${c.slug}`)} className="inline-flex min-h-9 items-center text-[0.9375rem]">
                    <span className="mx-hover-line">{c.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="grid grid-cols-1 gap-8 pt-10 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-3">
            <h2 className="text-lg font-semibold text-white">محتاج مساعدة؟</h2>
            {wa || shell.contact.email ? (
              <ul className="mt-5 space-y-5">
                {wa && (
                  <li>
                    <a href={wa} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-3.5">
                      <MessageCircle className="size-8 shrink-0 text-(--mx-dark-quiet)" strokeWidth={1.25} />
                      <span className="text-sm">
                        <span className="block text-(--mx-dark-quiet)">كلّمنا على واتساب</span>
                        <span dir="ltr" className="mt-0.5 block font-semibold text-white group-hover:underline">
                          {shell.contact.whatsapp}
                        </span>
                      </span>
                    </a>
                  </li>
                )}
                {shell.contact.email && (
                  <li>
                    <a href={`mailto:${shell.contact.email}`} className="group flex items-center gap-3.5">
                      <Mail className="size-8 shrink-0 text-(--mx-dark-quiet)" strokeWidth={1.25} />
                      <span className="min-w-0 text-sm">
                        <span className="block text-(--mx-dark-quiet)">ابعتلنا إيميل</span>
                        <span dir="ltr" className="mt-0.5 block truncate font-semibold text-white group-hover:underline">
                          {shell.contact.email}
                        </span>
                      </span>
                    </a>
                  </li>
                )}
              </ul>
            ) : (
              <Link href={url("/contact")} className="group mt-5 flex items-center gap-3.5">
                <Headset className="size-8 shrink-0 text-(--mx-dark-quiet)" strokeWidth={1.25} />
                <span className="text-sm font-semibold text-white group-hover:underline">صفحة التواصل</span>
              </Link>
            )}
          </div>

          {/* Phones: accordions */}
          <div className="border-t border-(--mx-dark-line) lg:hidden">
            {groups.map((g) => (
              <details key={g.title} className="mx-details border-b border-(--mx-dark-line)">
                <summary className="flex min-h-13 items-center justify-between font-semibold text-white">
                  {g.title}
                  <ChevronDown className="mx-chev" />
                </summary>
                <div className="pb-4">
                  <Links links={g.links} />
                </div>
              </details>
            ))}
          </div>

          {/* Desktop: columns */}
          <div className="hidden gap-8 lg:col-span-6 lg:grid lg:grid-cols-3">
            {groups.map((g) => (
              <div key={g.title} className="min-w-0">
                <h2 className="mb-4 text-lg font-semibold text-white">{g.title}</h2>
                <Links links={g.links} />
              </div>
            ))}
          </div>

          <div className="lg:col-span-3">
            {shell.description && (
              <>
                <h2 className="text-lg font-semibold text-white">عن {shell.name}</h2>
                <p className="mt-3 line-clamp-4 text-sm leading-7 text-(--mx-dark-quiet)">{shell.description}</p>
              </>
            )}
            {socials.length > 0 && (
              <ul className="mt-5 flex gap-1">
                {socials.map(({ label, href, Icon }) => (
                  <li key={label}>
                    <a href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className="mx-icon -ms-2 text-white [&_svg]:size-5">
                      <Icon aria-hidden />
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-5 border-t border-(--mx-dark-line) pt-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-2 text-xs text-(--mx-dark-quiet) sm:flex-row sm:items-center sm:gap-6">
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
          {payments.length > 0 && (
            <ul className="flex flex-wrap items-center gap-2" aria-label="طرق الدفع المتاحة">
              {payments.map((p) => (
                <li key={p.key} className="grid h-8 min-w-12 place-items-center rounded-(--mx-r-sm) bg-white px-2" title={p.label}>
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

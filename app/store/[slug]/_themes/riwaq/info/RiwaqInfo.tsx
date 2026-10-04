import Image from "next/image";
import Link from "next/link";
import { MessageCircle } from "lucide-react";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import type { AboutViewProps, ContactViewProps, StoreContact } from "../../types";
import { getSocialLinks, whatsappHref } from "../../shared/social";
import { Arrow, Empty, PageTitle, Wrap, btn, idx, num } from "../ui";
import ContactForm from "./ContactForm";

/** Ways to reach the store as big ruled rows: label small, value large. */
function Channels({ contact }: { contact: StoreContact }) {
  const wa = whatsappHref(contact.whatsapp);
  const rows = [
    ...(wa ? [{ label: "واتساب", value: contact.whatsapp!, href: wa, ltr: true }] : []),
    ...(contact.email ? [{ label: "البريد الإلكتروني", value: contact.email, href: `mailto:${contact.email}`, ltr: true }] : []),
    ...getSocialLinks(contact).map((s) => ({ label: s.label, value: "تابعنا", href: s.href, ltr: false })),
  ];
  if (rows.length === 0) return null;

  return (
    <ul className="border-t border-(--rq-ink)">
      {rows.map((r, i) => (
        <li key={r.label} className="border-b border-(--rq-rule)">
          <a
            href={r.href}
            target={r.href.startsWith("http") ? "_blank" : undefined}
            rel="noopener noreferrer"
            className="group grid min-h-20 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 py-3"
          >
            <span className="rq-num w-6 text-xs text-(--rq-accent)">{idx(i + 1)}</span>
            <span className="min-w-0">
              <span className="rq-caption block">{r.label}</span>
              <span className="rq-h3 block truncate transition-colors group-hover:text-(--rq-accent)" dir={r.ltr ? "ltr" : undefined}>
                <span className="inline-block">{r.value}</span>
              </span>
            </span>
            <Arrow className="text-lg" />
          </a>
        </li>
      ))}
    </ul>
  );
}

export function RiwaqAbout({ store, logo, coverImage, description, contact, productCount, categoryCount }: AboutViewProps) {
  const text = description?.trim() || `أهلاً بيك في ${store.name}. تصفح منتجاتنا واطلب بسهولة، وإحنا هنتواصل معاك نأكد طلبك.`;
  const [lead, ...rest] = text.split(/\n+/);

  return (
    <Wrap className="pb-6">
      <PageTitle crumbs={[{ label: "الرئيسية", href: buildStoreUrl(store.slug) }, { label: "عن المتجر" }]} title={`عن ${store.name}`} />

      {coverImage && (
        <figure className="mb-12 sm:mb-16">
          <div className="rq-plate relative aspect-[4/3] overflow-hidden sm:aspect-[21/9]">
            <Image src={coverImage} alt="" fill priority sizes="100vw" className="object-cover" />
          </div>
        </figure>
      )}

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-14">
        <div className="lg:col-span-7">
          <p className="rq-face text-[1.5rem] font-semibold leading-[1.6] sm:text-[2rem]">{lead}</p>
          {rest.length > 0 && <p className="rq-prose mt-6">{rest.join("\n")}</p>}
          <div className="mt-10 flex flex-wrap gap-3">
            <Link href={buildStoreUrl(store.slug, "/products")} className={btn({ size: "lg", className: "group" })}>
              تسوق المنتجات
              <Arrow />
            </Link>
            <Link href={buildStoreUrl(store.slug, "/contact")} className={btn({ size: "lg", variant: "line" })}>
              تواصل معنا
            </Link>
          </div>
        </div>

        <aside className="space-y-12 lg:col-span-4 lg:col-start-9">
          <div className="grid grid-cols-2 border-t border-(--rq-ink)">
            {[
              { n: productCount, label: "منتج" },
              { n: categoryCount, label: "تصنيف" },
            ].map((s, i) => (
              <div key={s.label} className={i === 1 ? "border-s border-(--rq-rule) ps-5 pt-5" : "pt-5"}>
                <p className="rq-face text-[3.5rem] font-semibold leading-none tabular-nums">{num(s.n)}</p>
                <p className="rq-caption mt-2">{s.label}</p>
              </div>
            ))}
          </div>
          {logo && (
            <span className="relative block size-20 overflow-hidden">
              <Image src={logo} alt={`شعار ${store.name}`} fill sizes="80px" className="object-cover" />
            </span>
          )}
          <div>
            <h2 className="rq-label mb-2">طرق التواصل</h2>
            <Channels contact={contact} />
            {!contact.whatsapp && !contact.email && getSocialLinks(contact).length === 0 && (
              <p className="rq-small border-t border-(--rq-ink) pt-4 text-(--rq-quiet)">المتجر هيتواصل معاك على رقمك بعد ما تطلب.</p>
            )}
          </div>
        </aside>
      </div>
    </Wrap>
  );
}

export function RiwaqContact({ store, contact }: ContactViewProps) {
  const wa = whatsappHref(contact.whatsapp);
  const hasAny = !!wa || !!contact.email || getSocialLinks(contact).length > 0;

  return (
    <Wrap className="pb-6">
      <PageTitle
        crumbs={[{ label: "الرئيسية", href: buildStoreUrl(store.slug) }, { label: "تواصل معنا" }]}
        title="تواصل معنا"
        intro="عندك سؤال عن منتج أو طلب؟ إحنا معاك."
      />

      {!hasAny ? (
        <Empty
          icon={<MessageCircle />}
          title="المتجر لسه مضافش وسيلة تواصل"
          description="لما تطلب، المتجر هيتواصل معاك على رقم الموبايل اللي هتكتبه."
          action={
            <Link href={buildStoreUrl(store.slug, "/products")} className={btn()}>
              تصفح المنتجات
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-14 lg:grid-cols-12 lg:gap-14">
          <section className="lg:col-span-6">
            <h2 className="rq-label mb-2">كلّمنا مباشرة</h2>
            <Channels contact={contact} />
          </section>
          {(wa || contact.email) && (
            <section className="lg:col-span-5 lg:col-start-8">
              <div className="rq-receipt mt-2.5 px-5 py-8 sm:px-8">
                <h2 className="rq-h3">ابعتلنا رسالة</h2>
                <p className="rq-caption mb-7 mt-1">{wa ? "هتتفتح محادثة واتساب ورسالتك جاهزة." : "هيتفتح الإيميل ورسالتك جاهزة."}</p>
                <ContactForm storeName={store.name} whatsappHref={wa} email={contact.email} />
              </div>
            </section>
          )}
        </div>
      )}
    </Wrap>
  );
}

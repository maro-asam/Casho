import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, Mail, MessageCircle, Store } from "lucide-react";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import type { AboutViewProps, ContactViewProps, StoreContact } from "../../types";
import { getSocialLinks, whatsappHref } from "../../shared/social";
import { CollectionBanner, Crumbs, Empty, Wrap, btn, num } from "../ui";
import ContactForm from "./ContactForm";

function Channels({ contact }: { contact: StoreContact }) {
  const wa = whatsappHref(contact.whatsapp);
  const rows = [
    ...(wa ? [{ label: "واتساب", value: contact.whatsapp!, href: wa, Icon: MessageCircle, ltr: true }] : []),
    ...(contact.email ? [{ label: "البريد الإلكتروني", value: contact.email, href: `mailto:${contact.email}`, Icon: Mail, ltr: true }] : []),
    ...getSocialLinks(contact).map((s) => ({ label: s.label, value: "تابعنا", href: s.href, Icon: s.Icon, ltr: false })),
  ];
  if (rows.length === 0) return null;
  return (
    <ul className="space-y-2.5">
      {rows.map(({ label, value, href, Icon, ltr }) => (
        <li key={label}>
          <a
            href={href}
            target={href.startsWith("http") ? "_blank" : undefined}
            rel="noopener noreferrer"
            className="group flex min-h-16 items-center gap-4 rounded-(--mx-r) border border-(--mx-line) px-4 py-3 transition-[border-color,box-shadow] hover:border-transparent hover:shadow-(--mx-shadow-sm)"
          >
            <span className="grid size-11 shrink-0 place-items-center rounded-(--mx-r) bg-(--mx-tint) text-(--mx-link) [&_svg]:size-5">
              <Icon aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-xs text-(--mx-quiet)">{label}</span>
              <span className="mt-0.5 block truncate font-semibold text-(--mx-ink)" dir={ltr ? "ltr" : undefined}>
                <span className="inline-block">{value}</span>
              </span>
            </span>
            <ChevronLeft aria-hidden className="size-4 shrink-0 text-(--mx-quiet) transition-transform group-hover:-translate-x-0.5 ltr:rotate-180 ltr:group-hover:translate-x-0.5" />
          </a>
        </li>
      ))}
    </ul>
  );
}

export function MaxAbout({ store, logo, coverImage, description, contact, productCount, categoryCount }: AboutViewProps) {
  return (
    <Wrap className="pb-12">
      <CollectionBanner title={`عن ${store.name}`} image={coverImage} />
      <Crumbs className="py-4" items={[{ label: "الرئيسية", href: buildStoreUrl(store.slug) }, { label: "عن المتجر" }]} />

      <div className="mt-4 grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-16">
        <div>
          <span className="relative mb-6 grid size-16 place-items-center overflow-hidden rounded-(--mx-r-lg) bg-(--mx-plate)">
            {logo ? <Image src={logo} alt="" fill sizes="64px" className="object-cover" /> : <Store className="size-7 text-(--mx-quiet)" />}
          </span>
          <p className="max-w-[66ch] whitespace-pre-line text-[1.0625rem] leading-8 text-(--mx-ink)">
            {description?.trim() || `أهلاً بيك في ${store.name}. تصفح منتجاتنا واطلب بسهولة، وإحنا هنتواصل معاك لتأكيد طلبك.`}
          </p>
          <dl className="mt-8 grid max-w-md grid-cols-2 gap-(--mx-gap)">
            {[
              { n: productCount, l: "منتج" },
              { n: categoryCount, l: "تصنيف" },
            ].map((s) => (
              <div key={s.l} className="flex flex-col-reverse rounded-(--mx-r-lg) bg-(--mx-band) p-5">
                <dt className="mt-1 text-sm">{s.l}</dt>
                <dd className="mx-display text-4xl leading-none text-(--mx-link)">{num(s.n)}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={buildStoreUrl(store.slug, "/products")} className={btn({ size: "lg" })}>
              تسوق المنتجات
            </Link>
            <Link href={buildStoreUrl(store.slug, "/contact")} className={btn({ size: "lg", variant: "outline" })}>
              تواصل معنا
            </Link>
          </div>
        </div>
        <aside>
          <h2 className="mx-h4 mb-4">طرق التواصل</h2>
          <Channels contact={contact} />
          {!contact.whatsapp && !contact.email && getSocialLinks(contact).length === 0 && <p className="text-sm text-(--mx-quiet)">المتجر هيتواصل معاك على رقمك بعد ما تطلب.</p>}
        </aside>
      </div>
    </Wrap>
  );
}

export function MaxContact({ store, contact }: ContactViewProps) {
  const wa = whatsappHref(contact.whatsapp);
  const hasAny = !!wa || !!contact.email || getSocialLinks(contact).length > 0;
  return (
    <Wrap className="pb-12">
      <CollectionBanner title="تواصل معنا" note="عندك سؤال عن منتج أو طلب؟ إحنا معاك." />
      <Crumbs className="py-4" items={[{ label: "الرئيسية", href: buildStoreUrl(store.slug) }, { label: "تواصل معنا" }]} />
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
        <div className="mt-4 grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">
          <section>
            <h2 className="mx-h4 mb-4">كلّمنا مباشرة</h2>
            <Channels contact={contact} />
          </section>
          {(wa || contact.email) && (
            <section className="rounded-(--mx-r-lg) border border-(--mx-line) p-5 sm:p-8">
              <h2 className="mx-h3">ابعتلنا رسالة</h2>
              <p className="mb-6 mt-1 text-sm text-(--mx-quiet)">{wa ? "هتتفتح محادثة واتساب ورسالتك جاهزة." : "هيتفتح الإيميل ورسالتك جاهزة."}</p>
              <ContactForm storeName={store.name} whatsappHref={wa} email={contact.email} />
            </section>
          )}
        </div>
      )}
    </Wrap>
  );
}

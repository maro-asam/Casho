import Image from "next/image";
import Link from "next/link";
import { Mail, MessageCircle, Store } from "lucide-react";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import type { AboutViewProps, ContactViewProps, StoreContact, TrackViewProps } from "../../types";
import { OrderTracker, type TrackSkin } from "../../shared/track/OrderTracker";
import { getSocialLinks, whatsappHref } from "../../shared/social";
import { Arrow, Crumbs, Empty, PageTitle, Wrap, btn, delay, num } from "../ui";
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
    <ul className="divide-y divide-(--dn-line) border-y border-(--dn-line)">
      {rows.map(({ label, value, href, Icon, ltr }) => (
        <li key={label}>
          <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" className="group flex min-h-18 items-center gap-4 py-3">
            <Icon aria-hidden className="size-5 shrink-0 text-(--dn-quiet)" />
            <span className="min-w-0 flex-1">
              <span className="dn-label block text-(--dn-quiet)">{label}</span>
              <span className="mt-0.5 block truncate" dir={ltr ? "ltr" : undefined}>
                <span className="inline-block">{value}</span>
              </span>
            </span>
            <Arrow className="shrink-0 text-(--dn-quiet) transition-transform duration-500 group-hover:-translate-x-1 ltr:group-hover:translate-x-1" />
          </a>
        </li>
      ))}
    </ul>
  );
}

export function DuneAbout({ store, logo, coverImage, description, contact, productCount, categoryCount }: AboutViewProps) {
  return (
    <div className="pb-12">
      {coverImage ? (
        <header data-reveal className="relative overflow-hidden bg-(--dn-accent) text-white">
          <div className="absolute inset-0">
            <div data-parallax className="absolute inset-x-0 -inset-y-[14%]">
              <Image src={coverImage} alt="" fill priority sizes="100vw" className="object-cover" />
            </div>
          </div>
          <span aria-hidden className="absolute inset-0 bg-[rgb(20_20_18/0.42)]" />
          <div className="dn-wrap relative flex min-h-[22rem] flex-col items-center justify-center py-16 text-center sm:min-h-[30rem]">
            <Crumbs items={[{ label: "الرئيسية", href: buildStoreUrl(store.slug) }, { label: "عن المتجر" }]} className="dn-appear [&_li]:flex-none [&_ol]:justify-center [&_ol]:text-white/80 [&_[aria-current]]:text-white" />
            <h1 className="dn-hero dn-appear mt-5 text-balance text-[clamp(2.5rem,6vw,5rem)]" style={delay(1)}>
              عن {store.name}
            </h1>
          </div>
        </header>
      ) : (
        <Wrap>
          <PageTitle title={`عن ${store.name}`} crumbs={[{ label: "الرئيسية", href: buildStoreUrl(store.slug) }, { label: "عن المتجر" }]} />
        </Wrap>
      )}

      <Wrap data-reveal className="mt-12 grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-20">
        <div>
          <span className="dn-appear relative mb-8 grid size-16 place-items-center overflow-hidden rounded-full bg-(--dn-plate)">
            {logo ? <Image src={logo} alt="" fill sizes="64px" className="object-cover" /> : <Store className="size-7 text-(--dn-quiet)" />}
          </span>
          <p className="dn-serif dn-appear text-[clamp(1.5rem,2.4vw,2rem)] leading-[1.6] whitespace-pre-line" style={delay(1)}>
            {description?.trim() || `أهلاً بيك في ${store.name}. تصفح منتجاتنا واطلب بسهولة، وإحنا هنتواصل معاك لتأكيد طلبك.`}
          </p>
          <dl className="dn-appear mt-10 grid max-w-md grid-cols-2 border-y border-(--dn-line)" style={delay(2)}>
            {[
              { n: productCount, l: "منتج" },
              { n: categoryCount, l: "تصنيف" },
            ].map((s, i) => (
              <div key={s.l} className={i === 0 ? "flex flex-col-reverse border-e border-(--dn-line) py-6" : "flex flex-col-reverse py-6 ps-6"}>
                <dt className="mt-2 text-sm text-(--dn-quiet)">{s.l}</dt>
                <dd className="dn-num text-5xl leading-none">{num(s.n)}</dd>
              </div>
            ))}
          </dl>
          <div className="dn-appear mt-10 flex flex-wrap gap-3" style={delay(3)}>
            <Link href={buildStoreUrl(store.slug, "/products")} className={btn({ size: "lg" })}>
              تسوق المنتجات
            </Link>
            <Link href={buildStoreUrl(store.slug, "/contact")} className={btn({ size: "lg", variant: "outline" })}>
              تواصل معنا
            </Link>
          </div>
        </div>
        <aside className="dn-appear" style={delay(2)}>
          <h2 className="dn-label mb-4">طرق التواصل</h2>
          <Channels contact={contact} />
          {!contact.whatsapp && !contact.email && getSocialLinks(contact).length === 0 && <p className="text-sm text-(--dn-quiet)">المتجر هيتواصل معاك على رقمك بعد ما تطلب.</p>}
        </aside>
      </Wrap>
    </div>
  );
}

export function DuneContact({ store, contact }: ContactViewProps) {
  const wa = whatsappHref(contact.whatsapp);
  const hasAny = !!wa || !!contact.email || getSocialLinks(contact).length > 0;
  return (
    <Wrap className="pb-12">
      <PageTitle title="تواصل معنا" crumbs={[{ label: "الرئيسية", href: buildStoreUrl(store.slug) }, { label: "تواصل معنا" }]} note="عندك سؤال عن منتج أو طلب؟ إحنا معاك." />
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
        <div data-reveal className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-20">
          <section className="dn-appear">
            <h2 className="dn-label mb-4">كلّمنا مباشرة</h2>
            <Channels contact={contact} />
          </section>
          {(wa || contact.email) && (
            <section className="dn-appear bg-(--dn-plate) p-6 sm:p-10" style={delay(1)}>
              <h2 className="dn-h3">ابعتلنا رسالة</h2>
              <p className="mb-7 mt-2 text-sm text-(--dn-quiet)">{wa ? "هتتفتح محادثة واتساب ورسالتك جاهزة." : "هيتفتح الإيميل ورسالتك جاهزة."}</p>
              <ContactForm storeName={store.name} whatsappHref={wa} email={contact.email} />
            </section>
          )}
        </div>
      )}
    </Wrap>
  );
}

const TRACK_SKIN: TrackSkin = {
  label: "dn-label",
  field: "dn-field",
  button: btn({ size: "lg", full: true }),
  secondary: btn({ variant: "outline" }),
  panel: "bg-(--dn-plate) p-6 sm:p-8",
  ok: "var(--dn-success)",
  warn: "var(--dn-warn)",
  bad: "var(--dn-sale)",
};

export function DuneTrack({ store, whatsapp, initialCode, order }: TrackViewProps) {
  return (
    <Wrap className="pb-12">
      <PageTitle
        title="تتبّع طلبك"
        crumbs={[{ label: "الرئيسية", href: buildStoreUrl(store.slug) }, { label: "تتبّع طلبك" }]}
        note={order ? undefined : "اكتب رقم الطلب والموبايل اللي طلبت بيه، وتابع طلبك خطوة بخطوة."}
      />
      <OrderTracker storeSlug={store.slug} whatsapp={whatsapp} initialCode={initialCode} initialOrder={order} skin={TRACK_SKIN} />
    </Wrap>
  );
}

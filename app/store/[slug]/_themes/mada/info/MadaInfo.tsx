import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, Mail, MessageCircle, Store } from "lucide-react";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import type { AboutViewProps, ContactViewProps, StoreContact, TrackViewProps } from "../../types";
import { OrderTracker, type TrackSkin } from "../../shared/track/OrderTracker";
import { getSocialLinks, whatsappHref } from "../../shared/social";
import { Arrow, Crumbs, Empty, Wrap, btn, num } from "../ui";
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
    <ul className="space-y-2">
      {rows.map(({ label, value, href, Icon, ltr }) => (
        <li key={label}>
          <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" className="md-panel flex min-h-16 items-center gap-4 px-4 py-3 transition-shadow hover:shadow-(--md-shadow-pop)">
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-(--md-signal) text-(--md-signal-ink) [&_svg]:size-5">
              <Icon aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-xs text-(--md-quiet)">{label}</span>
              <span className="block truncate font-semibold" dir={ltr ? "ltr" : undefined}>
                <span className="inline-block">{value}</span>
              </span>
            </span>
            <ChevronLeft aria-hidden className="size-4 shrink-0 text-(--md-quiet) ltr:rotate-180" />
          </a>
        </li>
      ))}
    </ul>
  );
}

export function MadaAbout({ store, logo, coverImage, description, contact, productCount, categoryCount }: AboutViewProps) {
  return (
    <Wrap className="pb-10">
      <div className="pb-6 pt-5 sm:pt-7">
        <Crumbs items={[{ label: "الرئيسية", href: buildStoreUrl(store.slug) }, { label: "عن المتجر" }]} />
      </div>
      <div className="relative overflow-hidden rounded-[1.75rem] bg-(--md-brand) text-(--md-brand-ink)">
        {coverImage && (
          <>
            <Image src={coverImage} alt="" fill priority sizes="100vw" className="object-cover" />
            <span aria-hidden className="absolute inset-0 bg-[linear-gradient(to_top,rgb(12_17_15/0.8),rgb(12_17_15/0.2))]" />
          </>
        )}
        <div className="relative flex min-h-64 flex-col justify-end p-6 sm:min-h-80 sm:p-12">
          <span className="relative grid size-16 place-items-center overflow-hidden rounded-2xl bg-white text-[#121714]">
            {logo ? <Image src={logo} alt="" fill sizes="64px" className="object-cover" /> : <Store className="size-7" />}
          </span>
          <h1 className="md-h1 mt-5 text-white">عن {store.name}</h1>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-12">
        <div>
          <p className="md-prose text-base sm:text-[1.0625rem]">
            {description?.trim() || `أهلاً بيك في ${store.name}. تصفح منتجاتنا واطلب بسهولة، وإحنا هنتواصل معاك لتأكيد طلبك.`}
          </p>
          <div className="mt-8 grid max-w-md grid-cols-2 gap-3">
            {[
              { n: productCount, l: "منتج" },
              { n: categoryCount, l: "تصنيف" },
            ].map((s) => (
              <div key={s.l} className="md-panel p-5">
                <p className="md-face text-3xl font-bold tabular-nums">{num(s.n)}</p>
                <p className="mt-1 text-sm text-(--md-quiet)">{s.l}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap gap-2.5">
            <Link href={buildStoreUrl(store.slug, "/products")} className={btn({ size: "lg" })}>
              تسوق المنتجات
              <Arrow />
            </Link>
            <Link href={buildStoreUrl(store.slug, "/contact")} className={btn({ size: "lg", variant: "outline" })}>
              تواصل معنا
            </Link>
          </div>
        </div>
        <aside>
          <h2 className="mb-3 text-sm font-semibold">طرق التواصل</h2>
          <Channels contact={contact} />
          {!contact.whatsapp && !contact.email && getSocialLinks(contact).length === 0 && (
            <p className="md-panel p-4 text-sm text-(--md-quiet)">المتجر هيتواصل معاك على رقمك بعد ما تطلب.</p>
          )}
        </aside>
      </div>
    </Wrap>
  );
}

export function MadaContact({ store, contact }: ContactViewProps) {
  const wa = whatsappHref(contact.whatsapp);
  const hasAny = !!wa || !!contact.email || getSocialLinks(contact).length > 0;
  return (
    <Wrap className="pb-10">
      <header className="pb-8 pt-5 sm:pt-7">
        <Crumbs items={[{ label: "الرئيسية", href: buildStoreUrl(store.slug) }, { label: "تواصل معنا" }]} />
        <h1 className="md-h1 mt-4">تواصل معنا</h1>
        <p className="mt-2 text-sm text-(--md-quiet)">عندك سؤال عن منتج أو طلب؟ إحنا معاك.</p>
      </header>
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
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
          <section>
            <h2 className="mb-3 text-sm font-semibold">كلّمنا مباشرة</h2>
            <Channels contact={contact} />
          </section>
          {(wa || contact.email) && (
            <section className="md-panel p-5 sm:p-8">
              <h2 className="md-h3">ابعتلنا رسالة</h2>
              <p className="mb-6 mt-1 text-sm text-(--md-quiet)">{wa ? "هتتفتح محادثة واتساب ورسالتك جاهزة." : "هيتفتح الإيميل ورسالتك جاهزة."}</p>
              <ContactForm storeName={store.name} whatsappHref={wa} email={contact.email} />
            </section>
          )}
        </div>
      )}
    </Wrap>
  );
}

const TRACK_SKIN: TrackSkin = {
  label: "text-sm font-medium",
  field: "md-field",
  button: btn({ size: "lg", full: true }),
  secondary: btn({ variant: "outline" }),
  panel: "md-panel p-5 sm:p-7",
  ok: "var(--md-success)",
  warn: "var(--md-warn)",
  bad: "var(--md-sale)",
};

export function MadaTrack({ store, whatsapp, initialCode, order }: TrackViewProps) {
  return (
    <Wrap className="pb-10">
      <header className="pb-8 pt-5 sm:pt-7">
        <Crumbs items={[{ label: "الرئيسية", href: buildStoreUrl(store.slug) }, { label: "تتبّع طلبك" }]} />
        <h1 className="md-h1 mt-4">تتبّع طلبك</h1>
        {!order && <p className="mt-2 text-sm text-(--md-quiet)">اكتب رقم الطلب والموبايل اللي طلبت بيه، وتابع طلبك خطوة بخطوة.</p>}
      </header>
      <OrderTracker storeSlug={store.slug} whatsapp={whatsapp} initialCode={initialCode} initialOrder={order} skin={TRACK_SKIN} />
    </Wrap>
  );
}

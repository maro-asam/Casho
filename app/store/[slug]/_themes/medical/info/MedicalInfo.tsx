import Image from "next/image";
import Link from "next/link";
import { ClipboardPlus, Mail, MessageCircle, Store } from "lucide-react";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import type { AboutViewProps, ContactViewProps, StoreContact, TrackViewProps } from "../../types";
import { OrderTracker, type TrackSkin } from "../../shared/track/OrderTracker";
import { getSocialLinks, whatsappHref } from "../../shared/social";
import { RX_MESSAGE, waWith } from "../lib/rx";
import { Chevron, Empty, PageHead, Wrap, btn, num } from "../ui";
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
            className="group flex min-h-16 items-center gap-4 rounded-(--rx-r) border border-(--rx-line) bg-(--rx-card) px-4 py-3 transition-colors hover:border-(--rx-btn)"
          >
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-(--rx-tint) text-(--rx-btn) [&_svg]:size-5">
              <Icon aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-xs text-(--rx-quiet)">{label}</span>
              <span className="mt-0.5 block truncate font-bold text-(--rx-ink)" dir={ltr ? "ltr" : undefined}>
                <span className="inline-block">{value}</span>
              </span>
            </span>
            <Chevron className="text-(--rx-quiet) group-hover:text-(--rx-btn)" />
          </a>
        </li>
      ))}
    </ul>
  );
}

function RxShortcut({ whatsapp }: { whatsapp: string }) {
  return (
    <a href={waWith(whatsapp, RX_MESSAGE)} target="_blank" rel="noopener noreferrer" className="rx-pluses mt-4 flex items-center gap-4 rounded-(--rx-r) bg-(--rx-tint) p-4 text-(--rx-btn)">
      <ClipboardPlus className="size-8 shrink-0" strokeWidth={1.5} />
      <span className="min-w-0 flex-1 text-(--rx-tint-ink)">
        <span className="block font-bold">عندك روشتة؟</span>
        <span className="block text-sm opacity-85">صوّرها وابعتها على واتساب المتجر.</span>
      </span>
      <Chevron />
    </a>
  );
}

export function MedicalAbout({ store, logo, coverImage, description, contact, productCount, categoryCount }: AboutViewProps) {
  const wa = whatsappHref(contact.whatsapp);
  return (
    <Wrap className="pb-12">
      <PageHead title={`عن ${store.name}`} crumbs={[{ label: "الرئيسية", href: buildStoreUrl(store.slug) }, { label: "عن المتجر" }]} image={coverImage} />

      <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-14">
        <div>
          <span className="relative mb-6 grid size-16 place-items-center overflow-hidden rounded-(--rx-r) border border-(--rx-line) bg-(--rx-card)">
            {logo ? <Image src={logo} alt="" fill sizes="64px" className="object-cover" /> : <Store className="size-7 text-(--rx-quiet)" />}
          </span>
          <p className="max-w-[66ch] whitespace-pre-line text-[1.0625rem] leading-8 text-(--rx-ink)">
            {description?.trim() || `أهلاً بيك في ${store.name}. تصفح منتجاتنا واطلب بسهولة، وإحنا هنتواصل معاك لتأكيد طلبك.`}
          </p>
          <dl className="mt-8 grid max-w-md grid-cols-2 gap-(--rx-gap)">
            {[
              { n: productCount, l: "منتج" },
              { n: categoryCount, l: "قسم" },
            ].map((s) => (
              <div key={s.l} className="flex flex-col-reverse rounded-(--rx-r) bg-(--rx-tint) p-5 text-(--rx-tint-ink)">
                <dt className="mt-1 text-sm opacity-85">{s.l}</dt>
                <dd className="text-4xl leading-none font-bold">{num(s.n)}</dd>
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
          <h2 className="rx-h4 mb-4">طرق التواصل</h2>
          <Channels contact={contact} />
          {wa && <RxShortcut whatsapp={wa} />}
          {!contact.whatsapp && !contact.email && getSocialLinks(contact).length === 0 && <p className="text-sm text-(--rx-quiet)">المتجر هيتواصل معاك على رقمك بعد ما تطلب.</p>}
        </aside>
      </div>
    </Wrap>
  );
}

export function MedicalContact({ store, contact }: ContactViewProps) {
  const wa = whatsappHref(contact.whatsapp);
  const hasAny = !!wa || !!contact.email || getSocialLinks(contact).length > 0;
  return (
    <Wrap className="pb-12">
      <PageHead title="تواصل معنا" note="عندك سؤال عن منتج أو طلب؟ إحنا معاك." crumbs={[{ label: "الرئيسية", href: buildStoreUrl(store.slug) }, { label: "تواصل معنا" }]} />
      <div className="h-8" />
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
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-14">
          <section>
            <h2 className="rx-h4 mb-4">كلّمنا مباشرة</h2>
            <Channels contact={contact} />
            {wa && <RxShortcut whatsapp={wa} />}
          </section>
          {(wa || contact.email) && (
            <section className="rx-panel p-5 sm:p-8">
              <h2 className="rx-h3">ابعتلنا رسالة</h2>
              <p className="mb-6 mt-1 text-sm text-(--rx-quiet)">{wa ? "هتتفتح محادثة واتساب ورسالتك جاهزة." : "هيتفتح الإيميل ورسالتك جاهزة."}</p>
              <ContactForm storeName={store.name} whatsappHref={wa} email={contact.email} />
            </section>
          )}
        </div>
      )}
    </Wrap>
  );
}

const TRACK_SKIN: TrackSkin = {
  label: "text-sm font-bold text-(--rx-ink)",
  field: "rx-field",
  button: btn({ size: "lg", full: true }),
  secondary: btn({ variant: "outline" }),
  panel: "rx-panel p-5 sm:p-6",
  ok: "var(--rx-ok)",
  warn: "var(--rx-warn)",
  bad: "var(--rx-sale)",
};

export function MedicalTrack({ store, whatsapp, initialCode, order }: TrackViewProps) {
  return (
    <Wrap className="pb-12">
      <PageHead
        title="تتبّع طلبك"
        note={order ? undefined : "اكتب رقم الطلب والموبايل اللي طلبت بيه، وتابع طلبك خطوة بخطوة."}
        crumbs={[{ label: "الرئيسية", href: buildStoreUrl(store.slug) }, { label: "تتبّع طلبك" }]}
      />
      <div className="mt-8">
        <OrderTracker storeSlug={store.slug} whatsapp={whatsapp} initialCode={initialCode} initialOrder={order} skin={TRACK_SKIN} />
      </div>
    </Wrap>
  );
}

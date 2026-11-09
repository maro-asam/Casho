import Image from "next/image";
import Link from "next/link";
import { Mail, MessageCircle, Store } from "lucide-react";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import type { AboutViewProps, ContactViewProps, StoreContact, PolicyViewProps, TrackViewProps } from "../../types";
import { OrderTracker, type TrackSkin } from "../../shared/track/OrderTracker";
import { PolicyDocument, type PolicySkin } from "../../shared/policies/PolicyDocument";
import { getSocialLinks, whatsappHref } from "../../shared/social";
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
            className="group flex min-h-16 items-center gap-4 rounded-(--mk-r) border border-(--mk-sep) bg-(--mk-cell) px-4 py-3 transition-colors hover:border-(--mk-btn)"
          >
            <span className="grid size-11 shrink-0 place-items-center rounded-(--mk-r-sm) bg-(--mk-wash) text-(--mk-tint) [&_svg]:size-5">
              <Icon aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-xs text-(--mk-label-2)">{label}</span>
              <span className="mt-0.5 block truncate font-bold text-(--mk-ink)" dir={ltr ? "ltr" : undefined}>
                <span className="inline-block">{value}</span>
              </span>
            </span>
            <Chevron className="text-(--mk-label-2) group-hover:text-(--mk-tint)" />
          </a>
        </li>
      ))}
    </ul>
  );
}

export function MarketAbout({ store, logo, coverImage, description, contact, productCount, categoryCount }: AboutViewProps) {
  return (
    <Wrap className="pb-12">
      <PageHead title={`عن ${store.name}`} crumbs={[{ label: "الرئيسية", href: buildStoreUrl(store.slug) }, { label: "عن المتجر" }]} image={coverImage} />

      <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-14">
        <div>
          <span className="relative mb-6 grid size-16 place-items-center overflow-hidden rounded-(--mk-r) border border-(--mk-sep) bg-(--mk-cell)">
            {logo ? <Image src={logo} alt="" fill sizes="64px" className="object-cover" /> : <Store className="size-7 text-(--mk-label-2)" />}
          </span>
          <p className="max-w-[66ch] whitespace-pre-line text-[1.0625rem] leading-8 text-(--mk-ink)">
            {description?.trim() || `أهلاً بيك في ${store.name}. تصفح منتجاتنا واطلب بسهولة، وإحنا هنتواصل معاك لتأكيد طلبك.`}
          </p>
          <dl className="mt-8 grid max-w-md grid-cols-2 gap-(--mk-gap)">
            {[
              { n: productCount, l: "منتج" },
              { n: categoryCount, l: "قسم" },
            ].map((s) => (
              <div key={s.l} className="flex flex-col-reverse rounded-(--mk-r) bg-(--mk-btn) p-5 text-(--mk-btn-ink)">
                <dt className="mt-1 text-sm opacity-85">{s.l}</dt>
                <dd className="text-5xl leading-none font-black">{num(s.n)}</dd>
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
          <h2 className="mk-h4 mb-4">طرق التواصل</h2>
          <Channels contact={contact} />
          {!contact.whatsapp && !contact.email && getSocialLinks(contact).length === 0 && <p className="text-sm text-(--mk-label-2)">المتجر هيتواصل معاك على رقمك بعد ما تطلب.</p>}
        </aside>
      </div>
    </Wrap>
  );
}

export function MarketContact({ store, contact }: ContactViewProps) {
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
            <h2 className="mk-h4 mb-4">كلّمنا مباشرة</h2>
            <Channels contact={contact} />
          </section>
          {(wa || contact.email) && (
            <section className="mk-panel p-5 sm:p-8">
              <h2 className="mk-h3">ابعتلنا رسالة</h2>
              <p className="mb-6 mt-1 text-sm text-(--mk-label-2)">{wa ? "هتتفتح محادثة واتساب ورسالتك جاهزة." : "هيتفتح الإيميل ورسالتك جاهزة."}</p>
              <ContactForm storeName={store.name} whatsappHref={wa} email={contact.email} />
            </section>
          )}
        </div>
      )}
    </Wrap>
  );
}

const TRACK_SKIN: TrackSkin = {
  label: "text-sm font-bold text-(--mk-ink)",
  field: "mk-field",
  button: btn({ size: "lg", full: true }),
  secondary: btn({ variant: "outline" }),
  panel: "mk-panel p-5 sm:p-6",
  ok: "var(--mk-ok)",
  warn: "var(--mk-warn)",
  bad: "var(--mk-sale)",
};

export function MarketTrack({ store, whatsapp, initialCode, order }: TrackViewProps) {
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

export function MarketPolicy({ store, policy, policies }: PolicyViewProps) {
  return (
    <Wrap className="pb-12">
      <PageHead title={policy.title} crumbs={[{ label: "الرئيسية", href: buildStoreUrl(store.slug) }, { label: policy.title }]} />
      <div className="mt-8">
        <PolicyDocument storeSlug={store.slug} policy={policy} policies={policies} skin={POLICY_SKIN} />
      </div>
    </Wrap>
  );
}

const POLICY_SKIN: PolicySkin = {
  heading: "mk-h3",
  text: "text-(--mk-ink)",
  meta: "text-(--mk-quiet)",
  navItem: "rounded-full border border-(--mk-line) px-4 text-(--mk-quiet) hover:text-(--mk-ink) lg:rounded-(--mk-r-sm) lg:border-transparent lg:px-3",
  navActive: "border-(--mk-ink) text-(--mk-ink) font-semibold lg:border-transparent lg:bg-(--mk-fill)",
  marker: "var(--mk-tint)",
};

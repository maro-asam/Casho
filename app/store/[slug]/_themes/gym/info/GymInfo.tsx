import Image from "next/image";
import Link from "next/link";
import { Mail, MessageCircle, Store } from "lucide-react";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import type { AboutViewProps, ContactViewProps, StoreContact, PolicyViewProps, TrackViewProps } from "../../types";
import { OrderTracker, type TrackSkin } from "../../shared/track/OrderTracker";
import { PolicyDocument, type PolicySkin } from "../../shared/policies/PolicyDocument";
import { getSocialLinks, whatsappHref } from "../../shared/social";
import { COACH_MESSAGE, waWith } from "../lib/coach";
import { Chevron, Empty, PageHead, Wrap, btn, num } from "../ui";
import ContactForm from "./ContactForm";
import { st } from "@/lib/i18n/storefront";

function Channels({ contact }: { contact: StoreContact }) {
  const wa = whatsappHref(contact.whatsapp);
  const rows = [
    ...(wa ? [{ label: st("واتساب"), value: contact.whatsapp!, href: wa, Icon: MessageCircle, ltr: true }] : []),
    ...(contact.email ? [{ label: st("البريد الإلكتروني"), value: contact.email, href: `mailto:${contact.email}`, Icon: Mail, ltr: true }] : []),
    ...getSocialLinks(contact).map((s) => ({ label: s.label, value: st("تابعنا"), href: s.href, Icon: s.Icon, ltr: false })),
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
            className="group flex min-h-16 items-center gap-4 rounded-(--gy-r) border border-(--gy-line) bg-(--gy-card) px-4 py-3 transition-colors hover:border-(--gy-btn)"
          >
            <span className="grid size-11 shrink-0 place-items-center rounded-(--gy-r-sm) bg-(--gy-tint) text-(--gy-link) [&_svg]:size-5">
              <Icon aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-xs text-(--gy-quiet)">{label}</span>
              <span className="mt-0.5 block truncate font-bold text-(--gy-ink)" dir={ltr ? "ltr" : undefined}>
                <span className="inline-block">{value}</span>
              </span>
            </span>
            <Chevron className="text-(--gy-quiet) group-hover:text-(--gy-link)" />
          </a>
        </li>
      ))}
    </ul>
  );
}

function CoachShortcut({ whatsapp }: { whatsapp: string }) {
  return (
    <a href={waWith(whatsapp, COACH_MESSAGE)} target="_blank" rel="noopener noreferrer" className="gy-knurl mt-4 flex items-center gap-4 rounded-(--gy-r) bg-(--gy-btn) p-4 text-(--gy-btn-ink)">
      <MessageCircle className="size-8 shrink-0" strokeWidth={1.75} />
      <span className="min-w-0 flex-1">
        <span className="block font-extrabold">{st("محتار تبدأ بإيه؟")}</span>
        <span className="block text-sm opacity-90">{st("قولنا محتاج إيه على واتساب ونرشحلك اللي يناسبك.")}</span>
      </span>
      <Chevron />
    </a>
  );
}

export function GymAbout({ store, logo, coverImage, description, contact, productCount, categoryCount }: AboutViewProps) {
  const wa = whatsappHref(contact.whatsapp);
  return (
    <Wrap className="pb-12">
      <PageHead title={st("عن {0}", store.name)} crumbs={[{ label: st("الرئيسية"), href: buildStoreUrl(store.slug) }, { label: st("عن المتجر") }]} image={coverImage} />

      <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-14">
        <div>
          <span className="relative mb-6 grid size-16 place-items-center overflow-hidden rounded-(--gy-r) border border-(--gy-line) bg-(--gy-card)">
            {logo ? <Image src={logo} alt="" fill sizes="64px" className="object-cover" /> : <Store className="size-7 text-(--gy-quiet)" />}
          </span>
          <p className="max-w-[66ch] whitespace-pre-line text-[1.0625rem] leading-8 text-(--gy-ink)">
            {description?.trim() || st("أهلاً بيك في {0}. تصفح منتجاتنا واطلب بسهولة، وإحنا هنتواصل معاك لتأكيد طلبك.", store.name)}
          </p>
          <dl className="mt-8 grid max-w-md grid-cols-2 gap-(--gy-gap)">
            {[
              { n: productCount, l: st("منتج") },
              { n: categoryCount, l: st("قسم") },
            ].map((s) => (
              <div key={s.l} className="flex flex-col-reverse rounded-(--gy-r) bg-(--gy-btn) p-5 text-(--gy-btn-ink)">
                <dt className="mt-1 text-sm opacity-85">{s.l}</dt>
                <dd className="text-5xl leading-none font-black">{num(s.n)}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={buildStoreUrl(store.slug, "/products")} className={btn({ size: "lg" })}>
              {st("تسوق المنتجات")}
            </Link>
            <Link href={buildStoreUrl(store.slug, "/contact")} className={btn({ size: "lg", variant: "outline" })}>
              {st("تواصل معنا")}
            </Link>
          </div>
        </div>
        <aside>
          <h2 className="gy-h4 mb-4">{st("طرق التواصل")}</h2>
          <Channels contact={contact} />
          {wa && <CoachShortcut whatsapp={wa} />}
          {!contact.whatsapp && !contact.email && getSocialLinks(contact).length === 0 && <p className="text-sm text-(--gy-quiet)">{st("المتجر هيتواصل معاك على رقمك بعد ما تطلب.")}</p>}
        </aside>
      </div>
    </Wrap>
  );
}

export function GymContact({ store, contact }: ContactViewProps) {
  const wa = whatsappHref(contact.whatsapp);
  const hasAny = !!wa || !!contact.email || getSocialLinks(contact).length > 0;
  return (
    <Wrap className="pb-12">
      <PageHead title={st("تواصل معنا")} note={st("عندك سؤال عن منتج أو طلب؟ إحنا معاك.")} crumbs={[{ label: st("الرئيسية"), href: buildStoreUrl(store.slug) }, { label: st("تواصل معنا") }]} />
      <div className="h-8" />
      {!hasAny ? (
        <Empty
          icon={<MessageCircle />}
          title={st("المتجر لسه مضافش وسيلة تواصل")}
          description={st("لما تطلب، المتجر هيتواصل معاك على رقم الموبايل اللي هتكتبه.")}
          action={
            <Link href={buildStoreUrl(store.slug, "/products")} className={btn()}>
              {st("تصفح المنتجات")}
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-14">
          <section>
            <h2 className="gy-h4 mb-4">{st("كلّمنا مباشرة")}</h2>
            <Channels contact={contact} />
            {wa && <CoachShortcut whatsapp={wa} />}
          </section>
          {(wa || contact.email) && (
            <section className="gy-panel p-5 sm:p-8">
              <h2 className="gy-h3">{st("ابعتلنا رسالة")}</h2>
              <p className="mb-6 mt-1 text-sm text-(--gy-quiet)">{wa ? st("هتتفتح محادثة واتساب ورسالتك جاهزة.") : st("هيتفتح الإيميل ورسالتك جاهزة.")}</p>
              <ContactForm storeName={store.name} whatsappHref={wa} email={contact.email} />
            </section>
          )}
        </div>
      )}
    </Wrap>
  );
}

const TRACK_SKIN: TrackSkin = {
  label: "text-sm font-bold text-(--gy-ink)",
  field: "gy-field",
  button: btn({ size: "lg", full: true }),
  secondary: btn({ variant: "outline" }),
  panel: "gy-panel p-5 sm:p-6",
  ok: "var(--gy-ok)",
  warn: "var(--gy-warn)",
  bad: "var(--gy-sale)",
};

export function GymTrack({ store, whatsapp, initialCode, order }: TrackViewProps) {
  return (
    <Wrap className="pb-12">
      <PageHead
        title={st("تتبّع طلبك")}
        note={order ? undefined : st("اكتب رقم الطلب والموبايل اللي طلبت بيه، وتابع طلبك خطوة بخطوة.")}
        crumbs={[{ label: st("الرئيسية"), href: buildStoreUrl(store.slug) }, { label: st("تتبّع طلبك") }]}
      />
      <div className="mt-8">
        <OrderTracker storeSlug={store.slug} whatsapp={whatsapp} initialCode={initialCode} initialOrder={order} skin={TRACK_SKIN} />
      </div>
    </Wrap>
  );
}

export function GymPolicy({ store, policy, policies }: PolicyViewProps) {
  return (
    <Wrap className="pb-12">
      <PageHead title={policy.title} crumbs={[{ label: st("الرئيسية"), href: buildStoreUrl(store.slug) }, { label: policy.title }]} />
      <div className="mt-8">
        <PolicyDocument storeSlug={store.slug} policy={policy} policies={policies} skin={POLICY_SKIN} />
      </div>
    </Wrap>
  );
}

const POLICY_SKIN: PolicySkin = {
  heading: "gy-h3",
  text: "text-(--gy-ink)",
  meta: "text-(--gy-quiet)",
  navItem: "rounded-(--gy-r-sm) border border-(--gy-line) px-4 text-(--gy-quiet) hover:text-(--gy-ink) lg:border-transparent lg:px-3",
  navActive: "border-(--gy-ink) text-(--gy-ink) font-semibold lg:border-transparent lg:bg-(--gy-surface)",
  marker: "var(--gy-btn)",
};

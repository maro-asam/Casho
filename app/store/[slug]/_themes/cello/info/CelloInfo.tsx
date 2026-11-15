import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, Mail, MessageCircle, Store } from "lucide-react";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import type { AboutViewProps, ContactViewProps, StoreContact, PolicyViewProps, TrackViewProps } from "../../types";
import { OrderTracker, type TrackSkin } from "../../shared/track/OrderTracker";
import { PolicyDocument, type PolicySkin } from "../../shared/policies/PolicyDocument";
import { getSocialLinks, whatsappHref } from "../../shared/social";
import { CollectionBanner, Crumbs, Empty, Wrap, btn, num } from "../ui";
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
            className="group flex min-h-16 items-center gap-4 rounded-(--ce-r) border border-(--ce-line) px-4 py-3 transition-[border-color,box-shadow] hover:border-transparent hover:shadow-(--ce-shadow-sm)"
          >
            <span className="grid size-11 shrink-0 place-items-center rounded-(--ce-r) bg-(--ce-tint) text-(--ce-link) [&_svg]:size-5">
              <Icon aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-xs text-(--ce-quiet)">{label}</span>
              <span className="mt-0.5 block truncate font-semibold text-(--ce-ink)" dir={ltr ? "ltr" : undefined}>
                <span className="inline-block">{value}</span>
              </span>
            </span>
            <ChevronLeft aria-hidden className="size-4 shrink-0 text-(--ce-quiet) transition-transform group-hover:-translate-x-0.5 ltr:rotate-180 ltr:group-hover:translate-x-0.5" />
          </a>
        </li>
      ))}
    </ul>
  );
}

export function CelloAbout({ store, logo, coverImage, description, contact, productCount, categoryCount }: AboutViewProps) {
  return (
    <Wrap className="pb-12">
      <CollectionBanner title={st("عن {0}", store.name)} image={coverImage} />
      <Crumbs className="py-4" items={[{ label: st("الرئيسية"), href: buildStoreUrl(store.slug) }, { label: st("عن المتجر") }]} />

      <div className="mt-4 grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-16">
        <div>
          <span className="relative mb-6 grid size-16 place-items-center overflow-hidden rounded-(--ce-r-lg) bg-(--ce-plate)">
            {logo ? <Image src={logo} alt="" fill sizes="64px" className="object-cover" /> : <Store className="size-7 text-(--ce-quiet)" />}
          </span>
          <p className="max-w-[66ch] whitespace-pre-line text-[1.0625rem] leading-8 text-(--ce-ink)">
            {description?.trim() || st("أهلاً بيك في {0}. تصفح منتجاتنا واطلب بسهولة، وإحنا هنتواصل معاك لتأكيد طلبك.", store.name)}
          </p>
          <dl className="mt-8 grid max-w-md grid-cols-2 gap-(--ce-gap)">
            {[
              { n: productCount, l: st("منتج") },
              { n: categoryCount, l: st("تصنيف") },
            ].map((s) => (
              <div key={s.l} className="flex flex-col-reverse rounded-(--ce-r-lg) bg-(--ce-band) p-5">
                <dt className="mt-1 text-sm">{s.l}</dt>
                <dd className="ce-display text-4xl leading-none text-(--ce-link)">{num(s.n)}</dd>
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
          <h2 className="ce-h4 mb-4">{st("طرق التواصل")}</h2>
          <Channels contact={contact} />
          {!contact.whatsapp && !contact.email && getSocialLinks(contact).length === 0 && <p className="text-sm text-(--ce-quiet)">{st("المتجر هيتواصل معاك على رقمك بعد ما تطلب.")}</p>}
        </aside>
      </div>
    </Wrap>
  );
}

export function CelloContact({ store, contact }: ContactViewProps) {
  const wa = whatsappHref(contact.whatsapp);
  const hasAny = !!wa || !!contact.email || getSocialLinks(contact).length > 0;
  return (
    <Wrap className="pb-12">
      <CollectionBanner title={st("تواصل معنا")} note={st("عندك سؤال عن منتج أو طلب؟ إحنا معاك.")} />
      <Crumbs className="py-4" items={[{ label: st("الرئيسية"), href: buildStoreUrl(store.slug) }, { label: st("تواصل معنا") }]} />
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
        <div className="mt-4 grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">
          <section>
            <h2 className="ce-h4 mb-4">{st("كلّمنا مباشرة")}</h2>
            <Channels contact={contact} />
          </section>
          {(wa || contact.email) && (
            <section className="rounded-(--ce-r-lg) border border-(--ce-line) p-5 sm:p-8">
              <h2 className="ce-h3">{st("ابعتلنا رسالة")}</h2>
              <p className="mb-6 mt-1 text-sm text-(--ce-quiet)">{wa ? st("هتتفتح محادثة واتساب ورسالتك جاهزة.") : st("هيتفتح الإيميل ورسالتك جاهزة.")}</p>
              <ContactForm storeName={store.name} whatsappHref={wa} email={contact.email} />
            </section>
          )}
        </div>
      )}
    </Wrap>
  );
}

const TRACK_SKIN: TrackSkin = {
  label: "text-sm font-semibold text-(--ce-ink)",
  field: "ce-field",
  button: btn({ size: "lg", full: true }),
  secondary: btn({ variant: "outline" }),
  panel: "rounded-(--ce-r-lg) border border-(--ce-line) bg-(--ce-card) p-5 sm:p-6",
  ok: "var(--ce-success)",
  warn: "var(--ce-warn)",
  bad: "var(--ce-sale)",
};

export function CelloTrack({ store, whatsapp, initialCode, order }: TrackViewProps) {
  return (
    <Wrap className="pb-12">
      <CollectionBanner title={st("تتبّع طلبك")} note={order ? undefined : st("اكتب رقم الطلب والموبايل اللي طلبت بيه، وتابع طلبك خطوة بخطوة.")} />
      <Crumbs className="py-4" items={[{ label: st("الرئيسية"), href: buildStoreUrl(store.slug) }, { label: st("تتبّع طلبك") }]} />
      <div className="mt-4">
        <OrderTracker storeSlug={store.slug} whatsapp={whatsapp} initialCode={initialCode} initialOrder={order} skin={TRACK_SKIN} />
      </div>
    </Wrap>
  );
}

export function CelloPolicy({ store, policy, policies }: PolicyViewProps) {
  return (
    <Wrap className="pb-12">
      <CollectionBanner title={policy.title} />
      <Crumbs className="py-4" items={[{ label: st("الرئيسية"), href: buildStoreUrl(store.slug) }, { label: policy.title }]} />
      <div className="mt-4">
        <PolicyDocument storeSlug={store.slug} policy={policy} policies={policies} skin={POLICY_SKIN} />
      </div>
    </Wrap>
  );
}

const POLICY_SKIN: PolicySkin = {
  heading: "ce-h3",
  text: "text-(--ce-ink)",
  meta: "text-(--ce-quiet)",
  navItem: "rounded-(--ce-r) border border-(--ce-line) px-4 text-(--ce-quiet) hover:text-(--ce-ink) lg:border-transparent lg:px-3",
  navActive: "border-(--ce-ink) text-(--ce-ink) font-semibold lg:border-transparent lg:bg-[color-mix(in_srgb,var(--ce-ink)_6%,transparent)]",
  marker: "var(--ce-btn)",
};

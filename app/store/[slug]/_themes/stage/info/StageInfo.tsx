import Image from "next/image";
import Link from "next/link";
import { Mail, MessageCircle, Store } from "lucide-react";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import type { AboutViewProps, ContactViewProps, StoreContact, TrackViewProps } from "../../types";
import { OrderTracker, type TrackSkin } from "../../shared/track/OrderTracker";
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
    <ul className="sg-group">
      {rows.map(({ label, value, href, Icon, ltr }) => (
        <li key={label}>
          <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" className="sg-row group">
            <span className="grid size-9 shrink-0 place-items-center rounded-[0.625rem] bg-(--sg-fill) text-(--sg-ink) [&_svg]:size-[1.125rem]">
              <Icon aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-xs text-(--sg-label-2)">{label}</span>
              <span className="mt-0.5 block truncate font-semibold text-(--sg-ink)" dir={ltr ? "ltr" : undefined}>
                <span className="inline-block">{value}</span>
              </span>
            </span>
            <Chevron className="text-(--sg-label-3)" />
          </a>
        </li>
      ))}
    </ul>
  );
}

export function StageAbout({ store, logo, coverImage, description, contact, productCount, categoryCount }: AboutViewProps) {
  return (
    <Wrap className="pb-16">
      <PageHead title={`عن ${store.name}.`} tagline="الحكاية من الأول." crumbs={[{ label: "الرئيسية", href: buildStoreUrl(store.slug) }, { label: "عن المتجر" }]} />
      {coverImage && (
        <div className="sg-reveal relative mt-2 aspect-[16/10] overflow-hidden rounded-(--sg-r-xl) bg-(--sg-alt) sm:aspect-[21/9]">
          <Image src={coverImage} alt="" fill priority sizes="(max-width: 1100px) 100vw, 1100px" className="object-cover" />
        </div>
      )}

      <div className="mt-12 grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-16">
        <div>
          <span className="relative mb-8 grid size-16 place-items-center overflow-hidden rounded-(--sg-r) bg-(--sg-alt)">
            {logo ? <Image src={logo} alt="" fill sizes="64px" className="object-cover" /> : <Store className="size-7 text-(--sg-label-2)" />}
          </span>
          <p className="sg-statement sg-statement--body whitespace-pre-line">
            {description?.trim() || `أهلاً بيك في ${store.name}. تصفح منتجاتنا واطلب بسهولة، وإحنا هنتواصل معاك لتأكيد طلبك.`}
          </p>
          <dl className="mt-12 flex flex-wrap gap-x-16 gap-y-8">
            {[
              { n: productCount, l: "منتج" },
              { n: categoryCount, l: "قسم" },
            ].map((s) => (
              <div key={s.l} className="flex flex-col-reverse">
                <dt className="mt-1 text-[1.0625rem] text-(--sg-label-2)">{s.l}</dt>
                <dd className="sg-stat-value sg-gradient-text leading-none">{num(s.n)}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-12 flex flex-wrap items-center gap-x-6 gap-y-3">
            <Link href={buildStoreUrl(store.slug, "/products")} className={btn({ size: "lg" })}>
              تسوّق المنتجات
            </Link>
            <Link href={buildStoreUrl(store.slug, "/contact")} className="sg-link text-[1.0625rem]">
              تواصل معانا ›
            </Link>
          </div>
        </div>
        <aside>
          <h2 className="sg-fly-label">طرق التواصل</h2>
          <Channels contact={contact} />
          {!contact.whatsapp && !contact.email && getSocialLinks(contact).length === 0 && <p className="text-sm text-(--sg-label-2)">المتجر هيتواصل معاك على رقمك بعد ما تطلب.</p>}
        </aside>
      </div>
    </Wrap>
  );
}

export function StageContact({ store, contact }: ContactViewProps) {
  const wa = whatsappHref(contact.whatsapp);
  const hasAny = !!wa || !!contact.email || getSocialLinks(contact).length > 0;
  return (
    <Wrap className="pb-16">
      <PageHead title="تواصل معانا." tagline="إحنا هنا." note="عندك سؤال عن منتج أو طلب؟ ابعتلنا وهنرد عليك." crumbs={[{ label: "الرئيسية", href: buildStoreUrl(store.slug) }, { label: "تواصل معانا" }]} />
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
            <h2 className="sg-fly-label">كلّمنا مباشرة</h2>
            <Channels contact={contact} />
          </section>
          {(wa || contact.email) && (
            <section className="sg-panel p-5 sm:p-8">
              <h2 className="sg-h3">ابعتلنا رسالة</h2>
              <p className="mb-6 mt-1 text-sm text-(--sg-label-2)">{wa ? "هتتفتح محادثة واتساب ورسالتك جاهزة." : "هيتفتح الإيميل ورسالتك جاهزة."}</p>
              <ContactForm storeName={store.name} whatsappHref={wa} email={contact.email} />
            </section>
          )}
        </div>
      )}
    </Wrap>
  );
}

const TRACK_SKIN: TrackSkin = {
  label: "text-sm font-semibold text-(--sg-ink)",
  field: "sg-field",
  button: btn({ size: "lg", full: true }),
  secondary: btn({ variant: "gray" }),
  panel: "sg-panel p-5 sm:p-6",
  ok: "var(--sg-ok)",
  warn: "var(--sg-warn)",
  bad: "var(--sg-sale)",
};

export function StageTrack({ store, whatsapp, initialCode, order }: TrackViewProps) {
  return (
    <Wrap className="sg-narrow pb-16">
      <PageHead
        title="تتبّع طلبك."
        tagline={order ? undefined : "خطوة بخطوة."}
        note={order ? undefined : "اكتب رقم الطلب والموبايل اللي طلبت بيه، وتابع طلبك خطوة بخطوة."}
        crumbs={[{ label: "الرئيسية", href: buildStoreUrl(store.slug) }, { label: "تتبّع طلبك" }]}
      />
      <div>
        <OrderTracker storeSlug={store.slug} whatsapp={whatsapp} initialCode={initialCode} initialOrder={order} skin={TRACK_SKIN} />
      </div>
    </Wrap>
  );
}

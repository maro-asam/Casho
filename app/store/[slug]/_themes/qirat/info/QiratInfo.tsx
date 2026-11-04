import Image from "next/image";
import Link from "next/link";
import { Mail, MessageCircle } from "lucide-react";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import type { AboutViewProps, ContactViewProps, StoreContact, TrackViewProps } from "../../types";
import { OrderTracker, type TrackSkin } from "../../shared/track/OrderTracker";
import { getSocialLinks, whatsappHref } from "../../shared/social";
import { Arrow, Empty, Kicker, Ornament, PageHead, TextLink, Wrap, btn, num } from "../ui";
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
    <ul className="qr-group">
      {rows.map(({ label, value, href, Icon, ltr }) => (
        <li key={label}>
          <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" className="qr-row group">
            <span className="qr-row-icon">
              <Icon aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-xs text-(--qr-ink-2)">{label}</span>
              <span className="mt-0.5 block truncate text-(--qr-ink)" dir={ltr ? "ltr" : undefined}>
                <span className="inline-block">{value}</span>
              </span>
            </span>
            <Arrow className="text-(--qr-ink-3)" />
          </a>
        </li>
      ))}
    </ul>
  );
}

export function QiratAbout({ store, logo, coverImage, description, contact, productCount, categoryCount }: AboutViewProps) {
  return (
    <div className="pb-20">
      <Wrap>
        <PageHead kicker="حكايتنا" title={`عن ${store.name}`} crumbs={[{ label: "الرئيسية", href: buildStoreUrl(store.slug) }, { label: "عن المتجر" }]} />
      </Wrap>
      {coverImage && (
        <Wrap>
          <div className="qr-frame qr-reveal relative aspect-[16/10] sm:aspect-[21/9]">
            <Image src={coverImage} alt="" fill priority sizes="(max-width: 1200px) 100vw, 1200px" className="object-cover" />
          </div>
        </Wrap>
      )}
      <Wrap className="qr-about">
        <div className="min-w-0">
          {logo && (
            <span className="relative mb-8 block size-20 overflow-hidden rounded-full ring-1 ring-(--qr-line-gold) ring-offset-4 ring-offset-(--qr-bg)">
              <Image src={logo} alt="" fill sizes="80px" className="object-cover" />
            </span>
          )}
          <p className="qr-statement whitespace-pre-line">{description?.trim() || `أهلًا بيك في ${store.name}. اختار القطعة اللي تشبهك واطلبها بسهولة، وإحنا هنتواصل معاك نأكد كل التفاصيل.`}</p>
          <dl className="qr-about-stats">
            {[
              { n: productCount, l: "قطعة" },
              { n: categoryCount, l: "مجموعة" },
            ].map((s) => (
              <div key={s.l}>
                <dd className="qr-stat-value">{num(s.n)}</dd>
                <dt className="mt-2 text-sm text-(--qr-ink-2)">{s.l}</dt>
              </div>
            ))}
          </dl>
          <div className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-4">
            <Link href={buildStoreUrl(store.slug, "/products")} className={btn({ size: "lg" })}>
              اكتشف المجموعة
            </Link>
            <TextLink href={buildStoreUrl(store.slug, "/contact")}>تواصل معانا</TextLink>
          </div>
        </div>
        <aside className="min-w-0">
          <Kicker>طرق التواصل</Kicker>
          <div className="mt-4">
            <Channels contact={contact} />
          </div>
          {!contact.whatsapp && !contact.email && getSocialLinks(contact).length === 0 && <p className="mt-4 text-sm text-(--qr-ink-2)">المتجر هيتواصل معاك على رقمك بعد ما تطلب.</p>}
        </aside>
      </Wrap>
    </div>
  );
}

export function QiratContact({ store, contact }: ContactViewProps) {
  const wa = whatsappHref(contact.whatsapp);
  const hasAny = !!wa || !!contact.email || getSocialLinks(contact).length > 0;
  return (
    <Wrap className="pb-20">
      <PageHead kicker="إحنا هنا" title="تواصل معانا" note="سؤال عن مقاس، خامة، أو طلب؟ ابعتلنا وهنرد عليك." crumbs={[{ label: "الرئيسية", href: buildStoreUrl(store.slug) }, { label: "تواصل معانا" }]} />
      {!hasAny ? (
        <Empty
          icon={<MessageCircle />}
          title="المتجر لسه مضافش وسيلة تواصل"
          description="لما تطلب، المتجر هيتواصل معاك على رقم الموبايل اللي هتكتبه."
          action={
            <Link href={buildStoreUrl(store.slug, "/products")} className={btn()}>
              كل القطع
            </Link>
          }
        />
      ) : (
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16">
          <section>
            <Kicker>كلّمنا مباشرة</Kicker>
            <div className="mt-4">
              <Channels contact={contact} />
            </div>
          </section>
          {(wa || contact.email) && (
            <section className="qr-panel p-6 sm:p-8">
              <h2 className="qr-h3">ابعتلنا رسالة</h2>
              <Ornament className="qr-orn--start mt-4" />
              <p className="mb-6 mt-4 text-sm text-(--qr-ink-2)">{wa ? "هتتفتح محادثة واتساب ورسالتك جاهزة." : "هيتفتح الإيميل ورسالتك جاهزة."}</p>
              <ContactForm storeName={store.name} whatsappHref={wa} email={contact.email} />
            </section>
          )}
        </div>
      )}
    </Wrap>
  );
}

const TRACK_SKIN: TrackSkin = {
  label: "text-sm text-(--qr-ink)",
  field: "qr-field",
  button: btn({ size: "lg", full: true }),
  secondary: btn({ variant: "outline" }),
  panel: "qr-panel p-5 sm:p-7",
  ok: "var(--qr-ok)",
  warn: "var(--qr-warn)",
  bad: "var(--qr-error)",
};

export function QiratTrack({ store, whatsapp, initialCode, order }: TrackViewProps) {
  return (
    <Wrap className="pb-20">
      <PageHead
        kicker="طلبك"
        title="تتبّع طلبك"
        note={order ? undefined : "اكتب رقم الطلب والموبايل اللي طلبت بيه، وتابع طلبك خطوة بخطوة."}
        crumbs={[{ label: "الرئيسية", href: buildStoreUrl(store.slug) }, { label: "تتبّع طلبك" }]}
      />
      <div className="mx-auto max-w-3xl">
        <OrderTracker storeSlug={store.slug} whatsapp={whatsapp} initialCode={initialCode} initialOrder={order} skin={TRACK_SKIN} />
      </div>
    </Wrap>
  );
}

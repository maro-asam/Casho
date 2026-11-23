import Image from "next/image";
import Link from "next/link";
import { Mail, MessageCircle, Store } from "lucide-react";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import type { AboutViewProps, ContactViewProps, PolicyViewProps, StoreContact, TrackViewProps } from "../../types";
import { OrderTracker, type TrackSkin } from "../../shared/track/OrderTracker";
import { PolicyDocument, type PolicySkin } from "../../shared/policies/PolicyDocument";
import { getSocialLinks, whatsappHref } from "../../shared/social";
import { Arrow, Empty, PageHead, Panel, Wrap, btn, num } from "../ui";
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
    <Panel as="section" className="p-2">
      <ul>
        {rows.map(({ label, value, href, Icon, ltr }) => (
          <li key={label}>
            <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" className="an-row">
              <span className="an-navicon">
                <Icon aria-hidden className="size-[1.125rem]" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[0.75rem] text-(--an-muted)">{label}</span>
                <span className="mt-0.5 block truncate font-bold" dir={ltr ? "ltr" : undefined}>
                  <span className="inline-block">{value}</span>
                </span>
              </span>
              <Arrow className="text-(--an-ink-3)" />
            </a>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

export function ArenaAbout({ store, logo, coverImage, description, contact, productCount, categoryCount }: AboutViewProps) {
  return (
    <Wrap className="an-page">
      <PageHead title={st("عن {0}", store.name)} />
      {coverImage && (
        <div className="an-rise relative mb-6 aspect-[21/9] overflow-hidden rounded-(--an-r)">
          <Image src={coverImage} alt="" fill priority sizes="(max-width: 1100px) 100vw, 1100px" className="object-cover" />
        </div>
      )}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <Panel className="p-5 md:p-7">
          <span className="relative grid size-14 place-items-center overflow-hidden rounded-(--an-r-md) bg-(--an-fill)">
            {logo ? <Image src={logo} alt="" fill sizes="56px" className="object-cover" /> : <Store className="size-6 text-(--an-soft)" />}
          </span>
          <p className="mt-5 whitespace-pre-line text-[0.9375rem] leading-8">
            {description?.trim() || st("أهلاً بيك في {0}. اختار لعبتك وباقتك واطلب بسهولة، والمتجر هيتابع طلبك لحد ما يوصلك.", store.name)}
          </p>
          <dl className="mt-6 grid grid-cols-2 gap-3 sm:max-w-sm">
            {[
              { n: productCount, l: st("باقة") },
              { n: categoryCount, l: st("لعبة وتطبيق") },
            ].map((s) => (
              <div key={s.l} className="an-statbox flex flex-col-reverse">
                <dt className="text-[0.75rem] text-(--an-muted)">{s.l}</dt>
                <dd className="an-stat">{num(s.n)}</dd>
              </div>
            ))}
          </dl>
          <Link href={buildStoreUrl(store.slug, "/categories")} className={btn({ size: "lg", className: "mt-6" })}>
            {st("اختار لعبتك")}
          </Link>
        </Panel>
        <aside className="space-y-3">
          <h2 className="an-label">{st("طرق التواصل")}</h2>
          <Channels contact={contact} />
          {!contact.whatsapp && !contact.email && getSocialLinks(contact).length === 0 && <p className="an-sub">{st("المتجر هيتواصل معاك على رقمك بعد ما تطلب.")}</p>}
        </aside>
      </div>
    </Wrap>
  );
}

export function ArenaContact({ store, contact }: ContactViewProps) {
  const wa = whatsappHref(contact.whatsapp);
  const hasAny = !!wa || !!contact.email || getSocialLinks(contact).length > 0;
  return (
    <Wrap className="an-page">
      <PageHead title={st("تواصل معانا")} note={st("عندك سؤال عن باقة أو طلب؟ ابعتلنا وهنرد عليك.")} />
      {!hasAny ? (
        <Empty
          icon={<MessageCircle />}
          title={st("المتجر لسه مضافش وسيلة تواصل")}
          description={st("لما تطلب، المتجر هيتواصل معاك على رقم الموبايل اللي هتكتبه.")}
          action={
            <Link href={buildStoreUrl(store.slug, "/categories")} className={btn()}>
              {st("اختار لعبتك")}
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Channels contact={contact} />
          {(wa || contact.email) && (
            <Panel as="section" className="p-5 sm:p-6">
              <h2 className="an-h3">{st("ابعتلنا رسالة")}</h2>
              <p className="an-sub mb-5 mt-1">{wa ? st("هتتفتح محادثة واتساب ورسالتك جاهزة.") : st("هيتفتح الإيميل ورسالتك جاهزة.")}</p>
              <ContactForm storeName={store.name} whatsappHref={wa} email={contact.email} />
            </Panel>
          )}
        </div>
      )}
    </Wrap>
  );
}

const TRACK_SKIN: TrackSkin = {
  label: "an-label",
  field: "an-field",
  button: btn({ size: "lg", full: true }),
  secondary: btn({ variant: "glass" }),
  panel: "an-panel p-5 sm:p-6",
  ok: "var(--an-ok)",
  warn: "var(--an-gold)",
  bad: "var(--an-bad)",
};

/** "طلباتي" — order tracking by number + phone, in the app's chrome. */
export function ArenaTrack({ store, whatsapp, initialCode, order }: TrackViewProps) {
  return (
    <Wrap narrow className="an-page">
      <PageHead title={st("طلباتي")} note={order ? undefined : st("اكتب رقم الطلب والموبايل اللي طلبت بيه، وتابع شحنتك خطوة بخطوة.")} />
      <OrderTracker storeSlug={store.slug} whatsapp={whatsapp} initialCode={initialCode} initialOrder={order} skin={TRACK_SKIN} />
    </Wrap>
  );
}

const POLICY_SKIN: PolicySkin = {
  heading: "an-h3",
  text: "text-(--an-ink)",
  meta: "text-(--an-muted)",
  navItem: "rounded-full border border-(--an-line) px-4 text-(--an-muted) hover:text-(--an-ink) lg:rounded-(--an-r-sm) lg:border-transparent lg:px-3",
  navActive: "border-(--an-p) text-(--an-ink) font-bold lg:border-transparent lg:bg-(--an-fill)",
  marker: "var(--an-lilac)",
};

export function ArenaPolicy({ store, policy, policies }: PolicyViewProps) {
  return (
    <Wrap className="an-page">
      <PageHead title={policy.title} />
      <PolicyDocument storeSlug={store.slug} policy={policy} policies={policies} skin={POLICY_SKIN} />
    </Wrap>
  );
}

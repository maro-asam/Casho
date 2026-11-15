import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, Mail, MessageCircle, Store } from "lucide-react";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import type { AboutViewProps, ContactViewProps, StoreContact, PolicyViewProps, TrackViewProps } from "../../types";
import { OrderTracker, type TrackSkin } from "../../shared/track/OrderTracker";
import { PolicyDocument, type PolicySkin } from "../../shared/policies/PolicyDocument";
import { getSocialLinks, whatsappHref } from "../social";
import { Container, EmptyState, PageHeader, btn } from "../ui";
import ContactForm from "./ContactForm";
import { lazyStoreIntl, st } from "@/lib/i18n/storefront";

const nf = lazyStoreIntl.number();

function ContactChannels({ contact }: { contact: StoreContact }) {
  const wa = whatsappHref(contact.whatsapp);
  const channels = [
    ...(wa ? [{ label: st("واتساب"), value: contact.whatsapp!, href: wa, Icon: MessageCircle, ltr: true }] : []),
    ...(contact.email
      ? [{ label: st("البريد الإلكتروني"), value: contact.email, href: `mailto:${contact.email}`, Icon: Mail, ltr: true }]
      : []),
    ...getSocialLinks(contact).map((s) => ({ label: s.label, value: st("تابعنا"), href: s.href, Icon: s.Icon, ltr: false })),
  ];

  if (channels.length === 0) return null;

  return (
    <ul className="divide-y divide-border overflow-hidden rounded-(--c-radius) border border-border">
      {channels.map(({ label, value, href, Icon, ltr }) => (
        <li key={label}>
          <a
            href={href}
            target={href.startsWith("http") ? "_blank" : undefined}
            rel="noopener noreferrer"
            className="flex min-h-16 items-center gap-3.5 px-4 py-3 transition-colors hover:bg-(--c-subtle)"
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-(--c-subtle) [&_svg]:size-5">
              <Icon aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-xs text-muted-foreground">{label}</span>
              <span className="block truncate text-[0.9375rem] font-semibold" dir={ltr ? "ltr" : undefined}>
                {value}
              </span>
            </span>
            <ChevronLeft aria-hidden className="size-4 shrink-0 text-muted-foreground ltr:rotate-180" />
          </a>
        </li>
      ))}
    </ul>
  );
}

export function ClassicAbout({ store, logo, coverImage, description, contact, productCount, categoryCount }: AboutViewProps) {
  return (
    <Container className="pb-6">
      <PageHeader
        breadcrumbs={[{ label: st("الرئيسية"), href: buildStoreUrl(store.slug) }, { label: st("عن المتجر") }]}
        title={st("عن {0}", store.name)}
      />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:gap-14">
        <div>
          {coverImage && (
            <div className="c-img-bg relative mb-6 aspect-[16/7] overflow-hidden rounded-(--c-radius-lg)">
              <Image src={coverImage} alt="" fill priority sizes="(max-width: 1024px) 100vw, 60vw" className="object-cover" />
            </div>
          )}
          <div className="flex items-center gap-4">
            <span className="c-img-bg relative grid size-16 shrink-0 place-items-center overflow-hidden rounded-(--c-radius) text-muted-foreground">
              {logo ? <Image src={logo} alt="" fill sizes="64px" className="object-cover" /> : <Store className="size-7" />}
            </span>
            <div>
              <h2 className="text-xl font-bold">{store.name}</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {st("{0} منتج · {1} تصنيف", nf.format(productCount), nf.format(categoryCount))}
              </p>
            </div>
          </div>
          {description ? (
            <p className="mt-6 whitespace-pre-line text-[0.9375rem] leading-8 text-foreground/85 sm:text-base">{description}</p>
          ) : (
            <p className="mt-6 text-[0.9375rem] leading-8 text-muted-foreground">
              {st("أهلاً بيك في {0}. تصفح منتجاتنا واطلب بسهولة، وإحنا هنتواصل معاك لتأكيد طلبك.", store.name)}
            </p>
          )}
          <div className="mt-8 flex flex-wrap gap-2.5">
            <Link href={buildStoreUrl(store.slug, "/products")} className={btn({ size: "lg" })}>
              {st("تسوق المنتجات")}
            </Link>
            <Link href={buildStoreUrl(store.slug, "/contact")} className={btn({ size: "lg", variant: "outline" })}>
              {st("تواصل معنا")}
            </Link>
          </div>
        </div>

        <aside>
          <h2 className="mb-3 text-sm font-bold">{st("طرق التواصل")}</h2>
          <ContactChannels contact={contact} />
          {!contact.whatsapp && !contact.email && getSocialLinks(contact).length === 0 && (
            <p className="rounded-(--c-radius) bg-(--c-subtle) p-4 text-sm text-muted-foreground">
              {st("المتجر هيتواصل معاك على رقمك بعد ما تطلب.")}
            </p>
          )}
        </aside>
      </div>
    </Container>
  );
}

export function ClassicContact({ store, contact }: ContactViewProps) {
  const wa = whatsappHref(contact.whatsapp);
  const hasAny = !!wa || !!contact.email || getSocialLinks(contact).length > 0;

  return (
    <Container className="pb-6">
      <PageHeader
        breadcrumbs={[{ label: st("الرئيسية"), href: buildStoreUrl(store.slug) }, { label: st("تواصل معنا") }]}
        title={st("تواصل معنا")}
        meta={st("عندك سؤال عن منتج أو طلب؟ إحنا معاك.")}
      />

      {!hasAny ? (
        <EmptyState
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
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-14">
          <section>
            <h2 className="mb-3 text-sm font-bold">{st("كلمنا مباشرة")}</h2>
            <ContactChannels contact={contact} />
          </section>
          {(wa || contact.email) && (
            <section className="rounded-(--c-radius-lg) bg-(--c-subtle) p-5 sm:p-7">
              <h2 className="text-lg font-bold">{st("ابعتلنا رسالة")}</h2>
              <p className="mb-5 mt-1 text-sm text-muted-foreground">
                {wa ? st("هتتفتح محادثة واتساب ورسالتك جاهزة.") : st("هيتفتح الإيميل ورسالتك جاهزة.")}
              </p>
              <ContactForm storeName={store.name} whatsappHref={wa} email={contact.email} />
            </section>
          )}
        </div>
      )}
    </Container>
  );
}

const TRACK_SKIN: TrackSkin = {
  label: "text-sm font-medium",
  field:
    "h-11 w-full rounded-(--c-radius-sm) border border-border bg-background px-3.5 text-base outline-none transition-colors placeholder:text-muted-foreground focus:border-foreground/40 sm:text-sm",
  button: btn({ size: "lg", full: true }),
  secondary: btn({ variant: "outline" }),
  panel: "rounded-(--c-radius-lg) border border-border p-5 sm:p-6",
  ok: "var(--c-success)",
  warn: "var(--c-warning)",
  bad: "var(--c-danger)",
};

export function ClassicTrack({ store, whatsapp, initialCode, order }: TrackViewProps) {
  return (
    <Container className="pb-6">
      <PageHeader
        breadcrumbs={[{ label: st("الرئيسية"), href: buildStoreUrl(store.slug) }, { label: st("تتبّع طلبك") }]}
        title={st("تتبّع طلبك")}
        meta={order ? undefined : st("اكتب رقم الطلب والموبايل اللي طلبت بيه، وتابع طلبك خطوة بخطوة.")}
      />
      <OrderTracker storeSlug={store.slug} whatsapp={whatsapp} initialCode={initialCode} initialOrder={order} skin={TRACK_SKIN} />
    </Container>
  );
}

export function ClassicPolicy({ store, policy, policies }: PolicyViewProps) {
  return (
    <Container className="pb-6">
      <PageHeader breadcrumbs={[{ label: st("الرئيسية"), href: buildStoreUrl(store.slug) }, { label: policy.title }]} title={policy.title} />
      <PolicyDocument storeSlug={store.slug} policy={policy} policies={policies} skin={POLICY_SKIN} />
    </Container>
  );
}

const POLICY_SKIN: PolicySkin = {
  heading: "text-lg font-bold sm:text-xl",
  text: "text-foreground/85",
  meta: "text-muted-foreground",
  navItem: "rounded-full border border-border px-4 text-muted-foreground hover:text-foreground lg:rounded-(--c-radius-sm) lg:border-transparent lg:px-3",
  navActive: "border-foreground text-foreground font-semibold lg:border-transparent lg:bg-(--c-subtle)",
  marker: "var(--primary)",
};

import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, Mail, MessageCircle, Store } from "lucide-react";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import type { AboutViewProps, ContactViewProps, StoreContact } from "../../types";
import { getSocialLinks, whatsappHref } from "../social";
import { Container, EmptyState, PageHeader, btn } from "../ui";
import ContactForm from "./ContactForm";

const nf = new Intl.NumberFormat("ar-EG");

function ContactChannels({ contact }: { contact: StoreContact }) {
  const wa = whatsappHref(contact.whatsapp);
  const channels = [
    ...(wa ? [{ label: "واتساب", value: contact.whatsapp!, href: wa, Icon: MessageCircle, ltr: true }] : []),
    ...(contact.email
      ? [{ label: "البريد الإلكتروني", value: contact.email, href: `mailto:${contact.email}`, Icon: Mail, ltr: true }]
      : []),
    ...getSocialLinks(contact).map((s) => ({ label: s.label, value: "تابعنا", href: s.href, Icon: s.Icon, ltr: false })),
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
        breadcrumbs={[{ label: "الرئيسية", href: buildStoreUrl(store.slug) }, { label: "عن المتجر" }]}
        title={`عن ${store.name}`}
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
                {nf.format(productCount)} منتج · {nf.format(categoryCount)} تصنيف
              </p>
            </div>
          </div>
          {description ? (
            <p className="mt-6 whitespace-pre-line text-[0.9375rem] leading-8 text-foreground/85 sm:text-base">{description}</p>
          ) : (
            <p className="mt-6 text-[0.9375rem] leading-8 text-muted-foreground">
              أهلاً بيك في {store.name}. تصفح منتجاتنا واطلب بسهولة، وإحنا هنتواصل معاك لتأكيد طلبك.
            </p>
          )}
          <div className="mt-8 flex flex-wrap gap-2.5">
            <Link href={buildStoreUrl(store.slug, "/products")} className={btn({ size: "lg" })}>
              تسوق المنتجات
            </Link>
            <Link href={buildStoreUrl(store.slug, "/contact")} className={btn({ size: "lg", variant: "outline" })}>
              تواصل معنا
            </Link>
          </div>
        </div>

        <aside>
          <h2 className="mb-3 text-sm font-bold">طرق التواصل</h2>
          <ContactChannels contact={contact} />
          {!contact.whatsapp && !contact.email && getSocialLinks(contact).length === 0 && (
            <p className="rounded-(--c-radius) bg-(--c-subtle) p-4 text-sm text-muted-foreground">
              المتجر هيتواصل معاك على رقمك بعد ما تطلب.
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
        breadcrumbs={[{ label: "الرئيسية", href: buildStoreUrl(store.slug) }, { label: "تواصل معنا" }]}
        title="تواصل معنا"
        meta="عندك سؤال عن منتج أو طلب؟ إحنا معاك."
      />

      {!hasAny ? (
        <EmptyState
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
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-14">
          <section>
            <h2 className="mb-3 text-sm font-bold">كلمنا مباشرة</h2>
            <ContactChannels contact={contact} />
          </section>
          {(wa || contact.email) && (
            <section className="rounded-(--c-radius-lg) bg-(--c-subtle) p-5 sm:p-7">
              <h2 className="text-lg font-bold">ابعتلنا رسالة</h2>
              <p className="mb-5 mt-1 text-sm text-muted-foreground">
                {wa ? "هتتفتح محادثة واتساب ورسالتك جاهزة." : "هيتفتح الإيميل ورسالتك جاهزة."}
              </p>
              <ContactForm storeName={store.name} whatsappHref={wa} email={contact.email} />
            </section>
          )}
        </div>
      )}
    </Container>
  );
}

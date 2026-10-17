import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Mail, MapPin, MessageCircle, Phone } from "lucide-react";

export const metadata: Metadata = {
  title: "تواصل معانا | كاشو",
  description: "بيانات التواصل مع منصة كاشو للتجارة الإلكترونية — البريد الإلكتروني، رقم الموبايل، وعنوان الشركة.",
  alternates: { canonical: "https://casho.store/contact-us" },
};

const EMAIL = "cashostore0@gmail.com";
const PHONE = "01014344053";
const PHONE_INTL = "+201014344053";
const ADDRESS_AR = "58 شارع الحجاز، برج أمون، مصر الجديدة، القاهرة";
const ADDRESS_EN = "58 Hegaz St., Amoun Tower, Heliopolis, Cairo, Egypt";

const CHANNELS = [
  {
    icon: Mail,
    label: "البريد الإلكتروني",
    value: EMAIL,
    href: `mailto:${EMAIL}`,
    hint: "ابعتلنا رسالة بتفاصيل استفسارك",
    ltr: true,
  },
  {
    icon: Phone,
    label: "الموبايل",
    value: PHONE,
    href: `tel:${PHONE_INTL}`,
    hint: "كلّمنا على طول",
    ltr: true,
  },
  {
    icon: MessageCircle,
    label: "واتساب",
    value: PHONE,
    href: `https://wa.me/${PHONE_INTL.slice(1)}`,
    hint: "ابعتلنا على واتساب",
    ltr: true,
  },
];

const PAGES = [
  { label: "عن كاشو", href: "/about" },
  { label: "سياسة الخصوصية", href: "/privacy-policy" },
  { label: "سياسة الاسترداد", href: "/refund-policy" },
  { label: "الشروط والأحكام", href: "/terms" },
];

export default function ContactUsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16" dir="rtl">
      <header className="max-w-2xl">
        <h1 className="text-3xl font-bold">تواصل معانا</h1>
        <p className="mt-3 leading-7 text-muted-foreground">
          عندك سؤال عن كاشو، مشكلة في متجرك، أو استفسار عن الاشتراك والرصيد؟ كلّمنا من أي طريقة تحت وهنرد عليك في أسرع وقت.
        </p>
      </header>

      <section aria-label="طرق التواصل" className="mt-10 grid gap-4 sm:grid-cols-3">
        {CHANNELS.map(({ icon: Icon, label, value, href, hint, ltr }) => (
          <a
            key={label}
            href={href}
            target={href.startsWith("http") ? "_blank" : undefined}
            rel={href.startsWith("http") ? "noreferrer" : undefined}
            className="group rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/40 hover:bg-primary/5"
          >
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Icon className="size-5" />
            </span>
            <p className="mt-4 text-sm text-muted-foreground">{label}</p>
            <p className="mt-1 break-all font-semibold text-foreground" dir={ltr ? "ltr" : undefined}>
              {value}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">{hint}</p>
          </a>
        ))}
      </section>

      <section aria-labelledby="address-title" className="mt-4 rounded-2xl border border-border bg-card p-5">
        <div className="flex items-start gap-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <MapPin className="size-5" />
          </span>
          <div>
            <h2 id="address-title" className="text-sm text-muted-foreground">
              عنوان الشركة
            </h2>
            <address className="mt-1 not-italic">
              <p className="font-semibold text-foreground">{ADDRESS_AR}</p>
              <p className="mt-1 text-sm text-muted-foreground" dir="ltr">
                {ADDRESS_EN}
              </p>
            </address>
          </div>
        </div>
      </section>

      <section aria-labelledby="pages-title" className="mt-12">
        <h2 id="pages-title" className="text-lg font-semibold">
          صفحات تهمّك
        </h2>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {PAGES.map((page) => (
            <li key={page.href}>
              <Link
                href={page.href}
                className="flex items-center justify-between rounded-xl border border-border px-4 py-3 text-sm transition-colors hover:border-primary/40 hover:bg-primary/5"
              >
                <span>{page.label}</span>
                <ArrowLeft className="size-4 text-muted-foreground" />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12 rounded-2xl bg-muted/50 p-5 text-sm leading-7 text-muted-foreground">
        <p>
          <strong className="text-foreground">بتشتري من متجر على كاشو؟</strong> كل متجر مسؤول عن طلباته وشحنه واسترجاعه — تواصل مع صاحب
          المتجر مباشرة من بيانات التواصل الموجودة في متجره. ولو المتجر مش بيرد، ابعتلنا على{" "}
          <a href={`mailto:${EMAIL}`} className="text-primary underline underline-offset-4" dir="ltr">
            {EMAIL}
          </a>{" "}
          ومعاك رقم الطلب.
        </p>
      </section>
    </div>
  );
}

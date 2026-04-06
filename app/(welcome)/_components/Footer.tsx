"use client";

import Link from "next/link";
import { Mail, Phone, Store } from "lucide-react";

const footerLinks = {
  product: [
    { name: "المميزات", href: "#features" },
    { name: "الأسعار", href: "#pricing" },
    { name: "الأسئلة الشائعة", href: "#faq" },
  ],
  company: [
    { name: "عن كاشو", href: "#" },
    { name: "ابدأ دلوقتي", href: "/signup" },
    { name: "تسجيل الدخول", href: "/login" },
  ],
  legal: [
    { name: "سياسة الخصوصية", href: "#" },
    { name: "الشروط والأحكام", href: "#" },
  ],
  contact: [
    { name: "01000000000", href: "tel:01000000000", icon: Phone },
    { name: "hello@casho.store", href: "mailto:hello@casho.store", icon: Mail },
  ],
  // social: [
  //   { name: "Facebook", href: "#", icon: Facebook },
  //   { name: "Instagram", href: "#", icon: Instagram },
  // ],
};

export default function Footer() {
  return (
    <footer className="border-t border-border/70 bg-background">
      <div className="wrapper py-14">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Link href="/" className="inline-flex items-center gap-2">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Store className="size-5" />
              </div>

              <div>
                <p className="text-lg font-extrabold text-foreground">كاشو</p>
                <p className="text-sm text-muted-foreground">
                  بيع أونلاين بشكل أبسط
                </p>
              </div>
            </Link>

            <p className="mt-5 max-w-sm text-sm leading-7 text-muted-foreground">
              كاشو بيساعدك تعمل متجرك أونلاين، تعرض منتجاتك، وتستقبل طلباتك بشكل
              سهل ومنظم من غير تعقيد.
            </p>

            <div className="mt-6 flex items-center gap-3">
              {/* {footerLinks.social.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="flex size-10 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:text-primary"
                  >
                    <Icon className="size-4.5" />
                  </Link>
                );
              })} */}
            </div>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:col-span-8 lg:grid-cols-4">
            <div>
              <h3 className="text-sm font-bold text-foreground">المنتج</h3>
              <div className="mt-4 space-y-3">
                {footerLinks.product.map((link) => (
                  <Link
                    key={link.name}
                    href={link.href}
                    className="block text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.name}
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-foreground">الشركة</h3>
              <div className="mt-4 space-y-3">
                {footerLinks.company.map((link) => (
                  <Link
                    key={link.name}
                    href={link.href}
                    className="block text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.name}
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-foreground">القانوني</h3>
              <div className="mt-4 space-y-3">
                {footerLinks.legal.map((link) => (
                  <Link
                    key={link.name}
                    href={link.href}
                    className="block text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.name}
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-foreground">تواصل معانا</h3>
              <div className="mt-4 space-y-3">
                {footerLinks.contact.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <Icon className="size-4" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-border/70 pt-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 كاشو. كل الحقوق محفوظة.</p>
          <p>مصنوع بحب للتجار في مصر 🇪🇬</p>
        </div>
      </div>
    </footer>
  );
}
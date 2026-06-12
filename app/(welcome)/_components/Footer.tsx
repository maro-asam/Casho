"use client";

import Link from "next/link";
import { Mail, MapPin, Phone, Store } from "lucide-react";
import { useLang } from "../_i18n/LanguageContext";

export default function Footer() {
  const { t } = useLang();
  const ft = t.footer;

  const contactItems = [
    { name: "01014344053", href: "tel:01014344053", icon: Phone },
    {
      name: "cashostore0@gmail.com",
      href: "mailto:cashostore0@gmail.com",
      icon: Mail,
    },
    {
      name: ft.address,
      href: "#",
      icon: MapPin,
    },
  ];

  return (
    <footer className="border-t border-border/70 bg-background">
      <div className="wrapper py-14">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Link href="/" className="inline-flex items-center gap-2">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Store className="size-5" />
              </div>

              <div>
                <p className="text-lg font-extrabold text-foreground">كاشو</p>
                <p className="text-sm text-muted-foreground">
                  {ft.tagline}
                </p>
              </div>
            </Link>

            <p className="mt-5 max-w-sm text-sm leading-7 text-muted-foreground">
              {ft.description}
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:col-span-8 lg:grid-cols-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">{ft.sections.product}</h3>
              <div className="mt-4 space-y-3">
                {ft.links.product.map((link) => (
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
              <h3 className="text-sm font-semibold text-foreground">{ft.sections.company}</h3>
              <div className="mt-4 space-y-3">
                {ft.links.company.map((link) => (
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
              <h3 className="text-sm font-semibold text-foreground">{ft.sections.legal}</h3>
              <div className="mt-4 space-y-3">
                {ft.links.legal.map((link) => (
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
              <h3 className="text-sm font-semibold text-foreground">{ft.sections.contact}</h3>
              <div className="mt-4 space-y-3">
                {contactItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <Icon className="size-4 shrink-0" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-border/70 pt-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>{ft.copyright}</p>
          <p>{ft.madeWith}</p>
        </div>
      </div>
    </footer>
  );
}

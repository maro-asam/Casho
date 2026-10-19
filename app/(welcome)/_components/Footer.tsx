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

  const columns = [
    { title: ft.sections.product, links: ft.links.product },
    { title: ft.sections.company, links: ft.links.company },
    { title: ft.sections.legal, links: ft.links.legal },
  ];

  // Apple-style footer: dense 12px links on the surface tone, hairline rules.
  return (
    <footer className="al bg-(--al-surface) text-[12px] text-(--al-muted)">
      <div className="al-container py-10">
        <Link href="/" className="inline-flex items-center gap-2 text-(--al-text)">
          <Store className="size-4" strokeWidth={1.8} />
          <span className="text-[14px] font-semibold">كاشو</span>
          <span className="text-(--al-muted)">· {ft.tagline}</span>
        </Link>
        <p className="mt-3 max-w-[560px] leading-relaxed">{ft.description}</p>

        <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-8 border-t border-(--al-hair) pt-6 md:grid-cols-4">
          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="font-semibold text-(--al-text)">{col.title}</h3>
              <ul className="mt-3 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.name}>
                    <Link href={link.href} className="transition-colors hover:text-(--al-text) hover:underline">
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="col-span-2 md:col-span-1">
            <h3 className="font-semibold text-(--al-text)">{ft.sections.contact}</h3>
            <ul className="mt-3 space-y-2.5">
              {contactItems.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.name}>
                    <Link href={item.href} className="inline-flex items-start gap-2 transition-colors hover:text-(--al-text)">
                      <Icon className="mt-0.5 size-3.5 shrink-0" strokeWidth={1.8} />
                      <span>{item.name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-2 border-t border-(--al-hair) pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p>{ft.copyright}</p>
          <p>{ft.madeWith}</p>
        </div>
      </div>
    </footer>
  );
}

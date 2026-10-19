import Link from "next/link";
import { Mail } from "lucide-react";
import Image from "next/image";
import { tr } from "@/lib/i18n/dashboard";

const footerLinks = {
  platform: [
    { get label() { return tr("المميزات"); }, href: "#features" },
    { get label() { return tr("الأسعار"); }, href: "#pricing" },
    { get label() { return tr("الأسئلة الشائعة"); }, href: "#faq" },
    { get label() { return tr("ابدأ الآن"); }, href: "/register" },
  ],
  legal: [
    { get label() { return tr("سياسة الخصوصية"); }, href: "/privacy" },
    { get label() { return tr("الشروط والأحكام"); }, href: "/terms" },
  ],
  contact: [
    { get label() { return tr("البريد الإلكتروني"); }, href: "mailto:hello@marostore.com" },
    { get label() { return tr("الدعم"); }, href: "/contact" },
  ],
};

const socialLinks = [
  // { icon: Facebook, href: "#", label: "Facebook" },
  // { icon: Instagram, href: "#", label: "Instagram" },
  // { icon: Linkedin, href: "#", label: "LinkedIn" },
  { icon: Mail, href: "mailto:hello@marostore.com", label: "Email" },
];

const Footer = () => {
  return (
    <footer className="w-full border-t bg-background">
      <div className="mx-auto  px-6 py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Link href="/" className="text-2xl font-semibold tracking-tight">
              <Image src={`/logo.svg`} alt="logo" width={120} height={120} />
            </Link>

            <p className="mt-4 max-w-md text-sm leading-7 text-muted-foreground">
              {tr("منصة تساعد التجار على إنشاء متجر إلكتروني بسهولة، ومشاركة رابط المتجر مع العملاء، واستقبال الطلبات بشكل بسيط وسريع.")}
            </p>

            <div className="mt-6 flex items-center gap-3">
              {socialLinks.map((item, index) => {
                const Icon = item.icon;

                return (
                  <Link
                    key={index}
                    href={item.href}
                    aria-label={item.label}
                    className="flex h-10 w-10 items-center justify-center rounded-xl border text-muted-foreground transition hover:bg-muted hover:text-foreground"
                  >
                    <Icon className="h-4 w-4" />
                  </Link>
                );
              })}
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold text-primary">{tr("المنصة")}</h3>
            <div className="space-y-3">
              {footerLinks.platform.map((link, index) => (
                <Link
                  key={index}
                  href={link.href}
                  className="block text-sm text-muted-foreground transition hover:text-foreground"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold text-primary">{tr("قانوني")}</h3>
            <div className="space-y-3">
              {footerLinks.legal.map((link, index) => (
                <Link
                  key={index}
                  href={link.href}
                  className="block text-sm text-muted-foreground transition hover:text-foreground"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold text-primary">{tr("تواصل")}</h3>
            <div className="space-y-3">
              {footerLinks.contact.map((link, index) => (
                <Link
                  key={index}
                  href={link.href}
                  className="block text-sm text-muted-foreground transition hover:text-foreground"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 border-t pt-6 text-center text-sm text-muted-foreground">
          {tr("جميع الحقوق محفوظة. © 2026 Casho")}
        </div>
      </div>
    </footer>
  );
};

export default Footer;

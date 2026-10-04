import type { SVGProps } from "react";

import { toWhatsAppDigits } from "@/lib/conversion/conversion-config";
import { cn } from "@/lib/utils";
import type { StoreContact } from "../types";

/** wa.me link from a stored phone number. */
export function whatsappHref(phone: string | null) {
  if (!phone) return null;
  const digits = toWhatsAppDigits(phone);
  return digits ? `https://wa.me/${digits}` : null;
}

/** Social profile URL from a stored handle or URL. */
function socialHref(value: string | null, base: string) {
  if (!value?.trim()) return null;
  const v = value.trim();
  if (/^https?:\/\//i.test(v)) return v;
  return `${base}${v.replace(/^@/, "")}`;
}

type IconProps = SVGProps<SVGSVGElement>;

const InstagramIcon = (p: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...p}>
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
  </svg>
);

const FacebookIcon = (p: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
    <path d="M13.5 21v-7.5h2.6l.4-3h-3V8.6c0-.9.3-1.5 1.6-1.5h1.6V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.2H8v3h2.5V21h3Z" />
  </svg>
);

const TikTokIcon = (p: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
    <path d="M16.6 3c.3 2.1 1.6 3.6 3.9 3.8v3a7 7 0 0 1-3.9-1.2v6.1a5.7 5.7 0 1 1-5.7-5.7c.3 0 .6 0 .9.1v3.1a2.6 2.6 0 1 0 1.8 2.5V3h3Z" />
  </svg>
);

export function getSocialLinks(contact: StoreContact) {
  return [
    { label: "إنستجرام", href: socialHref(contact.instagram, "https://instagram.com/"), Icon: InstagramIcon },
    { label: "فيسبوك", href: socialHref(contact.facebook, "https://facebook.com/"), Icon: FacebookIcon },
    { label: "تيك توك", href: socialHref(contact.tiktok, "https://tiktok.com/@"), Icon: TikTokIcon },
  ].filter((l): l is { label: string; href: string; Icon: typeof InstagramIcon } => !!l.href);
}

export function SocialLinks({ contact, className }: { contact: StoreContact; className?: string }) {
  const links = getSocialLinks(contact);
  if (links.length === 0) return <span />;
  return (
    <ul className={cn("flex items-center gap-1", className)}>
      {links.map(({ label, href, Icon }) => (
        <li key={label}>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={label}
            className="grid size-11 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-(--c-subtle) hover:text-foreground"
          >
            <Icon className="size-5" aria-hidden />
          </a>
        </li>
      ))}
    </ul>
  );
}

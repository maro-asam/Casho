"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ComponentType, type FormEvent } from "react";
import { Gamepad2, House, LayoutGrid, MessageCircle, ReceiptText, Search, ShoppingBag, Sparkles, X } from "lucide-react";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { cn } from "@/lib/utils";
import type { StoreShell } from "../../types";
import { useCartCount } from "../../shared/use-cart-count";
import { isActivePath, storeHref, useStorePath } from "../../shared/store-path";
import { whatsappHref } from "../../shared/social";
import { num } from "../ui";
import { st } from "@/lib/i18n/storefront";

type NavItem = { href: string; label: string; Icon: ComponentType<{ className?: string }>; count?: number };

/** The page's name for the top bar — the app-like header of the reference. */
function titleFor(path: string): string {
  if (path === "/") return st("أهلاً بيك 🎮");
  if (/^\/categories\/[^/]+/.test(path)) return st("اختار باقتك");
  if (path.startsWith("/categories")) return st("الألعاب والتطبيقات");
  if (/^\/products\/[^/]+/.test(path)) return st("اختار باقتك");
  if (path.startsWith("/products")) return st("كل الباقات");
  if (path.startsWith("/cart")) return st("السلة");
  if (path.startsWith("/checkout")) return st("تأكيد الطلب");
  if (path.startsWith("/track") || path.startsWith("/order")) return st("طلباتي");
  if (path.startsWith("/about")) return st("عن المتجر");
  if (path.startsWith("/contact")) return st("تواصل معانا");
  if (path.startsWith("/policies")) return st("السياسات");
  return "";
}

/** The store's mark: the merchant's logo, or the sparkle on the gradient. */
function Mark({ shell, size = "md" }: { shell: StoreShell; size?: "md" | "lg" }) {
  const px = size === "lg" ? 44 : 36;
  return (
    <span className={cn("an-mark", size === "lg" && "an-mark--lg", !shell.logo && "an-mark--glow")} style={shell.logo ? { borderRadius: Math.min(shell.logoRadius, 16) } : undefined}>
      {shell.logo ? <Image src={shell.logo} alt="" fill sizes={`${px}px`} className="object-cover" /> : <Sparkles aria-hidden />}
    </span>
  );
}

function Brand({ shell, tagline }: { shell: StoreShell; tagline?: boolean }) {
  return (
    <Link href={buildStoreUrl(shell.slug)} className="an-brand" aria-label={shell.name}>
      <Mark shell={shell} />
      {(shell.showStoreName || !shell.logo) && (
        <span className="min-w-0 leading-none">
          <span className="an-brand-name">{shell.name}</span>
          {tagline && shell.description && <span className="an-brand-tag">{shell.description.split(/[\n.،]/)[0]}</span>}
        </span>
      )}
    </Link>
  );
}

function SearchDialog({ storeSlug, onClose }: { storeSlug: string; onClose: () => void }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState("");
  useEffect(() => {
    input.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const term = q.trim();
    router.push(storeHref(storeSlug, term ? `/products?search=${encodeURIComponent(term)}` : "/products"));
    onClose();
  };
  return (
    <div className="an-search" role="dialog" aria-modal="true" aria-label={st("ابحث في المتجر")} onClick={onClose}>
      <form onSubmit={submit} className="an-search-box" onClick={(e) => e.stopPropagation()}>
        <Search aria-hidden className="size-5 shrink-0 text-(--an-ink-3)" />
        <input
          ref={input}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          type="search"
          enterKeyHint="search"
          placeholder={st("ابحث عن لعبة أو باقة…")}
          aria-label={st("ابحث عن لعبة أو باقة")}
          className="an-search-input"
        />
        <button type="button" onClick={onClose} className="an-iconbtn" aria-label={st("إغلاق")}>
          <X />
        </button>
      </form>
    </div>
  );
}

export default function ArenaHeader({ shell }: { shell: StoreShell }) {
  const path = useStorePath(shell.slug);
  const count = useCartCount(shell.slug);
  const [searching, setSearching] = useState(false);
  const wa = whatsappHref(shell.contact.whatsapp);
  // Studio navbar: default = side menu, compact = icon rail, centered = links in the top bar.
  const nav = shell.navbarVariant === "compact" ? "rail" : shell.navbarVariant === "centered" ? "top" : "side";

  const items: NavItem[] = [
    { href: "/", label: st("الرئيسية"), Icon: House },
    { href: "/categories", label: st("الألعاب"), Icon: Gamepad2 },
    { href: "/products", label: st("كل الباقات"), Icon: LayoutGrid },
    { href: "/track", label: st("طلباتي"), Icon: ReceiptText },
    { href: "/cart", label: st("السلة"), Icon: ShoppingBag, count },
  ];
  const tabs = [items[0], items[1], items[3], items[4]];
  // A package page belongs to its game: "الألعاب" lights up, not "كل الباقات".
  const onPackage = path.startsWith("/products/");
  const active = (href: string) => (href === "/categories" && onPackage) || (!(href === "/products" && onPackage) && isActivePath(path, href));
  const title = titleFor(path);

  return (
    <>
      {shell.announcementText && (
        <div className="an-announce">
          <Sparkles aria-hidden className="size-3.5 shrink-0" />
          <span className="truncate">{shell.announcementText}</span>
        </div>
      )}

      {nav !== "top" && (
        <aside className="an-side" data-nav={nav} aria-label={st("القائمة")}>
          <div className="an-side-brand">
            <Brand shell={shell} tagline={nav === "side"} />
          </div>
          <nav className="an-side-nav">
            {items.map(({ href, label, Icon, count: n }) => {
              const on = active(href);
              return (
                <Link key={href} href={buildStoreUrl(shell.slug, href)} className="an-navitem" data-on={on || undefined} aria-current={on ? "page" : undefined} title={nav === "rail" ? label : undefined}>
                  <span className="an-navicon">
                    <Icon className="size-5" />
                    {!!n && n > 0 && <span className="an-dot">{num(n)}</span>}
                  </span>
                  <span className="an-navlabel">{label}</span>
                </Link>
              );
            })}
          </nav>
          {nav === "side" && (
            <div className="an-side-card">
              <p className="an-h4">{wa ? st("محتاج مساعدة؟") : st("شحن سريع وآمن")}</p>
              <p className="mt-1 text-[0.75rem] leading-relaxed text-(--an-muted)">
                {wa ? st("ابعتلنا على واتساب وهنرد عليك في أقرب وقت.") : st("اختار باقتك، اكتب معرّفك، وتابع طلبك برقم الطلب.")}
              </p>
              {wa && (
                <a href={wa} target="_blank" rel="noopener noreferrer" className="an-btn an-btn--glass an-btn--sm mt-3 w-full">
                  <MessageCircle aria-hidden className="size-4" />
                  {st("كلّمنا واتساب")}
                </a>
              )}
            </div>
          )}
        </aside>
      )}

      <header className="an-top" data-nav={nav}>
        <div className="an-top-in">
          <div className="flex min-w-0 items-center gap-3">
            <span className={cn("contents", nav !== "top" && "md:hidden")}>
              <Brand shell={shell} />
            </span>
            {nav !== "top" && title && <p className="an-top-title max-md:hidden">{title}</p>}
          </div>
          {nav === "top" && (
            <nav className="an-topnav max-md:hidden" aria-label={st("القائمة")}>
              {items.slice(0, 4).map(({ href, label }) => (
                <Link key={href} href={buildStoreUrl(shell.slug, href)} className="an-topnav-link" data-on={active(href) || undefined}>
                  {label}
                </Link>
              ))}
            </nav>
          )}
          <div className="flex shrink-0 items-center gap-2">
            <button type="button" onClick={() => setSearching(true)} className="an-iconbtn" aria-label={st("ابحث")}>
              <Search />
            </button>
            <Link href={buildStoreUrl(shell.slug, "/cart")} className="an-pill" aria-label={st("السلة ({0})", num(count))}>
              <ShoppingBag aria-hidden className="size-4" />
              <span>{st("السلة")}</span>
              {count > 0 && <span className="an-pill-count">{num(count)}</span>}
            </Link>
          </div>
        </div>
      </header>

      <nav className="an-tabs" aria-label={st("التنقل")}>
        {tabs.map(({ href, label, Icon, count: n }) => {
          const on = active(href);
          return (
            <Link key={href} href={buildStoreUrl(shell.slug, href)} className="an-tab" data-on={on || undefined} aria-current={on ? "page" : undefined}>
              <span className="relative">
                <Icon className="size-5" />
                {!!n && n > 0 && <span className="an-dot">{num(n)}</span>}
              </span>
              <span className="an-tab-label">{label}</span>
              <span aria-hidden className="an-tab-bar" />
            </Link>
          );
        })}
      </nav>

      {searching && <SearchDialog storeSlug={shell.slug} onClose={() => setSearching(false)} />}
    </>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import { ChevronLeft, ChevronRight, LayoutDashboard, LogOut, Store, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { LogoutAction } from "@/actions/auth/logout.actions";
import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { cn } from "@/lib/utils";
import LanguageToggle from "./LanguageToggle";
import ThemeToggle from "./ThemeToggle";
import NavbarBrand from "./NavbarBrand";
import { UserAvatar } from "./NavbarDesktopActions";
import { useActiveNavKey, useNavLinks, useProductMenu } from "./nav-links";
import { useLang } from "../../_i18n/LanguageContext";

type MobileNavMenuProps = {
  user: {
    email: string;
    storeName: string | null;
    storeSlug: string | null;
  } | null;
};

const EASE = [0.16, 1, 0.3, 1] as const;

const sheet: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.25, ease: EASE, staggerChildren: 0.04, delayChildren: 0.06 } },
  exit: { opacity: 0, transition: { duration: 0.2, ease: "easeOut" } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } },
};

/** Two animated bars that morph between ☰ and ×. */
function MenuGlyph({ open }: { open: boolean }) {
  return (
    <span aria-hidden className="relative block h-3 w-[18px]">
      <span
        className={cn(
          "absolute inset-x-0 h-[1.5px] rounded-full bg-current transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
          open ? "top-[5px] rotate-45" : "top-0.5",
        )}
      />
      <span
        className={cn(
          "absolute inset-x-0 h-[1.5px] rounded-full bg-current transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
          open ? "top-[5px] -rotate-45" : "top-[8.5px]",
        )}
      />
    </span>
  );
}

export default function MobileNavMenu({ user }: MobileNavMenuProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { t, lang } = useLang();
  const links = useNavLinks("full");
  const product = useProductMenu();
  const activeKey = useActiveNavKey();
  const displayName = user?.storeName || user?.email?.split("@")[0] || t.navbar.myAccount;
  const Chevron = lang === "ar" ? ChevronLeft : ChevronRight;
  const close = () => setOpen(false);

  // The sheet is portalled to <body>: the glass navbar uses backdrop-filter,
  // which would otherwise become the containing block for `position: fixed`.
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const sheetEl = (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={t.navbar.openMenu}
          dir={lang === "ar" ? "rtl" : "ltr"}
          variants={sheet}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="al al-glass al-glass-thick fixed inset-0 z-90 flex flex-col overflow-y-auto rounded-none! shadow-none!"
        >
          {/* Header */}
          <div className="flex h-[76px] shrink-0 items-center justify-between px-6 pt-3">
            <NavbarBrand onClick={close} />
            <div className="flex items-center gap-1">
              <LanguageToggle />
              <ThemeToggle />
              <button
                type="button"
                onClick={close}
                aria-label="Close"
                className="grid size-11 place-items-center rounded-full text-(--al-text) hover:bg-black/5 dark:hover:bg-white/10"
              >
                <X className="size-5" />
              </button>
            </div>
          </div>

          <div className="flex flex-1 flex-col px-6 pb-[max(24px,env(safe-area-inset-bottom))]">
            {/* Product group */}
            <motion.p variants={item} className="mt-4 text-[13px] font-semibold text-(--al-muted)">
              {product.label}
            </motion.p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {product.items.slice(0, 4).map((p) => (
                <motion.div key={p.title} variants={item}>
                  <Link
                    href={p.href}
                    onClick={close}
                    className="flex min-h-11 items-center gap-2.5 rounded-2xl bg-black/[0.04] p-3 text-[14px] font-semibold text-(--al-text) active:scale-[0.98] dark:bg-white/[0.06]"
                  >
                    <span className="grid size-8 shrink-0 place-items-center rounded-[10px] bg-[#1447e6] text-white">
                      <p.icon className="size-4" strokeWidth={2} />
                    </span>
                    <span className="truncate">{p.title}</span>
                  </Link>
                </motion.div>
              ))}
            </div>

            {/* Big links */}
            <nav className="mt-8 flex flex-col">
              {links.map((link) => {
                const active = activeKey === link.key;
                return (
                  <motion.div key={link.key} variants={item}>
                    <Link
                      href={link.href}
                      onClick={close}
                      aria-current={active ? "page" : undefined}
                      className="group flex min-h-14 items-center justify-between border-b border-(--al-hair) py-3 text-[28px] font-bold text-(--al-text)"
                    >
                      <span className={cn(active && "text-[#1447e6] dark:text-[#5c8aff]")}>{link.name}</span>
                      <Chevron className="size-5 text-(--al-muted) transition-transform group-active:translate-x-0.5 rtl:group-active:-translate-x-0.5" />
                    </Link>
                  </motion.div>
                );
              })}
            </nav>

            {/* Account / CTA */}
            <motion.div variants={item} className="mt-auto pt-10">
              {user ? (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-3 rounded-2xl bg-black/[0.04] px-3 py-2.5 dark:bg-white/[0.06]">
                    <UserAvatar name={displayName} email={user.email} className="size-9 text-xs" />
                    <div className="min-w-0 text-start">
                      <p className="truncate text-sm font-semibold">{displayName}</p>
                      <p className="truncate text-xs text-(--al-muted)">{user.email}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Link href={buildStoreUrl("app")} onClick={close} className="al-btn al-btn-filled gap-2 text-[15px]">
                      <LayoutDashboard className="size-4" />
                      {t.navbar.dashboard}
                    </Link>
                    {user.storeSlug ? (
                      <Link href={buildStoreUrl(user.storeSlug)} onClick={close} className="al-btn al-btn-gray gap-2 text-[15px]">
                        <Store className="size-4" />
                        {t.navbar.viewStore}
                      </Link>
                    ) : (
                      <span />
                    )}
                  </div>

                  <form action={LogoutAction}>
                    <Button
                      type="submit"
                      variant="ghost"
                      className="h-11 w-full gap-2 rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive"
                    >
                      <LogOut className="size-4" />
                      {t.navbar.logout}
                    </Button>
                  </form>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link href="/login" onClick={close} className="al-btn al-btn-gray text-[15px]">
                    {t.navbar.login}
                  </Link>
                  <Link href="/register" onClick={close} className="al-btn al-btn-filled text-[15px]">
                    {t.navbar.startFree}
                  </Link>
                </div>
              )}
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className="flex items-center gap-1">
      {!user && (
        <Link href="/register" className="al-btn al-btn-filled al-btn-sm whitespace-nowrap">
          {t.navbar.startFree}
        </Link>
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="grid size-11 place-items-center rounded-full text-(--al-text) hover:bg-black/5 dark:hover:bg-white/10"
        aria-label={t.navbar.openMenu}
        aria-expanded={open}
      >
        <MenuGlyph open={open} />
      </button>

      {mounted && createPortal(sheetEl, document.body)}
    </div>
  );
}

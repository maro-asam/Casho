"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  Menu,
  Store,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { LogoutAction } from "@/actions/auth/logout.actions";
import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { cn } from "@/lib/utils";
import LanguageToggle from "./LanguageToggle";
import ThemeToggle from "./ThemeToggle";
import NavbarBrand from "./NavbarBrand";
import { UserAvatar } from "./NavbarDesktopActions";
import { useActiveNavKey, useNavLinks } from "./nav-links";
import { useLang } from "../../_i18n/LanguageContext";

type MobileNavMenuProps = {
  user: {
    email: string;
    storeName: string | null;
    storeSlug: string | null;
  } | null;
};

const panelVariants: Variants = {
  hidden: { opacity: 0, y: -12, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.25,
      ease: [0.22, 1, 0.36, 1],
      staggerChildren: 0.04,
      delayChildren: 0.03,
    },
  },
  exit: { opacity: 0, y: -8, scale: 0.98, transition: { duration: 0.15, ease: "easeOut" } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: -6 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: "easeOut" } },
};

export default function MobileNavMenu({ user }: MobileNavMenuProps) {
  const [open, setOpen] = useState(false);
  const { t, lang } = useLang();
  const links = useNavLinks("full");
  const activeKey = useActiveNavKey();
  const displayName = user?.storeName || user?.email?.split("@")[0] || t.navbar.myAccount;
  const Chevron = lang === "ar" ? ChevronLeft : ChevronRight;
  const Arrow = lang === "ar" ? ArrowLeft : ArrowRight;
  const close = () => setOpen(false);

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

  return (
    <div className="flex items-center gap-1">
      <ThemeToggle />

      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        className="size-9 rounded-full border border-border/70 bg-background/70 shadow-xs hover:bg-muted/60 dark:border-white/10 sm:size-10"
        aria-label={t.navbar.openMenu}
        aria-expanded={open}
      >
        <Menu className="size-5" />
      </Button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 z-80 bg-black/30 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={close}
            />

            <motion.div
              role="dialog"
              aria-modal="true"
              className="fixed inset-x-2 top-2 z-90 flex max-h-[calc(100dvh-1rem)] flex-col overflow-hidden rounded-2xl sm:inset-x-3 sm:top-3 sm:max-h-[calc(100dvh-1.5rem)] border border-border/60 bg-background shadow-2xl dark:border-white/10"
              variants={panelVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {/* Header */}
              <div className="flex h-14 shrink-0 items-center justify-between border-b border-border/60 px-3 sm:px-4">
                <NavbarBrand onClick={close} />

                <div className="flex items-center gap-0.5">
                  <LanguageToggle />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={close}
                    className="size-9 rounded-full"
                    aria-label="Close"
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              </div>

              <div className="overflow-y-auto p-3 sm:p-4">
                {/* Nav links */}
                <nav className="flex flex-col gap-0.5">
                  {links.map((link) => {
                    const active = activeKey === link.key;
                    return (
                      <motion.div key={link.key} variants={itemVariants}>
                        <Link
                          href={link.href}
                          onClick={close}
                          aria-current={active ? "page" : undefined}
                          className={cn(
                            "group flex items-center justify-between rounded-xl px-3 py-3 text-[15px] font-medium transition-colors",
                            active
                              ? "bg-primary/8 text-primary"
                              : "text-foreground/80 hover:bg-foreground/5 hover:text-foreground",
                          )}
                        >
                          <span>{link.name}</span>
                          <Chevron
                            className={cn(
                              "size-4 transition-transform",
                              active ? "text-primary/60" : "text-muted-foreground/50",
                            )}
                          />
                        </Link>
                      </motion.div>
                    );
                  })}
                </nav>

                <div className="my-3 h-px bg-border/60" />

                {/* Account / CTA */}
                <motion.div variants={itemVariants}>
                  {user ? (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/30 px-3 py-2.5">
                        <UserAvatar name={displayName} email={user.email} className="size-9 text-xs" />
                        <div className="min-w-0 text-start">
                          <p className="truncate text-sm font-semibold">{displayName}</p>
                          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <Button asChild variant="outline" className="h-11 gap-2 rounded-xl">
                          <Link href={buildStoreUrl("app")} onClick={close}>
                            <LayoutDashboard className="size-4" />
                            {t.navbar.dashboard}
                          </Link>
                        </Button>
                        {user.storeSlug ? (
                          <Button asChild variant="outline" className="h-11 gap-2 rounded-xl">
                            <Link href={buildStoreUrl(user.storeSlug)} onClick={close}>
                              <Store className="size-4" />
                              {t.navbar.viewStore}
                            </Link>
                          </Button>
                        ) : (
                          <span />
                        )}
                      </div>

                      <form action={LogoutAction}>
                        <Button
                          type="submit"
                          variant="ghost"
                          className="h-11 w-full gap-2 rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive"
                        >
                          <LogOut className="size-4" />
                          {t.navbar.logout}
                        </Button>
                      </form>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <Button asChild variant="outline" className="h-11 rounded-xl text-sm">
                        <Link href="/login" onClick={close}>
                          {t.navbar.login}
                        </Link>
                      </Button>
                      <Button asChild className="group h-11 gap-1.5 rounded-xl text-sm font-semibold shadow-sm shadow-primary/25">
                        <Link href="/register" onClick={close}>
                          {t.navbar.startFree}
                          <Arrow className="size-4" />
                        </Link>
                      </Button>
                    </div>
                  )}
                </motion.div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

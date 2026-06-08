/* eslint-disable @typescript-eslint/ban-ts-comment */
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Menu,
  X,
  Store,
  LayoutDashboard,
  LogOut,
  ArrowLeft,
  ChevronLeft,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/theme/ModeToggle";
import { buildStoreUrl } from "@/helpers/BuildStoreURL";

type MobileNavMenuProps = {
  user: {
    email: string;
    storeName: string | null;
    storeSlug: string | null;
  } | null;
};

const NAV_LINKS = [
  { name: "الرئيسية", href: "/" },
  { name: "المميزات", href: "#features" },
  { name: "الأسعار", href: "#pricing" },
  { name: "الأسئلة الشائعة", href: "#faq" },
  { name: "المدونة", href: "/blog" },
];

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const panelVariants = {
  hidden: { opacity: 0, y: -12, scale: 0.98, filter: "blur(6px)" },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: {
      duration: 0.25,
      ease: [0.22, 1, 0.36, 1],
      staggerChildren: 0.05,
      delayChildren: 0.03,
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.98,
    filter: "blur(6px)",
    transition: { duration: 0.18, ease: "easeOut" },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: -8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: "easeOut" } },
};

function UserInitials({ name, email }: { name: string; email: string }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary">
      {initials || email[0].toUpperCase()}
    </div>
  );
}

export default function MobileNavMenu({ user }: MobileNavMenuProps) {
  const [open, setOpen] = useState(false);
  const displayName = user?.storeName || user?.email?.split("@")[0] || "حسابي";

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <div className="flex items-center gap-1">
      <ModeToggle />

      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        className="size-9 rounded-lg"
        aria-label="فتح القائمة"
      >
        <Menu className="size-5" />
      </Button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 z-80 bg-black/20 backdrop-blur-sm"
              variants={backdropVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={() => setOpen(false)}
            />

            <motion.div
              className="fixed inset-x-3 top-3 z-90 overflow-hidden rounded-2xl border border-border/15 bg-background/97 shadow-2xl backdrop-blur-2xl"
              // @ts-expect-error
              variants={panelVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {/* Header */}
              <motion.div
                // @ts-expect-error
                variants={itemVariants}
                className="flex items-center justify-between border-b border-border/10 px-4 py-3.5"
              >
                <Link
                  href="/"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5"
                >
                  <span className="text-lg font-black tracking-tight">
                    <span className="text-primary">C</span>ASHO
                  </span>
                </Link>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setOpen(false)}
                  className="size-8 rounded-lg"
                >
                  <X className="size-4" />
                </Button>
              </motion.div>

              <div className="p-3">
                {/* User card */}
                {user && (
                  <motion.div
                    // @ts-expect-error
                    variants={itemVariants}
                    className="mb-3 flex items-center gap-3 rounded-xl bg-foreground/4 px-3 py-2.5"
                  >
                    <UserInitials name={displayName} email={user.email} />
                    <div className="min-w-0 text-right">
                      <p className="text-sm font-semibold">{displayName}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* Nav links */}
                <motion.nav
                  // @ts-expect-error
                  variants={itemVariants}
                  className="flex flex-col"
                >
                  {NAV_LINKS.map((link) => (
                    <Link
                      key={link.name}
                      href={link.href}
                      onClick={() => setOpen(false)}
                      className="group flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-foreground/70 transition-colors hover:bg-foreground/5 hover:text-foreground"
                    >
                      <span>{link.name}</span>
                      <ChevronLeft className="size-3.5 text-muted-foreground/50 transition-transform group-hover:-translate-x-0.5 group-hover:text-foreground/40" />
                    </Link>
                  ))}
                </motion.nav>

                <motion.div
                  // @ts-expect-error
                  variants={itemVariants}
                  className="my-3 h-px bg-border/60"
                />

                {/* Actions */}
                <motion.div
                  // @ts-expect-error
                  variants={itemVariants}
                  className="flex flex-col gap-2"
                >
                  {user ? (
                    <>
                      <Link href={buildStoreUrl("app")} onClick={() => setOpen(false)}>
                        <Button
                          variant="outline"
                          className="h-11 w-full justify-between rounded-xl border-border/20"
                        >
                          <span>لوحة التحكم</span>
                          <LayoutDashboard className="size-4 text-muted-foreground" />
                        </Button>
                      </Link>

                      {user.storeSlug && (
                        <Link href={buildStoreUrl(user.storeSlug)} onClick={() => setOpen(false)}>
                          <Button
                            variant="outline"
                            className="h-11 w-full justify-between rounded-xl border-border/20"
                          >
                            <span>عرض المتجر</span>
                            <Store className="size-4 text-muted-foreground" />
                          </Button>
                        </Link>
                      )}

                      <form action="/api/logout" className="w-full">
                        <Button
                          type="submit"
                          variant="ghost"
                          className="h-11 w-full justify-between rounded-xl text-destructive/80 hover:bg-destructive/8 hover:text-destructive"
                        >
                          <span>تسجيل الخروج</span>
                          <LogOut className="size-4" />
                        </Button>
                      </form>
                    </>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <Link href="/register" onClick={() => setOpen(false)}>
                        <Button className="group h-11 w-full rounded-xl bg-gradient-to-l from-primary to-primary/80 text-sm font-semibold shadow-lg shadow-primary/20">
                          ابدأ مجانًا
                          <ArrowLeft className="ms-2 size-4 transition-transform group-hover:-translate-x-0.5" />
                        </Button>
                      </Link>
                      <Link href="/login" onClick={() => setOpen(false)}>
                        <Button
                          variant="ghost"
                          className="h-11 w-full rounded-xl text-sm text-foreground/70"
                        >
                          تسجيل دخول
                        </Button>
                      </Link>
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

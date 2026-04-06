/* eslint-disable @typescript-eslint/ban-ts-comment */
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Menu,
  X,
  Store,
  Sparkles,
  LayoutDashboard,
  LogOut,
  ChevronLeft,
} from "lucide-react";

import { Button } from "@/components/ui/button";

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
  { name: "الأسئلة", href: "#faq" },
];

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const panelVariants = {
  hidden: {
    opacity: 0,
    y: -18,
    scale: 0.98,
    filter: "blur(8px)",
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: {
      duration: 0.28,
      ease: [0.22, 1, 0.36, 1],
      staggerChildren: 0.06,
      delayChildren: 0.04,
    },
  },
  exit: {
    opacity: 0,
    y: -14,
    scale: 0.98,
    filter: "blur(8px)",
    transition: {
      duration: 0.2,
      ease: "easeOut",
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: -10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.22, ease: "easeOut" },
  },
};

export default function MobileNavMenu({ user }: MobileNavMenuProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        onClick={() => setOpen(true)}
        className="size-11 rounded-xl border-border/60 bg-background/80 backdrop-blur-md"
        aria-label="فتح القائمة"
      >
        <Menu className="size-5" />
      </Button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 z-80 bg-black/30 backdrop-blur-sm"
              variants={backdropVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={() => setOpen(false)}
            />

            <motion.div
              className="fixed inset-x-4 top-4 z-90 origin-top rounded-3xl border border-border/60 bg-background/95 p-4 shadow-2xl backdrop-blur-2xl"
              // @ts-expect-error
              variants={panelVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <motion.div
                // @ts-expect-error
                variants={itemVariants}
                className="mb-4 flex items-center justify-between"
              >
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setOpen(false)}
                  className="size-10 rounded-xl"
                  aria-label="إغلاق القائمة"
                >
                  <X className="size-5" />
                </Button>

                <Link
                  href="/"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3"
                >
                  <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15">
                    <Store className="size-5" />
                  </div>

                  <div className="text-right leading-none">
                    <p className="text-base font-extrabold">
                      <span className="text-primary">كاشو</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      منصتك للبيع أونلاين
                    </p>
                  </div>
                </Link>
              </motion.div>

              {user && (
                <motion.div
                  // @ts-expect-error
                  variants={itemVariants}
                  className="mb-4 rounded-2xl border border-primary/10 bg-primary/5 p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="text-right">
                      <p className="text-sm font-bold">
                        {user.storeName || "حسابي"}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground break-all">
                        {user.email}
                      </p>
                    </div>

                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Sparkles className="size-4" />
                    </div>
                  </div>
                </motion.div>
              )}

              <motion.nav
                // @ts-expect-error
                variants={itemVariants}
                className="flex flex-col gap-2"
              >
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="group flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium text-foreground/85 transition-colors hover:bg-primary/5 hover:text-primary"
                  >
                    <span>{link.name}</span>
                    <ChevronLeft className="size-4 text-muted-foreground transition-transform group-hover:-translate-x-1 group-hover:text-primary" />
                  </Link>
                ))}
              </motion.nav>

              <motion.div
                // @ts-expect-error
                variants={itemVariants}
                className="my-4 h-px bg-border/70"
              />

              <motion.div
                // @ts-expect-error
                variants={itemVariants}
                className="flex flex-col gap-2"
              >
                {user ? (
                  <>
                    <Link href="/dashboard" onClick={() => setOpen(false)}>
                      <Button
                        variant="outline"
                        className="h-12 w-full justify-between rounded-2xl border-border/60 bg-background"
                      >
                        <LayoutDashboard className="size-4" />
                        <span>لوحة التحكم</span>
                      </Button>
                    </Link>

                    {user.storeSlug && (
                      <Link
                        href={`/store/${user.storeSlug}`}
                        onClick={() => setOpen(false)}
                      >
                        <Button
                          variant="outline"
                          className="h-12 w-full justify-between rounded-2xl border-border/60 bg-background"
                        >
                          <Store className="size-4" />
                          <span>عرض المتجر</span>
                        </Button>
                      </Link>
                    )}

                    <form action="/api/logout" className="w-full">
                      <Button
                        type="submit"
                        variant="ghost"
                        className="h-12 w-full justify-between rounded-2xl text-destructive hover:bg-destructive/10 hover:text-destructive"
                      >
                        <LogOut className="size-4" />
                        <span>تسجيل الخروج</span>
                      </Button>
                    </form>
                  </>
                ) : (
                  <Link href="/register" onClick={() => setOpen(false)}>
                    <Button className="h-12 w-full justify-center rounded-2xl text-sm font-bold shadow-md shadow-primary/20">
                      ابدأ دلوقتي
                      <Store className="ms-2 size-4" />
                    </Button>
                  </Link>
                )}
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

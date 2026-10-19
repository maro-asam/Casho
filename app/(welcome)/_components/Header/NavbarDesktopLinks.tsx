"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLang } from "../../_i18n/LanguageContext";
import { useActiveNavKey, useNavLinks, useProductMenu } from "./nav-links";

const SPRING = { type: "spring", stiffness: 420, damping: 34 } as const;

/**
 * Centered links with a Liquid-Glass "lens" that slides to whichever link is
 * hovered (or the active one), plus a Product flyout.
 */
export default function NavbarDesktopLinks() {
  const links = useNavLinks();
  const product = useProductMenu();
  const activeKey = useActiveNavKey();
  const [hovered, setHovered] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const lensKey = open ? "product" : (hovered ?? activeKey);

  return (
    <LayoutGroup id="landing-nav">
      <nav aria-label="Main" className="relative hidden items-center lg:flex" onPointerLeave={() => setHovered(null)}>
        <ProductFlyout
          label={product.label}
          active={activeKey === "product"}
          lens={lensKey === "product"}
          open={open}
          setOpen={setOpen}
          onHover={() => setHovered("product")}
        />

        {links.map((link) => (
          <Link
            key={link.key}
            href={link.href}
            onPointerEnter={() => setHovered(link.key)}
            onFocus={() => setHovered(link.key)}
            onBlur={() => setHovered(null)}
            aria-current={activeKey === link.key ? "page" : undefined}
            className={cn(
              "relative whitespace-nowrap rounded-full px-4 py-2 text-[13px] transition-colors focus-visible:outline-none",
              activeKey === link.key ? "font-semibold text-(--al-text)" : "text-(--al-text)/70 hover:text-(--al-text)",
            )}
          >
            {lensKey === link.key && <Lens />}
            <span className="relative">{link.name}</span>
          </Link>
        ))}
      </nav>
    </LayoutGroup>
  );
}

function Lens() {
  return (
    <motion.span
      layoutId="nav-lens"
      transition={SPRING}
      aria-hidden
      className="absolute inset-0 rounded-full bg-black/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.7),inset_0_0_0_0.5px_rgba(0,0,0,0.06)] dark:bg-white/10 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
    />
  );
}

function ProductFlyout({
  label,
  active,
  lens,
  open,
  setOpen,
  onHover,
}: {
  label: string;
  active: boolean;
  lens: boolean;
  open: boolean;
  setOpen: (v: boolean) => void;
  onHover: () => void;
}) {
  const product = useProductMenu();
  const { lang } = useLang();
  const Chevron = lang === "ar" ? ChevronLeft : ChevronRight;
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<number | undefined>(undefined);

  const openNow = () => {
    window.clearTimeout(closeTimer.current);
    setOpen(true);
  };
  const closeSoon = () => {
    window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setOpen(false), 140);
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onDown);
    };
  }, [open, setOpen]);

  useEffect(() => () => window.clearTimeout(closeTimer.current), []);

  return (
    <div
      ref={rootRef}
      onPointerEnter={(e) => {
        onHover();
        if (e.pointerType === "mouse") openNow();
      }}
      onPointerLeave={(e) => e.pointerType === "mouse" && closeSoon()}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen(!open)}
        className={cn(
          "relative flex items-center gap-1 whitespace-nowrap rounded-full px-4 py-2 text-[13px] transition-colors focus-visible:outline-none",
          active || open ? "font-semibold text-(--al-text)" : "text-(--al-text)/70 hover:text-(--al-text)",
        )}
      >
        {lens && <Lens />}
        <span className="relative">{label}</span>
        <ChevronDown className={cn("relative size-3.5 opacity-60 transition-transform duration-300", open && "rotate-180")} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            id={panelId}
            initial={{ opacity: 0, y: -8, scale: 0.97, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -6, scale: 0.98, filter: "blur(4px)" }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            style={{ transformOrigin: "50% 0%" }}
            className="absolute left-1/2 top-full z-50 w-[720px] -translate-x-1/2 pt-4"
          >
            {/* Solid surface: nested inside the navbar's backdrop-filter, a second blur can't reach the page. */}
            <div className="grid grid-cols-[1fr_220px] gap-2 rounded-[28px] bg-white p-2 shadow-[0_24px_60px_-12px_rgba(0,0,0,0.18)] ring-1 ring-black/[0.06] dark:bg-[#1c1c1e] dark:shadow-[0_24px_60px_-12px_rgba(0,0,0,0.6)] dark:ring-white/10">
              <ul className="grid grid-cols-2 gap-1 p-1">
                {product.items.map((item, i) => (
                  <motion.li
                    key={item.title}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.03 * i, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className="group flex items-start gap-3 rounded-[18px] p-3 transition-colors hover:bg-black/[0.04] focus-visible:bg-black/[0.04] focus-visible:outline-none dark:hover:bg-white/[0.06]"
                    >
                      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#1447e6]/10 text-[#1447e6] transition-colors group-hover:bg-[#1447e6] group-hover:text-white dark:bg-[#3366ff]/15 dark:text-[#7aa0ff]">
                        <item.icon className="size-[18px]" strokeWidth={1.9} />
                      </span>
                      <span className="min-w-0 pt-0.5">
                        <span className="block text-[14px] font-semibold text-(--al-text)">{item.title}</span>
                        <span className="mt-0.5 block text-[12px] leading-snug text-(--al-muted)">{item.text}</span>
                      </span>
                    </Link>
                  </motion.li>
                ))}
              </ul>

              <Link
                href="/register"
                onClick={() => setOpen(false)}
                className="group relative flex flex-col justify-end overflow-hidden rounded-[22px] bg-[linear-gradient(160deg,#0b2a8f,#1447e6_60%,#4d7cff)] p-5 text-white"
              >
                <span aria-hidden className="absolute -end-10 -top-10 size-40 rounded-full bg-white/10" />
                <span aria-hidden className="absolute -start-6 top-16 size-24 rounded-full bg-white/10" />
                <span className="relative text-[19px] font-bold leading-snug">{product.promoTitle}</span>
                <span className="relative mt-1 text-[12px] text-white/75">{product.promoText}</span>
                <span className="relative mt-4 inline-flex items-center gap-1 text-[13px] font-semibold">
                  {product.promoCta}
                  <Chevron className="size-4 transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" />
                </span>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

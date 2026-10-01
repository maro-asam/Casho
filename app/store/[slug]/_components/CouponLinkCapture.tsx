"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { TicketPercent, X } from "lucide-react";

export const pendingCouponKey = (slug: string) => `casho:coupon:${slug}`;

/**
 * `?coupon=CODE` on any store page (influencer / WhatsApp links): remember the
 * code so the cart applies it automatically, and tell the visitor.
 */
export function CouponLinkCapture({ storeSlug }: { storeSlug: string }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [code, setCode] = useState<string | null>(null);

  useEffect(() => {
    const raw = searchParams.get("coupon");
    if (!raw) return;
    const clean = raw.trim().toUpperCase().slice(0, 30);
    if (!/^[A-Z0-9_-]{3,30}$/.test(clean)) return;
    try {
      localStorage.setItem(pendingCouponKey(storeSlug), JSON.stringify({ code: clean, at: Date.now() }));
    } catch {}
    // Drop the param so a refresh/share doesn't re-trigger, keep the rest.
    const next = new URLSearchParams(searchParams.toString());
    next.delete("coupon");
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    const t = setTimeout(() => setCode(clean), 0);
    return () => clearTimeout(t);
  }, [searchParams, storeSlug, router, pathname]);

  if (!code) return null;

  return (
    <div
      role="status"
      className="fixed inset-x-4 top-4 z-[65] mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-(--store-border,#e4e4e7) bg-(--store-card,#fff) p-3 text-(--store-card-foreground,#0a0a0a) shadow-xl animate-in fade-in-0 slide-in-from-top-4"
      dir="rtl"
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-(--store-primary,#111827) text-(--store-primary-foreground,#fff)">
        <TicketPercent className="size-4" />
      </span>
      <p className="min-w-0 flex-1 text-sm">
        كود{" "}
        <span className="font-mono font-semibold" dir="ltr">
          {code}
        </span>{" "}
        جاهز — هيتطبق لوحده في السلة.
      </p>
      <button type="button" onClick={() => setCode(null)} aria-label="إغلاق" className="grid size-7 place-items-center rounded-full hover:bg-black/5">
        <X className="size-4" />
      </button>
    </div>
  );
}

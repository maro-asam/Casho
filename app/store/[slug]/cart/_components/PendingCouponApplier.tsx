"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ApplyCouponAction } from "@/actions/store/cart.actions";
import { pendingCouponKey } from "../../_components/CouponLinkCapture";

const MAX_AGE_MS = 14 * 86400_000;

/** Applies a code remembered from a `?coupon=` link, once, then forgets it. */
export function PendingCouponApplier({ storeSlug }: { storeSlug: string }) {
  const router = useRouter();
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    done.current = true;
    let pending: { code: string; at: number } | null = null;
    try {
      pending = JSON.parse(localStorage.getItem(pendingCouponKey(storeSlug)) ?? "null");
      localStorage.removeItem(pendingCouponKey(storeSlug));
    } catch {}
    if (!pending?.code || Date.now() - pending.at > MAX_AGE_MS) return;

    const fd = new FormData();
    fd.set("code", pending.code);
    const code = pending.code;
    ApplyCouponAction(storeSlug, fd)
      .then((result) => {
        const params = new URLSearchParams({
          couponStatus: result.success ? "success" : "error",
          couponMessage: result.success ? `اتطبق كود ${code} 🎉` : (result.error ?? "الكود مش صالح"),
        });
        router.replace(`?${params.toString()}`, { scroll: false });
        router.refresh();
      })
      .catch(() => {});
  }, [storeSlug, router]);

  return null;
}

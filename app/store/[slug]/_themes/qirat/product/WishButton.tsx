"use client";

import { Heart } from "lucide-react";

import { cn } from "@/lib/utils";
import { useLocalList } from "../../shared/local-list";
import { openWishlist, wishKey } from "../lib/events";
import { qrToast } from "../toast";

/** Saves a piece to the shopper's wishlist (kept in this browser). */
export default function WishButton({ storeSlug, productId, name, className, label }: { storeSlug: string; productId: string; name: string; className?: string; /** Show text next to the heart. */ label?: boolean }) {
  const { list, toggle } = useLocalList(wishKey(storeSlug), 60);
  const on = list.includes(productId);

  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={on ? `شيل ${name} من قايمة الأمنيات` : `احفظ ${name} في قايمة الأمنيات`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(productId);
        if (!on) qrToast.success("اتحفظت في قايمة أمنياتك", { action: { label: "القايمة", onClick: openWishlist } });
      }}
      className={cn("qr-wish", label && "qr-wish--label", className)}
      data-on={on}
    >
      <Heart aria-hidden />
      {label && <span>{on ? "في قايمة أمنياتك" : "احفظها"}</span>}
    </button>
  );
}

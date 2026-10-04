"use client";

import { Share2 } from "lucide-react";
import { toast } from "sonner";

import { btn } from "../ui";

/** Native share sheet where available (phones), copy-link elsewhere. */
export default function ShareButton({ title }: { title: string }) {
  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast.success("اتنسخ رابط المنتج");
    } catch (e) {
      if ((e as Error)?.name !== "AbortError") toast.error("مقدرناش ننسخ الرابط");
    }
  };

  return (
    <button type="button" onClick={share} className={btn({ variant: "ghost", size: "sm", className: "-me-2 text-muted-foreground" })}>
      <Share2 />
      مشاركة
    </button>
  );
}

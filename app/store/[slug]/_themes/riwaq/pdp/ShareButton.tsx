"use client";

import { Share2 } from "lucide-react";

import { rqToast } from "../toast";

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
      rqToast.success("اتنسخ رابط المنتج");
    } catch (e) {
      if ((e as Error)?.name !== "AbortError") rqToast.error("مقدرناش ننسخ الرابط");
    }
  };

  return (
    <button type="button" onClick={share} className="-me-2 inline-flex min-h-11 items-center gap-2 px-2 text-sm font-semibold text-(--rq-quiet) hover:text-(--rq-ink)">
      <Share2 className="size-4" />
      مشاركة
    </button>
  );
}

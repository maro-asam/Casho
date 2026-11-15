"use client";

import { Share2 } from "lucide-react";

import { mdToast } from "../toast";
import { st } from "@/lib/i18n/storefront";

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
      mdToast.success(st("اتنسخ رابط المنتج"));
    } catch (e) {
      if ((e as Error)?.name !== "AbortError") mdToast.error(st("مقدرناش ننسخ الرابط"));
    }
  };
  return (
    <button type="button" onClick={share} aria-label={st("مشاركة المنتج")} className="md-btn md-btn--ghost md-btn--icon">
      <Share2 />
    </button>
  );
}

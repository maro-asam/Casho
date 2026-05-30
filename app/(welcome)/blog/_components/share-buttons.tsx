"use client";

import { useState } from "react";
import { Link2, Check, X, MessageCircle } from "lucide-react";

type ShareButtonsProps = {
  title: string;
  url: string;
};

export function ShareButtons({ title, url }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareOnTwitter = () => {
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
      "_blank",
    );
  };

  const shareOnWhatsApp = () => {
    window.open(
      `https://wa.me/?text=${encodeURIComponent(`${title}\n${url}`)}`,
      "_blank",
    );
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-sm text-muted-foreground">شارك المقال:</span>

      <button
        onClick={shareOnWhatsApp}
        className="inline-flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm text-muted-foreground transition hover:border-green-500 hover:text-green-500"
      >
        <MessageCircle className="size-4" />
        واتساب
      </button>

      <button
        onClick={shareOnTwitter}
        className="inline-flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm text-muted-foreground transition hover:border-foreground hover:text-foreground"
      >
        <X className="size-4" />X
      </button>

      <button
        onClick={copyLink}
        className="inline-flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm text-muted-foreground transition hover:border-primary hover:text-primary"
      >
        {copied ? (
          <Check className="size-4 text-green-500" />
        ) : (
          <Link2 className="size-4" />
        )}
        {copied ? "تم النسخ!" : "نسخ الرابط"}
      </button>
    </div>
  );
}

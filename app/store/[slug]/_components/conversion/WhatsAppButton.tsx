"use client";

import { usePathname } from "next/navigation";
import type { ConversionConfig } from "@/lib/conversion/conversion-config";
import { toWhatsAppDigits } from "@/lib/conversion/conversion-config";
import { cn } from "@/lib/utils";
import { hasStickyBar, storePath } from "./widget-position";

export function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="currentColor">
      <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.79-1.47-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.6-.92-2.2-.24-.58-.49-.5-.67-.5h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.21 3.08.15.2 2.1 3.2 5.08 4.48.71.31 1.27.5 1.7.63.71.23 1.36.2 1.88.12.57-.09 1.75-.72 2-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35M12.05 21.5h-.01a9.4 9.4 0 0 1-4.8-1.32l-.34-.2-3.57.94.95-3.48-.22-.36a9.42 9.42 0 0 1-1.44-5.02c0-5.2 4.24-9.44 9.45-9.44a9.38 9.38 0 0 1 6.67 2.77 9.38 9.38 0 0 1 2.76 6.68c0 5.2-4.24 9.44-9.45 9.44m8.04-17.48A11.3 11.3 0 0 0 12.04.7C5.78.7.68 5.8.68 12.06c0 2 .52 3.96 1.52 5.68L.6 23.6l6-1.57a11.33 11.33 0 0 0 5.43 1.38h.01c6.26 0 11.36-5.1 11.36-11.36 0-3.03-1.18-5.89-3.32-8.03" />
    </svg>
  );
}

type Props = {
  storeSlug: string;
  config: ConversionConfig["whatsapp"];
  phone: string;
};

/** Floating "chat on WhatsApp" — the #1 sales channel for Egyptian stores. */
export function WhatsAppButton({ storeSlug, config, phone }: Props) {
  const pathname = usePathname();
  const path = storePath(pathname, storeSlug);
  if (path.startsWith("/checkout")) return null;

  function open() {
    let text = config.greeting;
    if (config.attachPage && typeof window !== "undefined") {
      const title = document.title.split("|")[0]?.trim();
      text = `${text}\n${title ? `${title}\n` : ""}${window.location.href}`;
    }
    window.open(`https://wa.me/${toWhatsAppDigits(phone)}?text=${encodeURIComponent(text)}`, "_blank", "noopener");
  }

  return (
    <button
      type="button"
      onClick={open}
      aria-label={config.label || "كلمنا واتساب"}
      className={cn(
        "group fixed bottom-5 z-[60] flex items-center gap-2 rounded-full bg-[#25D366] p-3 text-white shadow-lg shadow-black/15 transition hover:scale-105 hover:shadow-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#25D366]/40",
        config.position === "start" ? "start-5" : "end-5",
        config.devices === "mobile" && "md:hidden",
        config.devices === "desktop" && "max-md:hidden",
        hasStickyBar(path) && "max-lg:bottom-24",
      )}
    >
      <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-[#25D366]/40 [animation-duration:2.5s] [animation-iteration-count:3]" />
      <WhatsAppIcon className="size-6" />
      {config.showLabel && config.label && (
        <span className="max-sm:hidden pe-1 text-sm font-semibold">{config.label}</span>
      )}
    </button>
  );
}

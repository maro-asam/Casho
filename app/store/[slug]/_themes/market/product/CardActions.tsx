"use client";

import { Eye } from "lucide-react";

import { cn } from "@/lib/utils";
import { openQuickView } from "../lib/events";
import { st } from "@/lib/i18n/storefront";

/** "Quick look" button that appears over the image on hover. */
export function QuickLook({ slug, name, className }: { slug: string; name: string; className?: string }) {
  return (
    <button type="button" onClick={() => openQuickView(slug)} aria-label={st("نظرة سريعة على {0}", name)} title={st("نظرة سريعة")} className={cn("mk-fab relative z-[2] size-9", className)}>
      <Eye />
    </button>
  );
}

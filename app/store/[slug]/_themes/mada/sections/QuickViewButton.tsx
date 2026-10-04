"use client";

import { Eye } from "lucide-react";

import { openQuickView } from "../lib/events";
import { btn } from "../ui";

export default function QuickViewButton({ slug, label = "نظرة سريعة" }: { slug: string; label?: string }) {
  return (
    <button type="button" onClick={() => openQuickView(slug)} className={btn({ variant: "outline" })}>
      <Eye />
      {label}
    </button>
  );
}

"use client";

import { useTransition } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Smartphone,
  Tablet,
  Monitor,
  ExternalLink,
  Globe,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useBuilder, type PreviewDevice } from "./BuilderContext";
import { PublishThemeFromDraftAction } from "@/actions/settings/theme.actions";

// ─── Device switcher config ───────────────────────────────────────────────────

const DEVICES: { id: PreviewDevice; icon: React.ElementType; label: string }[] = [
  { id: "mobile",  icon: Smartphone, label: "جوال" },
  { id: "tablet",  icon: Tablet,     label: "تابلت" },
  { id: "desktop", icon: Monitor,    label: "سطح المكتب" },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function BuilderTopBar() {
  const {
    storeId,
    storeSlug,
    previewDevice,
    setPreviewDevice,
    reloadPreview,
  } = useBuilder();

  const [isPublishing, startPublish] = useTransition();

  const handlePublish = () => {
    startPublish(async () => {
      const result = await PublishThemeFromDraftAction({ storeId });
      if (result.success) {
        toast.success("تم نشر التغييرات بنجاح");
        reloadPreview();
      } else {
        toast.error(result.message);
      }
    });
  };

  return (
    <div
      className="flex h-12 shrink-0 items-center justify-between border-b bg-background px-3 gap-2"
      dir="rtl"
    >
      {/* ── Right: Back button ────────────────────────────────────────────── */}
      <Button variant="ghost" size="sm" asChild className="gap-1.5 shrink-0 h-8">
        <Link href="/dashboard/customization">
          <ArrowRight className="size-3.5" />
          <span className="text-sm hidden sm:inline">تخصيص</span>
        </Link>
      </Button>

      {/* ── Center: Device switcher ──────────────────────────────────────── */}
      <div
        className="flex items-center gap-0.5 rounded-lg border bg-muted/40 p-0.5"
        dir="ltr"
      >
        {DEVICES.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setPreviewDevice(id)}
            title={label}
            className={cn(
              "relative flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs transition-colors",
              previewDevice === id
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {previewDevice === id && (
              <motion.span
                layoutId="active-device-bg"
                className="absolute inset-0 rounded-md bg-background shadow-sm"
                transition={{ type: "spring", bounce: 0.18, duration: 0.3 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              <Icon className="size-3.5" />
              <span className="hidden sm:inline">{label}</span>
            </span>
          </button>
        ))}
      </div>

      {/* ── Left: Action buttons ─────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={reloadPreview}
          title="تحديث المعاينة"
          className="h-8 w-8 p-0 text-muted-foreground"
        >
          <RefreshCw className="size-3.5" />
        </Button>

        <Button variant="outline" size="sm" asChild className="gap-1.5 h-8 hidden sm:flex">
          <a href={`/store/${storeSlug}`} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="size-3.5" />
            معاينة خارجية
          </a>
        </Button>

        <Button
          size="sm"
          className="gap-1.5 h-8"
          onClick={handlePublish}
          disabled={isPublishing}
        >
          <Globe className="size-3.5" />
          {isPublishing ? "جاري النشر…" : "نشر"}
        </Button>
      </div>
    </div>
  );
}

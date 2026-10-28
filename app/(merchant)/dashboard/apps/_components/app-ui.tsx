import Link from "next/link";
import type { ReactNode } from "react";
import { BadgeCheck, Camera, ChevronRight, Code2, ExternalLink, ImageDown, Palette, QrCode, Send, ShoppingBag, Type, type LucideIcon } from "lucide-react";

import { APP_CATEGORY_LABELS, type AppDefinition, type AppId } from "@/lib/apps/catalog";
import { cn } from "@/lib/utils";
import { tr } from "@/lib/i18n/dashboard";

const APP_ICONS: Record<AppId, { icon: LucideIcon; tint: string }> = {
  themes: { icon: Palette, tint: "bg-linear-to-b from-(--sys-indigo)/80 to-(--sys-indigo) text-white" },
  fonts: { icon: Type, tint: "bg-linear-to-b from-(--sys-orange)/80 to-(--sys-orange) text-white" },
  "confirm-it": { icon: BadgeCheck, tint: "bg-linear-to-b from-[#25D366] to-[#128C7E] text-white" },
  "image-compressor": { icon: ImageDown, tint: "bg-linear-to-b from-(--sys-teal)/80 to-(--sys-teal) text-white" },
  instagram: { icon: Camera, tint: "bg-linear-to-br from-[#FEDA75] via-[#D62976] to-[#4F5BD5] text-white" },
  telegram: { icon: Send, tint: "bg-linear-to-b from-[#37AEE2] to-[#1E96C8] text-white" },
  "qr-code": { icon: QrCode, tint: "bg-linear-to-b from-zinc-700 to-zinc-900 text-white" },
  "shopify-import": { icon: ShoppingBag, tint: "bg-linear-to-b from-[#95BF47] to-[#5E8E3E] text-white" },
  "api-keys": { icon: Code2, tint: "bg-linear-to-b from-(--sys-gray)/80 to-(--sys-gray) text-white" },
};

/** The app's tile, iOS home-screen style. */
export function AppIcon({ id, size = "md" }: { id: AppId; size?: "md" | "lg" }) {
  const { icon: Icon, tint } = APP_ICONS[id];
  return (
    <span
      aria-hidden
      className={cn(
        "grid shrink-0 place-items-center shadow-[inset_0_1px_0_rgba(255,255,255,.3)]",
        size === "lg" ? "size-16 rounded-[18px]" : "size-12 rounded-[14px]",
        tint,
      )}
    >
      <Icon className={size === "lg" ? "size-8" : "size-6"} strokeWidth={1.9} />
    </span>
  );
}

/** Top of every app page: back to the catalog, icon, name, who makes it, status, actions. */
export function AppPageHeader({ app, status, actions }: { app: AppDefinition; status?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="space-y-4 pt-2">
      <Link href="/apps" className="inline-flex items-center gap-1 text-[15px] text-primary hover:underline">
        <ChevronRight className="size-4 ltr:-scale-x-100" />
        {tr("كل التطبيقات")}
      </Link>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <AppIcon id={app.id} size="lg" />
          <div className="min-w-0 space-y-1">
            <h1 className="text-[28px] leading-[34px] font-bold ltr:tracking-[-0.02em]">{tr(app.name)}</h1>
            <p className="text-[15px] text-muted-foreground">{tr(app.tagline)}</p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-muted-foreground">
              <span>
                {tr(APP_CATEGORY_LABELS[app.category])} · {tr("من")} {app.developer}
              </span>
              {app.website && (
                <a href={app.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                  {tr("الموقع")}
                  <ExternalLink className="size-3" />
                </a>
              )}
              {status}
            </div>
          </div>
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}

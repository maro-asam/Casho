"use client";

import {
  Droplets,
  GalleryHorizontal,
  Layers,
  LayoutGrid,
  MessageCircle,
  Palette,
  Search,
  ShoppingBag,
  Sparkles,
  Tags,
  Type,
  UserSquare,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useBuilder, type ReadinessItem } from "../BuilderContext";
import { Group, NavRow, PanelBody } from "../studio-ui";
import { lazyIntl, tr } from "@/lib/i18n/dashboard";

const nf = lazyIntl.number();

/** Weighted completion ring. */
function Ring({ value }: { value: number }) {
  const r = 22;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative size-14 shrink-0" role="img" aria-label={tr("جاهزية المتجر {0}٪", nf.format(value))}>
      <svg viewBox="0 0 56 56" className="size-14 -rotate-90">
        <circle cx="28" cy="28" r={r} fill="none" stroke="currentColor" strokeWidth="5" className="text-foreground/8" />
        <circle
          cx="28"
          cy="28"
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - value / 100)}
          className={cn("transition-[stroke-dashoffset] duration-700 ease-(--ease-apple)", value >= 80 ? "text-(--sys-green)" : "text-primary")}
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center text-[13px] font-semibold tabular-nums">{tr("{0}٪", nf.format(value))}</span>
    </div>
  );
}

function StoreCard() {
  const { storeName, storeHost, appearance, theme, readiness, navigate } = useBuilder();
  const total = readiness.reduce((s, i) => s + i.weight, 0);
  const done = readiness.filter((i) => i.done).reduce((s, i) => s + i.weight, 0);
  const score = total ? Math.round((done / total) * 100) : 100;
  const next = readiness.filter((i) => !i.done).sort((a, b) => b.weight - a.weight).slice(0, 3);

  const open = (item: ReadinessItem) => (item.panel ? navigate(item.panel) : undefined);

  return (
    <section className="space-y-1.5">
      <div className="overflow-hidden rounded-[18px] bg-card">
        {/* Brand strip in the store's own colors */}
        <div className="relative h-20" style={{ background: `linear-gradient(135deg, ${theme.tokens.primary}, ${theme.tokens.secondary})` }}>
          {appearance.coverImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={appearance.coverImage} alt="" className="absolute inset-0 size-full object-cover opacity-90" />
          )}
        </div>
        <div className="flex items-end gap-3 px-4 pb-4">
          <div className="-mt-7 grid size-14 shrink-0 place-items-center overflow-hidden rounded-2xl bg-card shadow-[0_4px_14px_rgba(0,0,0,0.12)] ring-4 ring-card">
            {appearance.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={appearance.logo} alt="" className="size-full object-contain" />
            ) : (
              <span className="text-[22px] font-bold" style={{ color: theme.tokens.primary }}>
                {storeName.trim().slice(0, 1)}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1 pt-2">
            <p className="truncate text-[17px] leading-[22px] font-semibold">{storeName}</p>
            <p className="truncate text-[13px] text-muted-foreground" dir="ltr">
              {storeHost}
            </p>
          </div>
          <Ring value={score} />
        </div>
        <dl className="grid grid-cols-3 border-t-[0.5px] border-border text-center">
          {[
            [tr("الثيم"), theme.presetName, "theme"],
            [tr("الخط"), theme.fontName, "fonts"],
            [tr("الألوان"), null, "colors"],
          ].map(([label, value, panel]) => (
            <button
              key={panel}
              type="button"
              onClick={() => navigate(panel as "theme" | "fonts" | "colors")}
              className="px-2 py-2.5 transition-colors hover:bg-muted/50 [&+&]:border-s-[0.5px] [&+&]:border-border"
            >
              <dt className="text-[11px] text-muted-foreground">{label}</dt>
              <dd className="mt-0.5 flex h-5 items-center justify-center truncate text-[13px] font-medium">
                {value ?? (
                  <span className="flex gap-1">
                    <span className="size-4 rounded-full ring-1 ring-black/10" style={{ background: theme.tokens.primary }} />
                    <span className="size-4 rounded-full ring-1 ring-black/10" style={{ background: theme.tokens.secondary }} />
                  </span>
                )}
              </dd>
            </button>
          ))}
        </dl>
      </div>

      {next.length > 0 && (
        <Group title={tr("خطوات تخلّي متجرك أحسن")}>
          {next.map((item) => (
            <NavRow
              key={item.id}
              label={item.label}
              description={item.hint}
              onClick={item.panel ? () => open(item) : undefined}
              href={item.href}
            />
          ))}
        </Group>
      )}
    </section>
  );
}

export default function HomePanel() {
  const { navigate, theme, popups, conversion, whatsappFallback } = useBuilder();
  const [now] = useState(() => Date.now());
  const sectionsOn = Object.entries(theme.sections.home).filter(([k, v]) => k.startsWith("show") && v === true).length;
  const livePopups = popups.filter(
    (p) => p.isActive && (!p.startsAt || new Date(p.startsAt).getTime() <= now) && (!p.endsAt || new Date(p.endsAt).getTime() > now),
  ).length;
  const whatsappOn = conversion.whatsapp.enabled && Boolean(conversion.whatsapp.phone || whatsappFallback);
  const onOff = (on: boolean) => (on ? tr("شغّال") : tr("مقفول"));

  return (
    <PanelBody>
      <StoreCard />

      <Group title={tr("المظهر")}>
        <NavRow icon={Palette} tint="bg-(--sys-indigo)" label={tr("الثيم")} value={theme.presetName} onClick={() => navigate("theme")} />
        <NavRow icon={Droplets} tint="bg-primary" label={tr("الألوان")} onClick={() => navigate("colors")} />
        <NavRow icon={Type} tint="bg-(--sys-orange)" label={tr("الخط واللغة")} value={theme.fontName} onClick={() => navigate("fonts")} />
        <NavRow icon={LayoutGrid} tint="bg-(--sys-teal)" label={tr("شكل العرض")} onClick={() => navigate("layout")} />
      </Group>

      <Group title={tr("المحتوى")}>
        <NavRow
          icon={Layers}
          tint="bg-(--sys-green)"
          label={tr("أقسام الرئيسية")}
          value={tr("{0} قسم", nf.format(sectionsOn))}
          onClick={() => navigate("sections")}
        />
        <NavRow icon={UserSquare} tint="bg-(--sys-gray)" label={tr("الهوية واللوجو")} onClick={() => navigate("identity")} />
      </Group>

      <Group title={tr("زوّد مبيعاتك")} footer={tr("أدوات البيع بتشتغل على متجرك فورًا — مش بتستنى النشر.")}>
        <NavRow
          icon={Sparkles}
          tint="bg-(--sys-red)"
          label={tr("النوافذ المنبثقة")}
          value={livePopups ? tr("{0} شغّالة", nf.format(livePopups)) : tr("مقفولة")}
          onClick={() => navigate("popups")}
        />
        <NavRow icon={MessageCircle} tint="bg-[#25D366]" label={tr("زر واتساب")} value={onOff(whatsappOn)} onClick={() => navigate("whatsapp")} />
        <NavRow
          icon={ShoppingBag}
          tint="bg-(--sys-orange)"
          label={tr("إشعارات الشراء")}
          value={onOff(conversion.purchaseToasts.enabled)}
          onClick={() => navigate("social-proof")}
        />
      </Group>

      <Group title={tr("صفحات تانية بتأثر على شكل المتجر")}>
        <NavRow icon={GalleryHorizontal} tint="bg-(--sys-indigo)" label={tr("البانرز")} href="/banners" />
        <NavRow icon={Tags} tint="bg-(--sys-teal)" label={tr("التصنيفات")} href="/categories" />
        <NavRow icon={Search} tint="bg-(--sys-gray)" label={tr("الظهور في جوجل")} href="/seo" />
      </Group>
    </PanelBody>
  );
}

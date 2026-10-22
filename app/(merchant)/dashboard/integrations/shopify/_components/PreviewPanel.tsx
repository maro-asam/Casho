"use client";

import { AlertTriangle, Loader2, X } from "lucide-react";
import { appleButton } from "@/components/saas-page";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import type { ImportableEntity } from "@/lib/integrations/import/types";
import type { ConnectionView } from "@/lib/integrations/import/views";
import type { ShopifyPreviewCounts } from "@/lib/integrations/shopify/source";
import { cn } from "@/lib/utils";
import { tr } from "@/lib/i18n/dashboard";
import { Group, IconTile } from "../../../settings/_components/settings-ui";
import { ENTITY_META, NOT_IMPORTED, nf } from "./import-meta";
import { ENTITY_TILE, ShopifyMark } from "./import-ui";

const ENTITY_ORDER: ImportableEntity[] = ["COLLECTION", "PRODUCT", "CUSTOMER", "ORDER"];

export function PreviewSkeleton() {
  return (
    <section className="apple-card p-6" aria-busy="true" aria-label={tr("جاري تجهيز المعاينة")}>
      <p className="flex items-center gap-2 text-[15px] text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        {tr("بنعدّ البيانات في متجرك على Shopify…")}
      </p>
      <div className="mt-6 grid grid-cols-2 gap-6 sm:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-8 w-20 rounded-lg" />
            <Skeleton className="h-3.5 w-24 rounded-full" />
          </div>
        ))}
      </div>
      <Skeleton className="mt-8 h-56 rounded-[14px]" />
    </section>
  );
}

/** What the importer leaves behind — sidebar list, so nothing is promised that isn't done. */
export function NotImportedCard() {
  return (
    <section className="space-y-2">
      <h2 className="px-4 text-[13px] font-semibold text-muted-foreground">{tr("مش هيتنقل حالياً")}</h2>
      <ul className="apple-card space-y-2.5 rounded-[14px] px-4 py-3.5">
        {NOT_IMPORTED.map((item) => (
          <li key={item} className="flex items-start gap-2.5 text-[13px] leading-[18px] text-muted-foreground">
            <span className="mt-px grid size-4 shrink-0 place-items-center rounded-full bg-(--fill-3)">
              <X className="size-2.5" strokeWidth={3} />
            </span>
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}

type Props = {
  counts: ShopifyPreviewCounts;
  connection: ConnectionView;
  selected: ImportableEntity[];
  onToggle: (entity: ImportableEntity, checked: boolean) => void;
  onStart: () => void;
  starting: boolean;
};

export function PreviewPanel({ counts, connection, selected, onToggle, onStart, starting }: Props) {
  const found = [
    { label: tr("منتج"), value: counts.products },
    { label: tr("نوع منتج (Variant)"), value: counts.variants },
    { label: tr("عنصر مخزون"), value: counts.variants },
    { label: tr("تصنيف (Collection)"), value: counts.collections },
    { label: tr("عميل"), value: counts.customers },
    { label: tr("طلب"), value: counts.orders },
  ];
  const countFor: Record<ImportableEntity, number> = {
    COLLECTION: counts.collections,
    PRODUCT: counts.products,
    CUSTOMER: counts.customers,
    ORDER: counts.orders,
  };

  const notes: string[] = [];
  if (connection.currencyCode && connection.currencyCode !== "EGP") {
    notes.push(tr("عملة متجرك على Shopify {0}. الأسعار هتتنقل بنفس الأرقام من غير تحويل لعملة الجنيه — راجعها بعد الاستيراد.", connection.currencyCode));
  }
  if (!connection.hasAllOrders && selected.includes("ORDER")) {
    notes.push(tr("Shopify بيسمح لنا بقراءة طلبات آخر 60 يوم بس. الرقم اللي فوق هو عدد الطلبات اللي هتتنقل."));
  }
  if (selected.includes("ORDER") && !selected.includes("PRODUCT")) {
    notes.push(tr("الطلبات من غير المنتجات هتترتبط بمنتج «غير متاح» عام. الأفضل تنقل المنتجات معاها."));
  }
  if (selected.includes("CUSTOMER")) {
    notes.push(tr("العملاء اللي مالهمش رقم موبايل مش هيتنقلوا، لأن Casho بيعرّف العميل برقمه. هتلاقي عددهم في النتيجة."));
  }
  if (selected.includes("PRODUCT")) {
    notes.push(tr("المنتجات اللي مش متتبع مخزونها في Shopify هتتنقل بمخزون 999. والصور هتفضل على سيرفرات Shopify، يعني لو قفلت متجر Shopify نهائياً لازم ترفعها تاني."));
  }

  return (
    <div className="space-y-6 pb-24">
      {/* Found in the store — big numbers, hairline grid. */}
      <section className="apple-card overflow-hidden" aria-labelledby="found-title">
        <div className="flex items-center gap-3 px-5 pt-5 pb-4">
          <ShopifyMark size="sm" />
          <div className="min-w-0">
            <h2 id="found-title" className="text-[17px] leading-[22px] font-semibold">
              {tr("لقينا في متجرك")}
            </h2>
            <p className="truncate text-[13px] text-muted-foreground">{connection.shopName}</p>
          </div>
        </div>
        <dl className="grid grid-cols-2 gap-px border-t border-border/60 bg-border/60 sm:grid-cols-3">
          {found.map((item) => (
            <div key={item.label} className="flex flex-col-reverse bg-card px-5 py-4">
              <dt className="text-[13px] text-muted-foreground">{item.label}</dt>
              <dd className="text-[28px] leading-[34px] font-bold tabular-nums ltr:tracking-[-0.015em]">{nf.format(item.value)}</dd>
            </div>
          ))}
        </dl>
      </section>

      <Group
        title={tr("هيتنقل")}
        inset={58}
        footer={tr("الاستيراد بيشتغل في الخلفية. لو عملته تاني مش هيتكرر أي حاجة: المنتجات والعملاء هيتحدّثوا، والطلبات المنقولة هتفضل زي ما هي.")}
      >
        {ENTITY_ORDER.map((entity) => {
          const meta = ENTITY_META[entity];
          const tile = ENTITY_TILE[entity];
          const id = `entity-${entity}`;
          const on = selected.includes(entity);
          return (
            <label key={entity} htmlFor={id} className="flex cursor-pointer items-center gap-3.5 px-4 py-3">
              <IconTile icon={tile.icon} tint={on ? tile.tint : "bg-(--sys-gray)"} />
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline gap-2 text-[15px] leading-5">
                  <span className="font-medium">{meta.label}</span>
                  <span className="text-[13px] tabular-nums text-muted-foreground">{nf.format(countFor[entity])}</span>
                </span>
                <span className="mt-0.5 block text-[13px] leading-[18px] text-muted-foreground">{meta.includes}</span>
              </span>
              <Switch id={id} className="apple-switch" checked={on} onCheckedChange={(v) => onToggle(entity, v)} disabled={starting} />
            </label>
          );
        })}
      </Group>

      {notes.length > 0 && (
        <Group title={tr("قبل ما تبدأ")} inset={44}>
          {notes.map((note) => (
            <p key={note} className="flex items-start gap-3 px-4 py-3 text-[13px] leading-[19px]">
              <AlertTriangle className="mt-px size-[18px] shrink-0 text-(--sys-orange)" />
              {note}
            </p>
          ))}
        </Group>
      )}

      {/* Floating glass action bar. */}
      <div className="pointer-events-none sticky bottom-4 z-20 flex justify-center">
        <div className="apple-glass pointer-events-auto flex w-full max-w-xl items-center justify-between gap-3 rounded-full py-2 ps-5 pe-2 shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
          <p className="min-w-0 truncate text-[15px]">
            {selected.length === 0 ? (
              <span className="text-muted-foreground">{tr("اختار حاجة واحدة على الأقل")}</span>
            ) : (
              tr("{0} من {1} هيتنقلوا", nf.format(selected.length), nf.format(ENTITY_ORDER.length))
            )}
          </p>
          <button type="button" onClick={onStart} disabled={starting || selected.length === 0} className={cn(appleButton.filled, "px-6")}>
            {starting && <Loader2 className="size-4 animate-spin" />}
            {tr("ابدأ الاستيراد")}
          </button>
        </div>
      </div>
    </div>
  );
}

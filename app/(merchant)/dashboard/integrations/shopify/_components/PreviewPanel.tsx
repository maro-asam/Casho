"use client";

import { AlertTriangle, Check, Loader2, Play, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import type { ImportableEntity } from "@/lib/integrations/import/types";
import type { ConnectionView } from "@/lib/integrations/import/views";
import type { ShopifyPreviewCounts } from "@/lib/integrations/shopify/source";
import { ENTITY_META, NOT_IMPORTED, nf } from "./import-meta";

const ENTITY_ORDER: ImportableEntity[] = ["COLLECTION", "PRODUCT", "CUSTOMER", "ORDER"];

export function PreviewSkeleton() {
  return (
    <section className="rounded-xl border border-border bg-card p-5" aria-busy="true" aria-label="جاري تجهيز المعاينة">
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        بنعدّ البيانات في متجرك على Shopify…
      </p>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-18 rounded-lg" />
        ))}
      </div>
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
    { label: "منتج", value: counts.products },
    { label: "نوع منتج (Variant)", value: counts.variants },
    { label: "عنصر مخزون", value: counts.variants },
    { label: "تصنيف (Collection)", value: counts.collections },
    { label: "عميل", value: counts.customers },
    { label: "طلب", value: counts.orders },
  ];
  const countFor: Record<ImportableEntity, number> = {
    COLLECTION: counts.collections,
    PRODUCT: counts.products,
    CUSTOMER: counts.customers,
    ORDER: counts.orders,
  };

  const notes: string[] = [];
  if (connection.currencyCode && connection.currencyCode !== "EGP") {
    notes.push(`عملة متجرك على Shopify ${connection.currencyCode}. الأسعار هتتنقل بنفس الأرقام من غير تحويل لعملة الجنيه — راجعها بعد الاستيراد.`);
  }
  if (!connection.hasAllOrders && selected.includes("ORDER")) {
    notes.push("Shopify بيسمح لنا بقراءة طلبات آخر 60 يوم بس. الرقم اللي فوق هو عدد الطلبات اللي هتتنقل.");
  }
  if (selected.includes("ORDER") && !selected.includes("PRODUCT")) {
    notes.push("الطلبات من غير المنتجات هتترتبط بمنتج «غير متاح» عام. الأفضل تنقل المنتجات معاها.");
  }
  if (selected.includes("CUSTOMER")) {
    notes.push("العملاء اللي مالهمش رقم موبايل مش هيتنقلوا، لأن Kasho بيعرّف العميل برقمه. هتلاقي عددهم في النتيجة.");
  }
  if (selected.includes("PRODUCT")) {
    notes.push("المنتجات اللي مش متتبع مخزونها في Shopify هتتنقل بمخزون 999. والصور هتفضل على سيرفرات Shopify، يعني لو قفلت متجر Shopify نهائياً لازم ترفعها تاني.");
  }

  return (
    <section className="space-y-5 rounded-xl border border-border bg-card p-5">
      <div>
        <h2 className="text-base font-semibold">لقينا في متجرك</h2>
        <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {found.map((item) => (
            <div key={item.label} className="rounded-lg bg-muted/50 px-3 py-2.5">
              <dd className="text-xl font-bold tabular-nums">{nf.format(item.value)}</dd>
              <dt className="mt-0.5 text-xs text-muted-foreground">{item.label}</dt>
            </div>
          ))}
        </dl>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_18rem]">
        <fieldset>
          <legend className="text-sm font-semibold">هيتنقل</legend>
          <ul className="mt-2 divide-y divide-border rounded-lg border border-border">
            {ENTITY_ORDER.map((entity) => {
              const meta = ENTITY_META[entity];
              const id = `entity-${entity}`;
              return (
                <li key={entity} className="flex items-start gap-3 px-3 py-3">
                  <Checkbox
                    id={id}
                    className="mt-0.5"
                    checked={selected.includes(entity)}
                    onCheckedChange={(v) => onToggle(entity, v === true)}
                    disabled={starting}
                  />
                  <label htmlFor={id} className="min-w-0 flex-1 cursor-pointer">
                    <span className="flex items-center justify-between gap-2 text-sm font-medium">
                      {meta.label}
                      <span className="text-xs font-normal tabular-nums text-muted-foreground">
                        {nf.format(countFor[entity])} {meta.noun}
                      </span>
                    </span>
                    <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">
                      <Check className="me-1 inline size-3 text-emerald-600" />
                      {meta.includes}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </fieldset>

        <div>
          <p className="text-sm font-semibold">مش هيتنقل حالياً</p>
          <ul className="mt-2 space-y-1.5">
            {NOT_IMPORTED.map((item) => (
              <li key={item} className="flex items-start gap-2 text-xs leading-5 text-muted-foreground">
                <X className="mt-0.5 size-3 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {notes.length > 0 && (
        <ul className="space-y-1.5 rounded-lg bg-amber-500/10 px-3 py-2.5">
          {notes.map((note) => (
            <li key={note} className="flex items-start gap-2 text-xs leading-5 text-amber-800 dark:text-amber-300">
              <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
              {note}
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-col-reverse gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-5 text-muted-foreground">
          الاستيراد بيشتغل في الخلفية. لو عملته تاني مش هيتكرر أي حاجة: المنتجات والعملاء هيتحدّثوا، والطلبات المنقولة هتفضل زي ما هي.
        </p>
        <Button onClick={onStart} disabled={starting || selected.length === 0} className="shrink-0">
          {starting ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />}
          ابدأ الاستيراد
        </Button>
      </div>
    </section>
  );
}

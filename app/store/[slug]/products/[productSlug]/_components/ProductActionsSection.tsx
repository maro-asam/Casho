"use client";

import { useState } from "react";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import ProductPurchaseActions from "./ProductPurchaseActions";
import StickyMobilePurchaseBar from "./StickyMobilePurchaseBar";

type Props = {
  storeSlug: string;
  productId: string;
  sizes: string[];
  colors: string[];
  inStock: boolean;
  stock: number;
  price: string;
  boldStyle?: boolean;
  isMinimal?: boolean;
};

export default function ProductActionsSection({
  storeSlug,
  productId,
  sizes,
  colors,
  inStock,
  stock,
  price,
  boldStyle,
  isMinimal,
}: Props) {
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);

  const hasSizes = sizes.length > 0;
  const hasColors = colors.length > 0;
  const hasVariants = hasSizes || hasColors;

  const selectedFeatures: Record<string, string> = {};
  if (selectedSize) selectedFeatures.size = selectedSize;
  if (selectedColor) selectedFeatures.color = selectedColor;

  const allFeaturesSelected =
    (!hasSizes || !!selectedSize) && (!hasColors || !!selectedColor);

  const requiresFeatureSelection = hasVariants && !allFeaturesSelected;

  const featuresForAction =
    Object.keys(selectedFeatures).length > 0 ? selectedFeatures : undefined;

  return (
    <>
      {/* ── Variant selectors ── */}
      {hasVariants && (
        <div
          className={cn(
            "space-y-4 rounded-2xl border p-4",
            isMinimal && "rounded-none border-x-0 border-b-0 pt-0",
            boldStyle && "space-y-5 border-0 p-0",
          )}
          style={!boldStyle ? { borderColor: "var(--store-border)" } : undefined}
        >
          {hasSizes && (
            <div className="space-y-2">
              <p
                className={cn(
                  "text-xs font-semibold uppercase tracking-wider text-muted-foreground",
                  boldStyle && "text-[10px] font-black tracking-[0.25em]",
                )}
              >
                المقاسات
                {!selectedSize && (
                  <span className="ms-1 font-normal normal-case text-rose-500">
                    (مطلوب)
                  </span>
                )}
              </p>
              <div className="flex flex-wrap gap-2">
                {sizes.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() =>
                      setSelectedSize(selectedSize === size ? null : size)
                    }
                    className={cn(
                      "rounded-xl border px-4 py-1.5 text-sm font-medium transition-colors",
                      isMinimal && !boldStyle && "rounded-lg",
                      boldStyle &&
                        "rounded-none border px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors",
                      selectedSize === size
                        ? "border-[color:var(--store-primary)] bg-[color:var(--store-primary)] text-[color:var(--store-primary-foreground)]"
                        : "hover:border-[color:var(--store-primary)] hover:text-[color:var(--store-primary)]",
                    )}
                    style={
                      selectedSize !== size
                        ? { borderColor: "var(--store-border)" }
                        : undefined
                    }
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {hasColors && (
            <div className="space-y-2">
              <p
                className={cn(
                  "text-xs font-semibold uppercase tracking-wider text-muted-foreground",
                  boldStyle && "text-[10px] font-black tracking-[0.25em]",
                )}
              >
                الألوان
                {!selectedColor && (
                  <span className="ms-1 font-normal normal-case text-rose-500">
                    (مطلوب)
                  </span>
                )}
              </p>
              <div className="flex flex-wrap gap-2">
                {colors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() =>
                      setSelectedColor(selectedColor === color ? null : color)
                    }
                    className={cn(
                      "rounded-xl border px-4 py-1.5 text-sm font-medium transition-colors",
                      isMinimal && !boldStyle && "rounded-lg",
                      boldStyle &&
                        "rounded-none border px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors",
                      selectedColor === color
                        ? "border-[color:var(--store-primary)] bg-[color:var(--store-primary)] text-[color:var(--store-primary-foreground)]"
                        : "hover:border-[color:var(--store-primary)] hover:text-[color:var(--store-primary)]",
                    )}
                    style={
                      selectedColor !== color
                        ? { borderColor: "var(--store-border)" }
                        : undefined
                    }
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Stock status ── */}
      {boldStyle ? (
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "size-1.5 rounded-full",
              inStock ? "bg-emerald-500" : "bg-rose-500",
            )}
          />
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
            {inStock ? "متوفر في المخزون" : "نفد المخزون"}
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          {inStock ? (
            <>
              <CheckCircle2 className="size-4 text-emerald-500" />
              <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                متوفر
                {stock <= 10 && (
                  <span className="ms-1 font-normal text-muted-foreground">
                    — {stock} قطعة متبقية
                  </span>
                )}
              </span>
            </>
          ) : (
            <>
              <AlertCircle className="size-4 text-rose-500" />
              <span className="text-sm font-medium text-rose-600 dark:text-rose-400">
                نفد المخزون
              </span>
            </>
          )}
        </div>
      )}

      {!boldStyle && (
        <Separator style={{ background: "var(--store-border)" }} />
      )}

      {/* ── Purchase actions ── */}
      <ProductPurchaseActions
        storeSlug={storeSlug}
        productId={productId}
        inStock={inStock}
        stock={stock}
        selectedFeatures={featuresForAction}
        requiresFeatureSelection={requiresFeatureSelection}
        boldStyle={boldStyle}
      />

      {/* ── Sticky mobile bar (fixed, outside normal flow) ── */}
      <StickyMobilePurchaseBar
        storeSlug={storeSlug}
        productId={productId}
        price={price}
        inStock={inStock}
        selectedFeatures={featuresForAction}
        requiresFeatureSelection={requiresFeatureSelection}
      />
    </>
  );
}

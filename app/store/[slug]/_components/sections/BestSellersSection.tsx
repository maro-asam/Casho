import Link from "next/link";
import { TrendingUp, Flame, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import ProductCard from "../shared/ProductCard";
import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import type { BestSellersContent } from "@/types/store-theme.types";

export type BestSellerProduct = {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice: number | null;
  image: string;
  isFeatured: boolean;
  salesCount: number;
  category: { name: string; slug: string; image: string | null } | null;
};

type Props = {
  products: BestSellerProduct[];
  storeSlug: string;
  content?: BestSellersContent;
};

function getBadge(rank: number, salesCount: number) {
  if (rank === 0)
    return { label: "🔥 الأكثر مبيعًا", variant: "destructive" as const };
  if (rank === 1)
    return { label: "📈 رائج الآن", variant: "default" as const };
  if (salesCount > 50)
    return { label: "⚡ مخزون محدود", variant: "secondary" as const };
  return null;
}

export default function BestSellersSection({ products, storeSlug, content }: Props) {
  const headline = content?.headline ?? "الأكثر مبيعًا";
  const maxProducts = content?.maxProducts ?? 8;
  const displayed = products.slice(0, maxProducts);

  if (!displayed.length) return null;

  return (
    <section dir="rtl">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div
            className="flex size-9 items-center justify-center rounded-xl"
            style={{ background: "var(--store-primary)", color: "var(--store-primary-foreground)" }}
          >
            <Flame className="size-5" />
          </div>
          <div>
            <h2
              className="text-xl font-bold tracking-tight sm:text-2xl"
              style={{ color: "var(--store-foreground)" }}
            >
              {headline}
            </h2>
            <p className="text-xs" style={{ color: "var(--store-muted-foreground)" }}>
              بناءً على مبيعات العملاء الفعلية
            </p>
          </div>
        </div>
        <Link
          href={buildStoreUrl(storeSlug, "/products")}
          className="flex shrink-0 items-center gap-1 text-sm font-medium transition-colors hover:underline"
          style={{ color: "var(--store-primary)" }}
        >
          عرض الكل
          <TrendingUp className="size-4" />
        </Link>
      </div>

      {/* Products grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {displayed.map((product, rank) => {
          const badge = getBadge(rank, product.salesCount);
          return (
            <div key={product.id} className="relative">
              {badge && (
                <div className="absolute right-2 top-2 z-10">
                  <Badge variant={badge.variant} className="text-[10px] font-bold shadow-md">
                    {badge.label}
                  </Badge>
                </div>
              )}
              <ProductCard product={product} storeSlug={storeSlug} />
            </div>
          );
        })}
      </div>

      {/* Scarcity hint */}
      {displayed.some((p) => p.salesCount > 30) && (
        <div
          className="mt-4 flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm"
          style={{
            background: "color-mix(in srgb, var(--store-primary) 8%, transparent)",
            borderColor: "color-mix(in srgb, var(--store-primary) 20%, transparent)",
            color: "var(--store-foreground)",
          }}
        >
          <AlertCircle className="size-4 shrink-0" style={{ color: "var(--store-primary)" }} />
          <span>
            هذه المنتجات <strong>تنفد بسرعة</strong> — اطلب الآن قبل نفاد المخزون
          </span>
        </div>
      )}
    </section>
  );
}

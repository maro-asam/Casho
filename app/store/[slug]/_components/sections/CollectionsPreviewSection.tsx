import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import type { CollectionsContent } from "@/types/store-theme.types";

type Props = {
  storeSlug: string;
  content?: CollectionsContent;
  /** Fallback: store categories if no custom collections */
  categories?: Array<{ name: string; slug: string; image?: string | null }>;
};

export default function CollectionsPreviewSection({
  storeSlug,
  content,
  categories = [],
}: Props) {
  const headline = content?.headline ?? "تسوق حسب المجموعة";

  // Use custom collections OR fall back to store categories
  const items =
    content?.items?.length
      ? content.items.map((c) => ({
          name: c.name,
          image: c.image,
          link: c.link ?? buildStoreUrl(storeSlug, "/products"),
        }))
      : categories.slice(0, 6).map((cat) => ({
          name: cat.name,
          image: cat.image ?? undefined,
          link: buildStoreUrl(storeSlug, `/categories/${cat.slug}`),
        }));

  if (!items.length) return null;

  return (
    <section dir="rtl">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <h2
          className="text-xl font-bold tracking-tight sm:text-2xl"
          style={{ color: "var(--store-foreground)" }}
        >
          {headline}
        </h2>
        <Link
          href={buildStoreUrl(storeSlug, "/categories")}
          className="flex shrink-0 items-center gap-1 text-sm font-medium transition-colors hover:underline"
          style={{ color: "var(--store-primary)" }}
        >
          كل المجموعات
          <ArrowLeft className="size-4" />
        </Link>
      </div>

      {/* Grid — first item is featured (wider) */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {items.map((item, i) => (
          <Link
            key={i}
            href={item.link}
            className={`group relative overflow-hidden rounded-2xl ${
              i === 0 ? "col-span-2 row-span-2 sm:col-span-2" : ""
            }`}
            style={{ aspectRatio: i === 0 ? "1/1" : "1/1" }}
          >
            {/* Background */}
            {item.image ? (
              <Image
                src={item.image}
                alt={item.name}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes={i === 0 ? "40vw" : "20vw"}
              />
            ) : (
              <div
                className="absolute inset-0 transition-opacity group-hover:opacity-90"
                style={{
                  background:
                    "linear-gradient(135deg, var(--store-primary), color-mix(in srgb, var(--store-primary) 60%, #000))",
                }}
              />
            )}

            {/* Overlay */}
            <div
              className="absolute inset-0 transition-opacity group-hover:opacity-80"
              style={{
                background:
                  "linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.1) 60%, transparent 100%)",
              }}
            />

            {/* Label */}
            <div className="absolute inset-x-0 bottom-0 p-4">
              <span
                className={`font-bold text-white ${i === 0 ? "text-xl" : "text-sm"}`}
              >
                {item.name}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

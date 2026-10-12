import Image from "next/image";
import Link from "next/link";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { cn } from "@/lib/utils";
import type { BannerData, CategoryLink, HomeViewProps, ProductCardData } from "../../types";
import { Chevron, PlateImage, Price, btn, discountPercent, num } from "../ui";

type Tile =
  | { kind: "banner"; key: string; banner: BannerData }
  | { kind: "product"; key: string; product: ProductCardData }
  | { kind: "category"; key: string; category: CategoryLink };

type Slot = "a" | "b" | "c" | "d" | "e";

const hasPhoto = (src: string | null | undefined) => !!src && !src.includes("placeholder");

/** Fill the five bento slots from real store content, never repeating one:
 *  banners lead, discounted products take the tall slot (with a real "save"
 *  seal), categories with photos fill the rest. */
function buildTiles({ banners, categories, featured, latest, bestSellers }: Pick<HomeViewProps, "banners" | "categories" | "featured" | "latest" | "bestSellers">) {
  const seen = new Set<string>();
  const products = [...featured, ...bestSellers, ...latest].filter((p) => {
    if (seen.has(p.id) || !hasPhoto(p.image) || p.stock <= 0) return false;
    seen.add(p.id);
    return true;
  });
  const discounted = products.filter((p) => discountPercent(p.price, p.compareAtPrice) > 0).sort((a, b) => discountPercent(b.price, b.compareAtPrice) - discountPercent(a.price, a.compareAtPrice));
  const cats = categories.filter((c) => hasPhoto(c.image) && c.productCount > 0);

  const used = new Set<string>();
  const banner = (b?: BannerData): Tile | null => (b && !used.has(b.id) ? (used.add(b.id), { kind: "banner", key: b.id, banner: b }) : null);
  const product = (list: ProductCardData[]): Tile | null => {
    const p = list.find((x) => !used.has(x.id));
    return p ? (used.add(p.id), { kind: "product", key: p.id, product: p }) : null;
  };
  const category = (): Tile | null => {
    const c = cats.find((x) => !used.has(x.id));
    return c ? (used.add(c.id), { kind: "category", key: c.id, category: c }) : null;
  };

  const tiles: Partial<Record<Slot, Tile>> = {};
  tiles.a = banner(banners[0]) ?? product(discounted) ?? product(products) ?? undefined;
  tiles.c = banner(banners[1]) ?? product(discounted) ?? product(products) ?? category() ?? undefined;
  tiles.b = category() ?? banner(banners[2]) ?? product(products) ?? undefined;
  tiles.d = category() ?? product(products) ?? undefined;
  tiles.e = banner(banners[3]) ?? product(discounted) ?? product(products) ?? category() ?? undefined;
  return tiles;
}

const SIZES: Record<Slot, string> = {
  a: "(max-width: 1024px) 100vw, 66vw",
  b: "(max-width: 1024px) 50vw, 25vw",
  c: "(max-width: 1024px) 50vw, 25vw",
  d: "(max-width: 1024px) 50vw, 25vw",
  e: "(max-width: 1024px) 50vw, 45vw",
};

/** The whole tile is one link; its visible "Shop now" is decoration. */
function TileLink({ href, label }: { href: string; label: string }) {
  return <Link href={href} aria-label={label} className="absolute inset-0 z-[3] rounded-(--mx-r-lg) focus-visible:outline-offset-[-3px]" />;
}

function Cta() {
  return (
    <span aria-hidden className="mt-3 inline-flex items-center gap-1 border-b border-white/80 pb-0.5 text-sm font-semibold">
      تسوّق الآن
      <Chevron />
    </span>
  );
}

function TileView({ tile, slot, storeSlug, storeName }: { tile: Tile; slot: Slot; storeSlug: string; storeName: string }) {
  const url = (p: string) => buildStoreUrl(storeSlug, p);
  const big = slot === "a";
  const sizes = SIZES[slot];

  if (tile.kind === "banner") {
    return (
      <div className="group relative flex h-full overflow-hidden rounded-(--mx-r-lg) bg-(--mx-dark) text-white">
        <TileLink href={url("/products")} label={tile.banner.title} />
        <Image src={tile.banner.image} alt="" fill priority={big} sizes={sizes} className="mx-zoom-img object-cover" />
        <span aria-hidden className="absolute inset-0 bg-[linear-gradient(to_top,rgb(16_15_15/0.72),rgb(16_15_15/0.1)_65%)] lg:bg-[linear-gradient(var(--mx-hero-dir,to_left),rgb(16_15_15/0.7),rgb(16_15_15/0)_70%)] ltr:[--mx-hero-dir:to_right]" />
        <div className={cn("relative mt-auto flex w-full flex-col items-start p-5 sm:p-8", big && "lg:my-auto lg:max-w-[60%] lg:p-10")}>
          {big && <p className="mb-2 rounded-sm bg-(--mx-sale-badge) px-1.5 text-[0.8125rem] font-semibold">{storeName}</p>}
          <h2 className={cn("mx-display text-balance text-white", big ? "mx-hero" : "text-xl sm:text-2xl")}>{tile.banner.title}</h2>
          {big ? (
            <span aria-hidden className={btn({ variant: "white", size: "lg", className: "mt-6" })}>
              تسوّق الآن
            </span>
          ) : (
            <Cta />
          )}
        </div>
      </div>
    );
  }

  if (tile.kind === "category") {
    const c = tile.category;
    return (
      <div className="group relative flex h-full overflow-hidden rounded-(--mx-r-lg) bg-(--mx-tint)">
        <TileLink href={url(`/categories/${c.slug}`)} label={`تسوّق ${c.name}`} />
        <Image src={c.image!} alt="" fill sizes={sizes} className="mx-zoom-img object-cover" />
        <span aria-hidden className="absolute inset-0 bg-[linear-gradient(to_top,rgb(16_15_15/0.66),rgb(16_15_15/0)_60%)]" />
        <div className="relative mt-auto p-5 text-white sm:p-7">
          <p className="text-[0.8125rem] font-semibold opacity-90">{num(c.productCount)} منتج</p>
          <h2 className="mx-display mt-0.5 text-xl text-white sm:text-2xl">{c.name}</h2>
          <Cta />
        </div>
      </div>
    );
  }

  const p = tile.product;
  const off = discountPercent(p.price, p.compareAtPrice);
  return (
    <div className="group relative flex h-full overflow-hidden rounded-(--mx-r-lg) bg-(--mx-plate)">
      <TileLink href={url(`/products/${p.slug}`)} label={p.name} />
      <div className={cn("absolute inset-0", big ? "start-[38%]" : "top-[38%]")}>
        <PlateImage src={p.image} priority={big} sizes={sizes} className="mx-zoom-img" />
      </div>
      {off > 0 &&
        (big ? (
          <span className="mx-seal mx-seal--tab absolute end-6 top-0 z-[2]">
            <span className="text-sm">وفّر</span>
            <span className="text-2xl">{num(off)}٪</span>
          </span>
        ) : (
          <span className="mx-seal mx-seal--circle absolute end-3 top-3 z-[2] size-20 sm:size-22">
            <span className="text-xs">وفّر</span>
            <span className="text-xl">{num(off)}٪</span>
          </span>
        ))}
      <div className={cn("relative flex flex-col items-start p-5 sm:p-7", big && "my-auto max-w-[55%] lg:p-10")}>
        {(p.brand || p.categoryName) && <p className="text-[0.8125rem] font-semibold">{p.brand || p.categoryName}</p>}
        <h2 className={cn("mx-display mt-0.5 line-clamp-2 text-balance", big ? "mx-hero" : "text-lg sm:text-xl")}>{p.name}</h2>
        <Price price={p.price} compareAt={p.compareAtPrice} chip={false} size={big ? "lg" : "md"} className="mt-2" />
        <span aria-hidden className="mx-link mt-3">
          تسوّق الآن
        </span>
      </div>
    </div>
  );
}

/** Maximize's hero "promotion grid": a large lead tile with a column of
 *  smaller tiles beside it and two more beneath — filled from the store's
 *  banners, best deals and categories. */
export default function PromotionGrid(props: HomeViewProps) {
  const tiles = buildTiles(props);
  if (!tiles.a) return null;
  const right = !!(tiles.b || tiles.c);
  const bottom = !!(tiles.d || tiles.e);
  const view = (slot: Slot) => tiles[slot] && <TileView tile={tiles[slot]!} slot={slot} storeSlug={props.store.slug} storeName={props.store.name} />;

  return (
    <section aria-label="العروض" className="mx-wrap mx-section">
      <div
        className={cn(
          "grid grid-cols-2 gap-(--mx-gap)",
          right && "lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_minmax(0,1.1fr)]",
          right && (bottom ? "lg:grid-rows-[15rem_15rem_14rem] xl:grid-rows-[16.5rem_16.5rem_15rem]" : "lg:grid-rows-[15rem_15rem] xl:grid-rows-[16.5rem_16.5rem]"),
        )}
      >
        <div className={cn("col-span-2 h-[26rem] sm:h-[30rem]", right ? "lg:col-start-1 lg:col-end-3 lg:row-start-1 lg:row-end-3 lg:h-auto" : "lg:h-[32rem]")}>{view("a")}</div>
        {tiles.b && <div className={cn("h-56 sm:h-64 lg:col-start-3 lg:row-start-1 lg:h-auto", !tiles.c && "col-span-2 lg:col-span-1 lg:row-end-3")}>{view("b")}</div>}
        {tiles.c && <div className={cn("h-56 sm:h-64 lg:col-start-3 lg:h-auto", tiles.b ? (bottom ? "lg:row-start-2 lg:row-end-4" : "lg:row-start-2") : "col-span-2 lg:col-span-1 lg:row-start-1 lg:row-end-3", !tiles.b && "lg:row-end-3")}>{view("c")}</div>}
        {tiles.d && <div className={cn("h-48 sm:h-56 lg:col-start-1 lg:row-start-3 lg:h-auto", !tiles.e && "col-span-2 lg:col-span-2 lg:col-end-3")}>{view("d")}</div>}
        {tiles.e && <div className={cn("h-48 sm:h-56 lg:row-start-3 lg:h-auto", tiles.d ? "lg:col-start-2" : "col-span-2 lg:col-span-2 lg:col-start-1 lg:col-end-3")}>{view("e")}</div>}
      </div>
    </section>
  );
}

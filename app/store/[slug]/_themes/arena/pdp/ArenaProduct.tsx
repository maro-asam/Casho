import Image from "next/image";
import { ShieldCheck, Star } from "lucide-react";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import type { ProductViewProps } from "../../types";
import AccountNote from "../game/AccountNote";
import PackagePicker from "../game/PackagePicker";
import { sameGame, sortPackages, type Pkg } from "../lib/arena";
import { BackLink, GameIcon, Panel, Wrap, num } from "../ui";
import { formatStoreDate, st } from "@/lib/i18n/storefront";

/** A package's own page: the same picker as its game's page, on this package,
 *  with the game's other packages beside it. */
export default function ArenaProduct({ store, product, related, reviews }: ProductViewProps) {
  const art = product.gallery[0] ?? null;
  const self: Pkg = {
    id: product.id,
    name: product.name,
    slug: product.slug,
    price: product.price,
    compareAtPrice: product.compareAtPrice,
    stock: product.stock,
    isFeatured: product.isFeatured,
    image: art ?? "",
    sizes: product.sizes,
    colors: product.colors,
    hasOptions: product.sizes.length > 0 || product.colors.length > 0,
  };
  const packages = sortPackages([self, ...sameGame(related, product.category.name, product.id)]);
  const rating = reviews.length ? reviews.reduce((t, r) => t + r.rating, 0) / reviews.length : 0;

  return (
    <Wrap narrow className="an-page an-page--game">
      <BackLink href={buildStoreUrl(store.slug, `/categories/${product.category.slug}`)}>{st("رجوع لـ {0}", product.category.name)}</BackLink>

      <Panel className="an-gamehead an-rise">
        {art && (
          <span aria-hidden className="an-gamehead-glow">
            <Image src={art} alt="" fill sizes="320px" className="object-cover" />
          </span>
        )}
        <GameIcon src={art} size="md" priority />
        <div className="relative min-w-0">
          <p className="an-sub">{product.category.name}</p>
          <h1 className="an-h1 !text-[1.375rem] md:!text-[1.625rem]">{product.name}</h1>
          <p className="an-okline mt-1.5">
            <ShieldCheck aria-hidden className="size-3.5 shrink-0" />
            <AccountNote />
          </p>
        </div>
      </Panel>

      <div className="mt-7">
        <PackagePicker storeSlug={store.slug} game={product.category.name} packages={packages} initialId={product.id} />
      </div>

      {product.description?.trim() && (
        <Panel as="section" className="mt-10 p-5">
          <h2 className="an-h3">{st("تفاصيل الباقة")}</h2>
          <p className="an-sub mt-2 whitespace-pre-line !text-[0.875rem] !leading-7">{product.description}</p>
        </Panel>
      )}

      {reviews.length > 0 && (
        <section className="mt-10">
          <h2 className="an-h2">
            {st("آراء العملاء")} <span className="an-sub">· {num(Math.round(rating * 10) / 10)} ★</span>
          </h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {reviews.slice(0, 6).map((r) => (
              <Panel as="li" key={r.id} className="p-4">
                <p className="flex items-center gap-0.5 text-(--an-gold)" aria-label={st("{0} من ٥", num(r.rating))}>
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star key={i} aria-hidden className="size-3.5" fill={i < r.rating ? "currentColor" : "none"} />
                  ))}
                </p>
                {r.title && <p className="mt-2 text-sm font-bold">{r.title}</p>}
                <p className="an-sub mt-1 !text-[0.8125rem] !leading-6">{r.content}</p>
                <p className="mt-2 text-[0.6875rem] text-(--an-ink-3)">
                  {r.customerName} · {formatStoreDate(r.reviewDate)}
                </p>
              </Panel>
            ))}
          </ul>
        </section>
      )}

    </Wrap>
  );
}

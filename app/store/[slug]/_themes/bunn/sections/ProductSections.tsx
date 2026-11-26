import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import type { ProductCardData } from "../../types";
import { coffeeLine, needsGrind } from "../lib/coffee";
import ProductCard, { CardTag, cardProfile, gramsLabel } from "../product/ProductCard";
import QuickAdd from "../product/QuickAdd";
import Rail from "../product/Rail";
import { Band, Kicker, Notes, PlateImage, Price, RoastMeter, SectionHead, TextLink, Wrap, delay, num, num2 } from "../ui";
import { st } from "@/lib/i18n/storefront";

/** The roaster's pick: the lead featured coffee large on its plate with its
 *  label beside it — origin, notes, roast, and the details the merchant gave —
 *  then the next four as cards. Phones get them stacked. */
export function RoasterPick({ products, storeSlug, href }: { products: ProductCardData[]; storeSlug: string; href: string }) {
  const [lead, ...rest] = products;
  const four = rest.slice(0, 4);
  const leadHref = buildStoreUrl(storeSlug, `/products/${lead.slug}`);
  const p = cardProfile(lead);
  const beans = needsGrind({ name: lead.name, categoryName: lead.categoryName, attributes: lead.attributes, sizes: lead.sizes, colors: lead.colors }, true, p);
  const facts = [
    p.region && { k: st("المنطقة"), v: p.region },
    p.process && { k: st("المعالجة"), v: p.process },
    p.altitude && { k: st("الارتفاع"), v: p.altitude },
    p.variety && { k: st("السلالة"), v: p.variety },
  ].filter(Boolean) as { k: string; v: string }[];

  return (
    <Band tone="alt" className="bn-section">
      <Wrap>
        <SectionHead kicker={st("اختيار المحمصة")} title={st("قهوة الموسم")} note={st("اللي بننصح بيه دلوقتي.")} href={href} />
        <article className="bn-pick bn-reveal group">
          <div className="bn-plate bn-pick-media">
            <PlateImage src={lead.image} sizes="(max-width: 1024px) 100vw, 46vw" className="bn-card-img has-swap" priority />
            {lead.hoverImage && <Image src={lead.hoverImage} alt="" fill sizes="(max-width: 1024px) 100vw, 46vw" loading="lazy" className="bn-card-img2 object-cover" />}
            <CardTag product={lead} className="bn-card-tag" />
          </div>
          <div className="bn-pick-label">
            <Kicker>{(p.isCoffee && coffeeLine(p)) || lead.brand || lead.categoryName || st("اختيارنا")}</Kicker>
            <h3 className="bn-h1 mt-3 text-balance">
              <Link href={leadHref} className="bn-cover-link">
                {lead.name}
              </Link>
            </h3>
            {p.notes.length > 0 && <Notes notes={p.notes} max={5} chips className="mt-5" />}
            {facts.length > 0 && (
              <dl className="bn-pick-facts">
                {facts.map((f) => (
                  <div key={f.k}>
                    <dt>{f.k}</dt>
                    <dd>{f.v}</dd>
                  </div>
                ))}
              </dl>
            )}
            <div className="bn-pick-foot">
              <div>
                <Price price={lead.price} compareAt={lead.compareAtPrice} size="lg" save />
                {p.isCoffee && p.grams && <p className="mt-1 text-xs text-(--bn-ink-2)">{st("الكيس {0}", gramsLabel(p.grams))}</p>}
              </div>
              {p.roast && <RoastMeter level={p.roast.level} size="md" label />}
            </div>
            <div className="relative z-[2] mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
              <QuickAdd storeSlug={storeSlug} product={lead} beans={beans} className="bn-quick--inline" />
              <TextLink href={leadHref}>{st("بطاقة المحصول")}</TextLink>
            </div>
          </div>
        </article>
        {four.length > 0 && (
          <ul className="bn-pgrid bn-pick-more" data-n={four.length}>
            {four.map((x, i) => (
              <li key={x.id} className="min-w-0">
                <ProductCard product={x} storeSlug={storeSlug} index={i + 1} sizes="(max-width: 768px) 50vw, 22vw" />
              </li>
            ))}
          </ul>
        )}
      </Wrap>
    </Band>
  );
}

/** A shelf of regular cards. */
export function ShelfRow({ products, storeSlug, title, kicker, href, tone = "page" }: { products: ProductCardData[]; storeSlug: string; title: string; kicker?: string; href?: string; tone?: "page" | "alt" }) {
  return (
    <Band tone={tone} className="bn-section">
      <Rail label={title} title={title} kicker={kicker} href={href} listClassName="bn-shelf--cards">
        {products.map((p, i) => (
          <li key={p.id} className="min-w-0">
            <ProductCard product={p} storeSlug={storeSlug} index={i} sizes="(max-width: 768px) 62vw, 18rem" />
          </li>
        ))}
      </Rail>
    </Band>
  );
}

/** Best sellers as a shelf, each with its rank stamped on the corner — the
 *  order comes from real sales. */
export function BestSellers({ products, storeSlug, title, max = 8, href }: { products: ProductCardData[]; storeSlug: string; title: string; max?: number; href: string }) {
  const list = products.slice(0, max);
  return (
    <Band className="bn-section">
      <Rail label={title} title={title} kicker={st("الأكثر طلبًا")} href={href} listClassName="bn-shelf--cards">
        {list.map((p, i) => (
          <li key={p.id} className="bn-ranked min-w-0">
            <span aria-hidden className="bn-rank">
              {num2(i + 1)}
            </span>
            <span className="sr-only">{st("رقم {0}", num(i + 1))}</span>
            <ProductCard product={p} storeSlug={storeSlug} index={i} sizes="(max-width: 768px) 62vw, 18rem" />
          </li>
        ))}
      </Rail>
    </Band>
  );
}

/** Limited-time coffees on espresso: the merchant's own timer, real
 *  discounts and, when nearly gone, the real count left. */
export function DealsBand({ products, storeSlug, title, lowStock, timer }: { products: ProductCardData[]; storeSlug: string; title: string; lowStock?: boolean; timer?: ReactNode }) {
  const list = products.slice(0, 10);
  const cards = list.map((p, i) => (
    <li key={p.id} className="min-w-0">
      <ProductCard product={p} storeSlug={storeSlug} index={i} sizes="(max-width: 768px) 62vw, 18rem" />
      {lowStock && p.stock > 0 && p.stock <= 5 && <p className="mt-2 text-center text-xs text-(--bn-crema)">{st("باقي {0} بس", num(p.stock))}</p>}
    </li>
  ));
  // A few deals sit beside the head; more run on a shelf under it.
  if (list.length <= 3)
    return (
      <Band tone="espresso" aria-label={title} className="bn-section bn-deals">
        <Wrap className="bn-deals-few">
          <div className="min-w-0">
            <Kicker className="bn-reveal">{st("لفترة محدودة")}</Kicker>
            <h2 className="bn-display-lg bn-reveal mt-3 max-w-[16ch] text-balance" style={delay(1)}>
              {title}
            </h2>
            {timer && (
              <div className="bn-reveal mt-8" style={delay(2)}>
                {timer}
              </div>
            )}
          </div>
          <ul className="bn-deals-grid" data-n={list.length}>
            {cards}
          </ul>
        </Wrap>
      </Band>
    );
  return (
    <Band tone="espresso" aria-label={title} className="bn-section bn-deals">
      <Wrap className="bn-deals-head">
        <div>
          <Kicker className="bn-reveal">{st("لفترة محدودة")}</Kicker>
          <h2 className="bn-display-lg bn-reveal mt-3 max-w-[18ch] text-balance" style={delay(1)}>
            {title}
          </h2>
        </div>
        {timer && (
          <div className="bn-reveal" style={delay(2)}>
            {timer}
          </div>
        )}
      </Wrap>
      <Rail label={title} className="mt-10" listClassName="bn-shelf--cards">
        {cards}
      </Rail>
    </Band>
  );
}

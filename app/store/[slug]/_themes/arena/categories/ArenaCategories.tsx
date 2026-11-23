import Link from "next/link";
import { Gamepad2, MessageCircle } from "lucide-react";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import type { CategoriesIndexViewProps, CategoryViewProps } from "../../types";
import PackagePicker from "../game/PackagePicker";
import { GameGrid, GameHead, gamesAvailable } from "../sections/Games";
import { sortPackages } from "../lib/arena";
import { BackLink, Empty, PageHead, SectionHead, Wrap, btn } from "../ui";
import { st } from "@/lib/i18n/storefront";

export function ArenaCategoriesIndex({ store, categories }: CategoriesIndexViewProps) {
  return (
    <Wrap className="an-page">
      <PageHead title={st("اختار لعبتك أو تطبيقك")} note={categories.length > 0 ? gamesAvailable(categories) : undefined} />
      {categories.length === 0 ? (
        <Empty
          icon={<Gamepad2 />}
          title={st("الألعاب جاية قريب")}
          description={st("المتجر بيجهز باقاته دلوقتي. ارجع تاني قريب.")}
          action={
            <Link href={buildStoreUrl(store.slug, "/contact")} className={btn({ variant: "glass" })}>
              {st("تواصل مع المتجر")}
            </Link>
          }
        />
      ) : (
        <GameGrid games={categories} storeSlug={store.slug} />
      )}
    </Wrap>
  );
}

/** A game's page: its header card, then the package picker (the reference's flow). */
export function ArenaCategory({ store, category, products, otherCategories }: CategoryViewProps) {
  const packages = sortPackages(products);
  return (
    <Wrap narrow className="an-page an-page--game">
      <BackLink href={buildStoreUrl(store.slug, "/categories")}>{st("رجوع للألعاب")}</BackLink>
      <GameHead name={category.name} image={category.image} count={packages.length} from={packages[0]?.price ?? null} />

      <div className="mt-7">
        {packages.length > 0 ? (
          <PackagePicker storeSlug={store.slug} game={category.name} packages={packages} />
        ) : (
          <Empty
            icon={<Gamepad2 />}
            title={st("الباقات جاية قريب")}
            description={st("لسه مفيش باقات للعبة دي. كلّم المتجر يقولك المتاح والأسعار.")}
            action={
              <Link href={buildStoreUrl(store.slug, "/contact")} className={btn({ variant: "glass" })}>
                <MessageCircle aria-hidden className="size-4" />
                {st("اسأل المتجر")}
              </Link>
            }
          />
        )}
      </div>

      {otherCategories.length > 0 && (
        <section className="mt-14">
          <SectionHead title={st("ألعاب تانية")} href={buildStoreUrl(store.slug, "/categories")} />
          <GameGrid games={otherCategories} storeSlug={store.slug} />
        </section>
      )}
    </Wrap>
  );
}

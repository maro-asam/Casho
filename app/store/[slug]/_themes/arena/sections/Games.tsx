import Image from "next/image";
import { ShieldCheck } from "lucide-react";

import { cn } from "@/lib/utils";
import type { CategoryLink } from "../../types";
import AccountNote from "../game/AccountNote";
import { orderGames } from "../lib/arena";
import { GameCard, GameIcon, Panel, gamesCount, packagesCount } from "../ui";
import { formatPrice, st } from "@/lib/i18n/storefront";

/** The games grid ("اختار لعبتك أو تطبيقك"). Games still without packages
 *  come last with a "قريبًا" badge; the Studio's category shape restyles it. */
export function GameGrid({
  games,
  storeSlug,
  hot,
  shape = "square",
  className,
}: {
  games: CategoryLink[];
  storeSlug: string;
  /** Games that hold a featured package — badged "الأكثر طلبًا". */
  hot?: Set<string>;
  shape?: "square" | "circle" | "pill";
  className?: string;
}) {
  return (
    <ul className={cn("an-games", className)} data-shape={shape}>
      {orderGames(games).map((g, i) => (
        <li key={g.id} className="contents">
          <GameCard game={g} storeSlug={storeSlug} index={i} badge={hot?.has(g.id) ? st("الأكثر طلبًا") : null} />
        </li>
      ))}
    </ul>
  );
}

/** "٦ أقسام متاحة دلوقتي" — games that have packages. */
export function gamesAvailable(games: CategoryLink[]) {
  return st("{0} متاحة دلوقتي", gamesCount(games.filter((g) => g.productCount > 0).length));
}

/** The game's header card on its page: art, name, how many packages from what price. */
export function GameHead({ name, image, count, from, note }: { name: string; image: string | null; count: number; from: number | null; note?: string }) {
  return (
    <Panel className="an-gamehead an-rise">
      {image && (
        <span aria-hidden className="an-gamehead-glow">
          <Image src={image} alt="" fill sizes="320px" className="object-cover" />
        </span>
      )}
      <GameIcon src={image} size="md" priority />
      <div className="relative min-w-0">
        <h1 className="an-h1 !text-[1.375rem] md:!text-[1.625rem]">{name}</h1>
        <p className="an-sub mt-0.5">
          {count > 0 ? packagesCount(count) : st("الباقات جاية قريب")}
          {count > 0 && from != null && <> · {st("يبدأ من {0}", formatPrice(from))}</>}
        </p>
        <p className="an-okline mt-1.5">
          <ShieldCheck aria-hidden className="size-3.5 shrink-0" />
          {note ?? <AccountNote />}
        </p>
      </div>
    </Panel>
  );
}

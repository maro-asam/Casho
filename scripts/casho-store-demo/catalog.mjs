// Catalog of the "Casho Store" example (casho-games.casho.store): a game and
// app top-up shop on the Casho Arena theme, priced in Sudanese pounds.
//
// The packages and prices are exactly the four lists the user sent on
// 2026-11-23 (Free Fire diamonds, PUBG UC, eFootball coins, TikTok coins).
// FC Mobile and Yalla Ludo came with art but no prices, so they are games
// with no packages yet ("قريبًا"). Product.price is whole units of the store
// currency (SDG), like EGP elsewhere.

export const SLUG = "casho-games";
export const STORE_NAME = "Casho Store";
export const CURRENCY = "SDG";

/** Source posters (the user's WhatsApp images), by game. */
export const ART = {
  freefire: "WhatsApp Image 2026-11-23 at 5.45.27 PM.jpeg",
  pubg: "WhatsApp Image 2026-11-23 at 5.45.27 PM (1).jpeg",
  efootball: "WhatsApp Image 2026-11-23 at 5.45.27 PM (2).jpeg",
  fcmobile: "WhatsApp Image 2026-11-23 at 5.45.28 PM.jpeg",
  tiktok: "WhatsApp Image 2026-11-23 at 5.45.28 PM (1).jpeg",
  yallaludo: "WhatsApp Image 2026-11-23 at 5.45.28 PM (2).jpeg",
};

/** Games (categories), in the order they show. */
export const GAMES = [
  { key: "freefire", name: "فري فاير", unit: "جوهرة" },
  { key: "pubg", name: "ببجي موبايل", unit: "شدة" },
  { key: "efootball", name: "إي فوتبول", unit: "كوينز" },
  { key: "tiktok", name: "تيك توك", unit: "عملة" },
  { key: "fcmobile", name: "إف سي موبايل", unit: null },
  { key: "yallaludo", name: "يلا لودو", unit: null },
];

/** [amount, price in SDG] — exactly as sent. */
const LISTS = {
  freefire: [
    [110, 12_700],
    [210, 24_500],
    [310, 36_000],
    [520, 60_000],
    [1_060, 122_000],
    [2_180, 250_000],
    [5_600, 640_000],
  ],
  pubg: [
    [60, 10_000],
    [120, 20_000],
    [180, 30_000],
    [325, 55_000],
    [385, 65_000],
    [660, 110_000],
    [720, 120_000],
    [1_800, 300_000],
    [3_850, 620_000],
    [8_100, 1_250_000],
  ],
  efootball: [
    [100, 14_000],
    [550, 77_000],
    [1_040, 146_000],
    [2_150, 301_000],
    [5_500, 770_000],
    [12_800, 1_792_000],
  ],
  tiktok: [
    [30, 8_000],
    [70, 19_000],
    [350, 93_000],
    [700, 187_000],
    [1_400, 373_000],
    [3_500, 933_000],
    [7_000, 1_867_000],
    [17_500, 4_667_000],
  ],
};

/** "الأكثر مبيعًا" on one package of the two biggest games (a merchant's own pick
 *  in a real store); their cards then wear "الأكثر طلبًا" on the home page. */
const FEATURED = { freefire: 520, pubg: 660 };

const fmt = new Intl.NumberFormat("en-US");

export const PACKAGES = Object.entries(LISTS).flatMap(([game, rows]) => {
  const unit = GAMES.find((g) => g.key === game).unit;
  return rows.map(([amount, price]) => ({
    game,
    slug: `${game}-${amount}`,
    // "1,060 جوهرة" — the number as sent, then the unit.
    name: `${fmt.format(amount)} ${unit}`,
    price,
    featured: FEATURED[game] === amount,
  }));
});

export const HERO = {
  title: "اشحن لعبتك بنفسك، بدون وسطاء وبدون انتظار",
  subtitle: "اختار الباقة، اكتب معرّف اللاعب، وابعت الطلب. Casho Store بيتابع طلبك لحد ما الشحن يوصل لحسابك.",
  cta: "تسوّق الباقات",
};

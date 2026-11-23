// Catalog of the "levelup" showcase store (ليفل أب): game top-ups, gift cards and
// subscriptions, the way Egyptian top-up shops sell them. Packages are the games'
// real ones (Free Fire 100+10…, PUBG 300+25…); prices are EGP retail as Egyptian
// sellers listed them in Oct–Nov 2026 (Product.price is pounds, not piasters).
//
// `art` drives the generated product image (scripts/levelup-demo/art.mjs):
//   { kind: "gem" | "coin" | "pass" | "card", tier: 1–6, ... }
// Images are drawn in code (no game logos or official artwork).

export const SLUG = "levelup";

/** Palette per shelf: glow, main, deep, background. */
export const PALETTES = {
  "free-fire": { glow: "#ffb547", main: "#ff7a1a", deep: "#c2310a", bg: "#1d0b04" },
  pubg: { glow: "#ffe27a", main: "#f5b400", deep: "#a86800", bg: "#171106" },
  cod: { glow: "#e4ec9a", main: "#a9b84a", deep: "#4f5a1c", bg: "#10130a" },
  "yalla-ludo": { glow: "#ff9be8", main: "#e64bd2", deep: "#6d22d6", bg: "#170a24" },
  roblox: { glow: "#ff8a80", main: "#e8342a", deep: "#7d0f0b", bg: "#150909" },
  fortnite: { glow: "#9fd3ff", main: "#5a8cff", deep: "#7a2ff0", bg: "#0c0a24" },
  valorant: { glow: "#ff9aa1", main: "#ff4655", deep: "#8f1d2a", bg: "#170709" },
  playstation: { glow: "#7cc4ff", main: "#1f6fe0", deep: "#0a2f8a", bg: "#050c1f" },
  xbox: { glow: "#8ff08f", main: "#1f9a1f", deep: "#0b4d0b", bg: "#051205" },
  steam: { glow: "#9fd8ff", main: "#2a6a96", deep: "#14233a", bg: "#070c14" },
  "apple-google": { glow: "#ffb3e6", main: "#a34dff", deep: "#2b4bff", bg: "#0d0820" },
};

export const CATEGORIES = [
  { key: "free-fire", name: "فري فاير", label: "FREE FIRE", unit: "gem" },
  { key: "pubg", name: "ببجي موبايل", label: "PUBG MOBILE", unit: "UC" },
  { key: "playstation", name: "بلايستيشن", label: "PLAYSTATION", unit: "card" },
  { key: "cod", name: "كول أوف ديوتي موبايل", label: "CALL OF DUTY", unit: "CP" },
  { key: "roblox", name: "روبلوكس", label: "ROBLOX", unit: "card" },
  { key: "fortnite", name: "فورتنايت", label: "FORTNITE", unit: "V" },
  { key: "steam", name: "ستيم", label: "STEAM", unit: "card" },
  { key: "xbox", name: "إكس بوكس", label: "XBOX", unit: "card" },
  { key: "yalla-ludo", name: "يلا لودو", label: "YALLA LUDO", unit: "gem" },
  { key: "valorant", name: "فالورانت", label: "VALORANT", unit: "card" },
  { key: "apple-google", name: "آيتونز وجوجل بلاي", label: "GIFT CARDS", unit: "card" },
];

const BY_ID = "الشحن بالـ ID: مش محتاجين باسورد ولا إيميل حسابك.";
const ID_NEXT = "بعد ما تأكد الطلب هنكلمك واتساب على رقمك ناخد الـ Player ID ونشحن في دقايق.";
const CODE_NEXT = "الكود بيوصلك واتساب على رقمك بعد ما الدفع يتأكد، ومعاه خطوات استخدامه.";

const ffDesc = (total, base, bonus) =>
  `${total.toLocaleString("en-US")} جوهرة فري فاير (${base.toLocaleString("en-US")} + ${bonus.toLocaleString("en-US")} بونص) على حسابك مباشرة.\n${BY_ID}\n${ID_NEXT}\nمتاح لسيرفر الشرق الأوسط.`;
const ucDesc = (total, base, bonus) =>
  `${total.toLocaleString("en-US")} شدة UC${bonus ? ` (${base.toLocaleString("en-US")} + ${bonus.toLocaleString("en-US")} بونص)` : ""} لببجي موبايل النسخة العالمية.\n${BY_ID}\n${ID_NEXT}\nالشدات بتنزل في الحساب في نفس اللحظة اللي بنشحن فيها.`;
const cpDesc = (total) =>
  `${total.toLocaleString("en-US")} نقطة CP لكول أوف ديوتي موبايل: باتل باس، سكنات، وصناديق.\n${BY_ID}\n${ID_NEXT}`;
const cardDesc = (what, region, extra) =>
  `${what}${region ? ` — حساب ${region}` : ""}.\n${CODE_NEXT}${extra ? `\n${extra}` : ""}`;

/**
 * price / compareAt in EGP, age in days (under 30 = "جديد").
 * tier 1–6 = how big the art pile is.
 */
export const PRODUCTS = [
  // ── Free Fire ──
  { slug: "ff-110", cat: "free-fire", age: 70, name: "110 جوهرة فري فاير", price: 60, compareAt: 65, art: { kind: "gem", tier: 1, amount: "110", unit: "جوهرة", bonus: "+10" }, description: ffDesc(110, 100, 10) },
  { slug: "ff-231", cat: "free-fire", age: 70, name: "231 جوهرة فري فاير", price: 115, art: { kind: "gem", tier: 2, amount: "231", unit: "جوهرة", bonus: "+21" }, description: ffDesc(231, 210, 21) },
  { slug: "ff-583", cat: "free-fire", age: 70, featured: true, name: "583 جوهرة فري فاير", price: 289, compareAt: 310, art: { kind: "gem", tier: 3, amount: "583", unit: "جوهرة", bonus: "+53" }, description: ffDesc(583, 530, 53) },
  { slug: "ff-1188", cat: "free-fire", age: 70, name: "1,188 جوهرة فري فاير", price: 559, art: { kind: "gem", tier: 4, amount: "1,188", unit: "جوهرة", bonus: "+108" }, description: ffDesc(1188, 1080, 108) },
  { slug: "ff-2420", cat: "free-fire", age: 70, name: "2,420 جوهرة فري فاير", price: 1099, compareAt: 1180, art: { kind: "gem", tier: 6, amount: "2,420", unit: "جوهرة", bonus: "+220" }, description: ffDesc(2420, 2200, 220) },
  { slug: "ff-weekly", cat: "free-fire", age: 12, name: "عضوية فري فاير الأسبوعية", price: 99, art: { kind: "pass", tier: 2, amount: "7", unit: "أيام", top: "WEEKLY" }, description: `العضوية الأسبوعية: جواهر بتنزل لك كل يوم تسجل فيه دخول لمدة ٧ أيام، ومزايا العضوية جوه اللعبة.\nأوفر من شراء نفس الجواهر مرة واحدة.\n${BY_ID}\n${ID_NEXT}` },
  { slug: "ff-monthly", cat: "free-fire", age: 12, featured: true, name: "عضوية فري فاير الشهرية", price: 469, art: { kind: "pass", tier: 5, amount: "30", unit: "يوم", top: "MONTHLY" }, description: `العضوية الشهرية: جواهر يومية لمدة ٣٠ يوم ومزايا العضوية جوه اللعبة.\nأكتر باقة بيطلبها اللي بيلعبوا كل يوم.\n${BY_ID}\n${ID_NEXT}` },

  // ── PUBG Mobile ──
  { slug: "pubg-60", cat: "pubg", age: 65, name: "60 شدة ببجي موبايل", price: 59, art: { kind: "coin", tier: 1, label: "UC", amount: "60", unit: "شدة" }, description: ucDesc(60, 60, 0) },
  { slug: "pubg-325", cat: "pubg", age: 65, featured: true, name: "325 شدة ببجي موبايل", price: 289, compareAt: 305, art: { kind: "coin", tier: 2, label: "UC", amount: "325", unit: "شدة", bonus: "+25" }, description: ucDesc(325, 300, 25) },
  { slug: "pubg-660", cat: "pubg", age: 65, name: "660 شدة ببجي موبايل", price: 579, art: { kind: "coin", tier: 3, label: "UC", amount: "660", unit: "شدة", bonus: "+60" }, description: ucDesc(660, 600, 60) },
  { slug: "pubg-1800", cat: "pubg", age: 65, name: "1,800 شدة ببجي موبايل", price: 1449, compareAt: 1520, art: { kind: "coin", tier: 4, label: "UC", amount: "1,800", unit: "شدة", bonus: "+300" }, description: ucDesc(1800, 1500, 300) },
  { slug: "pubg-3850", cat: "pubg", age: 65, name: "3,850 شدة ببجي موبايل", price: 2899, art: { kind: "coin", tier: 5, label: "UC", amount: "3,850", unit: "شدة", bonus: "+850" }, description: ucDesc(3850, 3000, 850) },
  { slug: "pubg-8100", cat: "pubg", age: 65, name: "8,100 شدة ببجي موبايل", price: 5799, art: { kind: "coin", tier: 6, label: "UC", amount: "8,100", unit: "شدة", bonus: "+2,100" }, description: ucDesc(8100, 6000, 2100) },

  // ── PlayStation ──
  { slug: "psn-10", cat: "playstation", age: 60, name: "بطاقة بلايستيشن ستور 10$ أمريكي", price: 589, art: { kind: "card", brand: "PlayStation Store", value: "$10", region: "USA" }, description: cardDesc("رصيد 10 دولار لمتجر بلايستيشن، لـ PS5 و PS4", "أمريكي", "الرصيد مايتحوّلش لحسابات مناطق تانية.") },
  { slug: "psn-20", cat: "playstation", age: 60, name: "بطاقة بلايستيشن ستور 20$ أمريكي", price: 1149, art: { kind: "card", brand: "PlayStation Store", value: "$20", region: "USA" }, description: cardDesc("رصيد 20 دولار لمتجر بلايستيشن، لـ PS5 و PS4", "أمريكي", "الرصيد مايتحوّلش لحسابات مناطق تانية.") },
  { slug: "psn-50", cat: "playstation", age: 60, featured: true, name: "بطاقة بلايستيشن ستور 50$ أمريكي", price: 2799, compareAt: 2990, art: { kind: "card", brand: "PlayStation Store", value: "$50", region: "USA" }, description: cardDesc("رصيد 50 دولار لمتجر بلايستيشن: ألعاب، إضافات، واشتراكات", "أمريكي", "الرصيد مايتحوّلش لحسابات مناطق تانية.") },
  { slug: "psn-100", cat: "playstation", age: 60, name: "بطاقة بلايستيشن ستور 100$ أمريكي", price: 5499, art: { kind: "card", brand: "PlayStation Store", value: "$100", region: "USA" }, description: cardDesc("رصيد 100 دولار لمتجر بلايستيشن", "أمريكي", "الرصيد مايتحوّلش لحسابات مناطق تانية.") },
  { slug: "ps-plus-essential-3m", cat: "playstation", age: 20, name: "اشتراك PS Plus Essential — 3 شهور", price: 1449, art: { kind: "card", brand: "PS Plus Essential", value: "3", valueUnit: "شهور", region: "USA" }, description: cardDesc("اشتراك PS Plus Essential لمدة ٣ شهور: اللعب أونلاين، ألعاب شهرية مجانية، وخصومات حصرية", "أمريكي") },
  { slug: "ps-plus-essential-12m", cat: "playstation", age: 20, name: "اشتراك PS Plus Essential — 12 شهر", price: 4599, compareAt: 4900, art: { kind: "card", brand: "PS Plus Essential", value: "12", valueUnit: "شهر", region: "USA" }, description: cardDesc("اشتراك PS Plus Essential لمدة سنة: اللعب أونلاين، ألعاب شهرية مجانية، وخصومات حصرية", "أمريكي", "أوفر من ٤ اشتراكات ٣ شهور.") },

  // ── Call of Duty Mobile ──
  { slug: "codm-80", cat: "cod", age: 55, name: "80 نقطة CP كول أوف ديوتي موبايل", price: 69, art: { kind: "coin", tier: 1, label: "CP", amount: "80", unit: "نقطة" }, description: cpDesc(80) },
  { slug: "codm-420", cat: "cod", age: 55, name: "420 نقطة CP كول أوف ديوتي موبايل", price: 255, art: { kind: "coin", tier: 2, label: "CP", amount: "420", unit: "نقطة" }, description: cpDesc(420) },
  { slug: "codm-880", cat: "cod", age: 55, name: "880 نقطة CP كول أوف ديوتي موبايل", price: 499, art: { kind: "coin", tier: 3, label: "CP", amount: "880", unit: "نقطة" }, description: cpDesc(880) },
  { slug: "codm-2400", cat: "cod", age: 55, name: "2,400 نقطة CP كول أوف ديوتي موبايل", price: 1449, art: { kind: "coin", tier: 4, label: "CP", amount: "2,400", unit: "نقطة" }, description: cpDesc(2400) },
  { slug: "codm-5000", cat: "cod", age: 55, name: "5,000 نقطة CP كول أوف ديوتي موبايل", price: 2899, art: { kind: "coin", tier: 5, label: "CP", amount: "5,000", unit: "نقطة" }, description: cpDesc(5000) },
  { slug: "codm-10800", cat: "cod", age: 55, name: "10,800 نقطة CP كول أوف ديوتي موبايل", price: 5250, art: { kind: "coin", tier: 6, label: "CP", amount: "10,800", unit: "نقطة" }, description: cpDesc(10800) },

  // ── Roblox ──
  { slug: "roblox-800", cat: "roblox", age: 50, featured: true, name: "كارت روبلوكس 10$ — 800 روبوكس", price: 599, art: { kind: "card", brand: "Roblox", value: "800", valueUnit: "Robux", region: "GLOBAL" }, description: cardDesc("كارت روبلوكس 10 دولار بيدّيك 800 روبوكس، ويشتغل على أي حساب في أي بلد", null, "بيتفعّل من roblox.com/redeem.") },
  { slug: "roblox-2000", cat: "roblox", age: 50, name: "كارت روبلوكس 25$ — 2,000 روبوكس", price: 1449, art: { kind: "card", brand: "Roblox", value: "2,000", valueUnit: "Robux", region: "GLOBAL" }, description: cardDesc("كارت روبلوكس 25 دولار بيدّيك 2,000 روبوكس، ويشتغل على أي حساب في أي بلد", null, "بيتفعّل من roblox.com/redeem.") },
  { slug: "roblox-4500", cat: "roblox", age: 50, name: "كارت روبلوكس 50$ — 4,500 روبوكس", price: 2849, art: { kind: "card", brand: "Roblox", value: "4,500", valueUnit: "Robux", region: "GLOBAL" }, description: cardDesc("كارت روبلوكس 50 دولار بيدّيك 4,500 روبوكس، ويشتغل على أي حساب في أي بلد", null, "بيتفعّل من roblox.com/redeem.") },

  // ── Fortnite ──
  { slug: "vbucks-1000", cat: "fortnite", age: 45, name: "1,000 في-باكس فورتنايت", price: 529, art: { kind: "coin", tier: 2, label: "V", amount: "1,000", unit: "V-Bucks" }, description: cardDesc("كود 1,000 في-باكس لفورتنايت: سكنات، إيموتس، وباتل باس", null, "بيشتغل على الكمبيوتر والبلايستيشن والإكس بوكس والسويتش.") },
  { slug: "vbucks-2800", cat: "fortnite", age: 45, name: "2,800 في-باكس فورتنايت", price: 1349, art: { kind: "coin", tier: 3, label: "V", amount: "2,800", unit: "V-Bucks" }, description: cardDesc("كود 2,800 في-باكس لفورتنايت", null, "بيشتغل على الكمبيوتر والبلايستيشن والإكس بوكس والسويتش.") },
  { slug: "vbucks-5000", cat: "fortnite", age: 45, name: "5,000 في-باكس فورتنايت", price: 2149, art: { kind: "coin", tier: 4, label: "V", amount: "5,000", unit: "V-Bucks" }, description: cardDesc("كود 5,000 في-باكس لفورتنايت", null, "بيشتغل على الكمبيوتر والبلايستيشن والإكس بوكس والسويتش.") },
  { slug: "vbucks-13500", cat: "fortnite", age: 45, name: "13,500 في-باكس فورتنايت", price: 5199, compareAt: 5490, art: { kind: "coin", tier: 6, label: "V", amount: "13,500", unit: "V-Bucks" }, description: cardDesc("كود 13,500 في-باكس لفورتنايت، أكبر باقة وأوفر سعر للفي-باكس الواحد", null, "بيشتغل على الكمبيوتر والبلايستيشن والإكس بوكس والسويتش.") },

  // ── Steam ──
  { slug: "steam-5", cat: "steam", age: 40, name: "كارت ستيم 5$ أمريكي", price: 309, art: { kind: "card", brand: "Steam Wallet", value: "$5", region: "USA" }, description: cardDesc("رصيد 5 دولار لمحفظة ستيم", "أمريكي", "الكود مقفول على منطقة أمريكا: اتأكد إن عملة حسابك دولار.") },
  { slug: "steam-10", cat: "steam", age: 40, name: "كارت ستيم 10$ أمريكي", price: 589, art: { kind: "card", brand: "Steam Wallet", value: "$10", region: "USA" }, description: cardDesc("رصيد 10 دولار لمحفظة ستيم", "أمريكي", "الكود مقفول على منطقة أمريكا: اتأكد إن عملة حسابك دولار.") },
  { slug: "steam-20", cat: "steam", age: 40, featured: true, name: "كارت ستيم 20$ أمريكي", price: 1149, compareAt: 1250, art: { kind: "card", brand: "Steam Wallet", value: "$20", region: "USA" }, description: cardDesc("رصيد 20 دولار لمحفظة ستيم: ألعاب، DLC، وسكنات", "أمريكي", "الكود مقفول على منطقة أمريكا: اتأكد إن عملة حسابك دولار.") },
  { slug: "steam-50", cat: "steam", age: 40, name: "كارت ستيم 50$ أمريكي", price: 2799, art: { kind: "card", brand: "Steam Wallet", value: "$50", region: "USA" }, description: cardDesc("رصيد 50 دولار لمحفظة ستيم", "أمريكي", "الكود مقفول على منطقة أمريكا: اتأكد إن عملة حسابك دولار.") },

  // ── Xbox ──
  { slug: "game-pass-ultimate-1m", cat: "xbox", age: 18, featured: true, name: "Xbox Game Pass Ultimate — شهر", price: 1699, art: { kind: "card", brand: "Game Pass Ultimate", value: "1", valueUnit: "شهر", region: "USA" }, description: cardDesc("اشتراك Game Pass Ultimate لمدة شهر: مكتبة ألعاب على الإكس بوكس والكمبيوتر والكلاود، والألعاب الجديدة من أول يوم", "أمريكي") },
  { slug: "game-pass-premium-1m", cat: "xbox", age: 18, name: "Xbox Game Pass Premium — شهر", price: 879, art: { kind: "card", brand: "Game Pass Premium", value: "1", valueUnit: "شهر", region: "USA" }, description: cardDesc("اشتراك Game Pass Premium لمدة شهر: مكتبة ألعاب كبيرة على الإكس بوكس والكمبيوتر واللعب أونلاين", "أمريكي") },
  { slug: "xbox-10", cat: "xbox", age: 35, name: "بطاقة إكس بوكس 10$ أمريكي", price: 589, art: { kind: "card", brand: "Xbox Gift Card", value: "$10", region: "USA" }, description: cardDesc("رصيد 10 دولار لمتجر مايكروسوفت وإكس بوكس", "أمريكي") },
  { slug: "xbox-25", cat: "xbox", age: 35, name: "بطاقة إكس بوكس 25$ أمريكي", price: 1429, art: { kind: "card", brand: "Xbox Gift Card", value: "$25", region: "USA" }, description: cardDesc("رصيد 25 دولار لمتجر مايكروسوفت وإكس بوكس", "أمريكي") },

  // ── Yalla Ludo ──
  { slug: "ludo-950", cat: "yalla-ludo", age: 30, name: "950 جوهرة يلا لودو", price: 170, art: { kind: "gem", tier: 1, amount: "950", unit: "جوهرة" }, description: `950 جوهرة يلا لودو على حسابك.\n${BY_ID}\n${ID_NEXT}` },
  { slug: "ludo-2320", cat: "yalla-ludo", age: 30, name: "2,320 جوهرة يلا لودو", price: 420, art: { kind: "gem", tier: 2, amount: "2,320", unit: "جوهرة" }, description: `2,320 جوهرة يلا لودو على حسابك.\n${BY_ID}\n${ID_NEXT}` },
  { slug: "ludo-5150", cat: "yalla-ludo", age: 30, name: "5,150 جوهرة يلا لودو", price: 840, art: { kind: "gem", tier: 4, amount: "5,150", unit: "جوهرة" }, description: `5,150 جوهرة يلا لودو على حسابك.\n${BY_ID}\n${ID_NEXT}` },
  { slug: "ludo-13580", cat: "yalla-ludo", age: 30, name: "13,580 جوهرة يلا لودو", price: 2190, art: { kind: "gem", tier: 6, amount: "13,580", unit: "جوهرة" }, description: `13,580 جوهرة يلا لودو على حسابك.\n${BY_ID}\n${ID_NEXT}` },

  // ── Valorant ──
  { slug: "valorant-475", cat: "valorant", age: 25, name: "كارت فالورانت 475 VP", price: 299, art: { kind: "card", brand: "Valorant", value: "475", valueUnit: "VP", region: "MENA" }, description: cardDesc("كود 475 فالورانت بوينت لسكنات الأسلحة والباتل باس", "منطقة الشرق الأوسط") },
  { slug: "valorant-1000", cat: "valorant", age: 25, name: "كارت فالورانت 1,000 VP", price: 579, art: { kind: "card", brand: "Valorant", value: "1,000", valueUnit: "VP", region: "MENA" }, description: cardDesc("كود 1,000 فالورانت بوينت، يكفي باتل باس كامل", "منطقة الشرق الأوسط") },
  { slug: "valorant-2050", cat: "valorant", age: 25, name: "كارت فالورانت 2,050 VP", price: 1149, art: { kind: "card", brand: "Valorant", value: "2,050", valueUnit: "VP", region: "MENA" }, description: cardDesc("كود 2,050 فالورانت بوينت", "منطقة الشرق الأوسط") },

  // ── iTunes & Google Play ──
  { slug: "itunes-10", cat: "apple-google", age: 22, name: "بطاقة آيتونز 10$ أمريكي", price: 599, art: { kind: "card", brand: "Apple Gift Card", value: "$10", region: "USA" }, description: cardDesc("رصيد 10 دولار لحساب Apple: تطبيقات، ألعاب، iCloud+ و Apple Music", "أمريكي") },
  { slug: "itunes-25", cat: "apple-google", age: 22, name: "بطاقة آيتونز 25$ أمريكي", price: 1449, art: { kind: "card", brand: "Apple Gift Card", value: "$25", region: "USA" }, description: cardDesc("رصيد 25 دولار لحساب Apple: تطبيقات، ألعاب، iCloud+ و Apple Music", "أمريكي") },
  { slug: "google-play-10", cat: "apple-google", age: 22, name: "بطاقة جوجل بلاي 10$ أمريكي", price: 599, art: { kind: "card", brand: "Google Play", value: "$10", region: "USA" }, description: cardDesc("رصيد 10 دولار لجوجل بلاي: ألعاب وتطبيقات وشحن جوه الألعاب", "أمريكي") },
  { slug: "google-play-25", cat: "apple-google", age: 22, name: "بطاقة جوجل بلاي 25$ أمريكي", price: 1449, art: { kind: "card", brand: "Google Play", value: "$25", region: "USA" }, description: cardDesc("رصيد 25 دولار لجوجل بلاي: ألعاب وتطبيقات وشحن جوه الألعاب", "أمريكي") },
];

/** Hero slides: the art is drawn (art.mjs `banner-*`), the copy is the theme's. */
export const BANNERS = [
  { key: "banner-all", title: "اشحن لعبتك في دقايق", subtitle: "جواهر، شدات، وكروت ألعاب بالـ ID، وادفع فودافون كاش أو إنستاباي.", cta: "تسوّق الباقات", link: { type: "PRODUCTS" } },
  { key: "banner-ff", title: "جواهر فري فاير", subtitle: "من 110 لـ 2,420 جوهرة بالبونص، والعضوية الأسبوعية والشهرية.", cta: "اشحن فري فاير", link: { type: "CATEGORY", cat: "free-fire" } },
  { key: "banner-pubg", title: "شدات ببجي بالـ ID", subtitle: "60 لـ 8,100 شدة، بتنزل في حسابك أول ما نشحن.", cta: "اشحن ببجي", link: { type: "CATEGORY", cat: "pubg" } },
  { key: "banner-cards", title: "كروت بلايستيشن وستيم", subtitle: "أكواد أمريكي أصلية بتوصلك واتساب بعد الدفع.", cta: "شوف الكروت", link: { type: "CATEGORY", cat: "playstation" } },
];

/** [product slug, name, rating, title, text] */
export const REVIEWS = [
  ["ff-583", "يوسف أحمد", 5, "سريع جدًا", "طلبت الساعة ١٢ بالليل والجواهر نزلت في أقل من ١٠ دقايق. أول مرة أشحن من مكان غير اللعبة وكان مريح."],
  ["ff-583", "عمر خالد", 5, null, "بعتلهم الـ ID على واتساب وشحنوا على طول، والسعر أرخص من جوه اللعبة."],
  ["ff-monthly", "زياد محمود", 5, "تستاهل", "العضوية الشهرية أوفر بكتير من إني أشتري جواهر كل شوية. بقالي ٣ شهور بجددها من هنا."],
  ["ff-monthly", "مالك سامح", 4, null, "كله تمام، بس ياريت يبقى فيه تذكير قبل ما العضوية تخلص."],
  ["ff-110", "آدم شريف", 5, null, "أخويا الصغير بيشحن من هنا كل أسبوع، والتعامل محترم."],
  ["pubg-325", "كريم حسن", 5, "شدات في ثواني", "الشدات وصلت قبل ما أقفل الشات. هشحن الرويال باس الجاي من هنا برضه."],
  ["pubg-325", "مصطفى علي", 5, null, "دفعت إنستاباي وبعت الإسكرين وفي ٥ دقايق الشدات كانت في الحساب."],
  ["pubg-660", "أحمد رضا", 4, null, "سعر كويس وشحن سريع، المرة دي اتأخر ربع ساعة بس عشان كان فيه ضغط."],
  ["pubg-1800", "حازم إبراهيم", 5, "ثقة", "شحنت ١٨٠٠ شدة وكنت قلقان أول مرة، بس كله مظبوط ومعاه رسالة تأكيد."],
  ["psn-50", "محمد طارق", 5, null, "الكود اشتغل على حسابي الأمريكي من أول مرة، واشتريت بيه لعبة على طول."],
  ["psn-50", "سيف الدين", 5, "أرخص من غيرهم", "قارنت بكذا مكان وده كان أرخص، والكود وصل واتساب في دقيقتين."],
  ["psn-20", "إياد مجدي", 4, null, "تمام، بس لازم تتأكد إن حسابك أمريكي قبل ما تطلب زي ما مكتوب."],
  ["ps-plus-essential-12m", "هشام فؤاد", 5, null, "اشتراك السنة أوفر بكتير، واتفعّل من غير أي مشكلة."],
  ["steam-20", "ياسين عادل", 5, null, "الكود اشتغل والرصيد نزل بالدولار على طول. اشتريت بيه ٣ ألعاب في الخصومات."],
  ["roblox-800", "منة أشرف", 5, "ابني فرحان", "ابني بيلعب روبلوكس وكان عايز روبوكس، الكارت اتفعّل في ثانية."],
  ["roblox-800", "نور هاني", 5, null, "تاني مرة أطلب، والرد على واتساب سريع جدًا."],
  ["game-pass-ultimate-1m", "علي حمدي", 5, null, "اتفعّل على الإكس بوكس والكمبيوتر الاتنين، وبلعب ألعاب جديدة كل أسبوع."],
  ["codm-880", "عبدالرحمن وليد", 4, null, "الشحن تمام، كنت أتمنى يبقى فيه باقات أصغر شوية."],
  ["vbucks-2800", "تيم أسامة", 5, null, "جبت السكن اللي كنت عايزه من الأيتم شوب. الكود اشتغل على البلايستيشن."],
  ["ludo-2320", "دعاء سمير", 5, "أخيرًا", "كنت بدوّر على مكان أشحن منه يلا لودو بفودافون كاش، وده أسهل واحد."],
  ["itunes-10", "سارة جمال", 5, null, "اشتريت بيه مساحة iCloud، والكود وصل على طول."],
  ["valorant-1000", "مهند رامي", 4, null, "الكود اشتغل بس لازم الحساب يكون منطقة الشرق الأوسط زي ما كاتبين."],
];

export const SHOWCASE_COPY = {
  offerStrip: ["شحن بالـ ID في دقايق", "فودافون كاش وإنستاباي", "أكواد أصلية بضمان التفعيل", "دعم كل يوم من ١٠ الصبح لـ ٢ بالليل", "أسعار بالجنيه من غير عمولة"],
};

// Casho Qirat showcase store: a jeweler with a real-looking catalog (photos from
// Unsplash), categories, hero banners, reviews and section copy, rendered with
// the `qirat` theme at qirat.<root domain>.
//
//   node scripts/seed-qirat-demo.mjs            create it (refuses if the slug exists)
//   node scripts/seed-qirat-demo.mjs --remove   delete the store and its owner account
//
// It has its own owner account (never attached to a real user: the dashboard
// opens a user's first store, so a second store would hijack theirs). The
// password is printed once; change it after logging in. No orders are created,
// so platform revenue and order stats stay untouched.

import "dotenv/config";
import { randomBytes, randomUUID } from "node:crypto";
import argon2 from "argon2";
import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const SLUG = "qirat";
const OWNER_EMAIL = "qirat-demo@casho.store";
const DAY = 24 * 60 * 60 * 1000;

const img = (id, w = 900) => `https://images.unsplash.com/photo-${id}?w=${w}&q=80`;
const wide = (id) => `https://images.unsplash.com/photo-${id}?w=2000&h=1100&fit=crop&crop=entropy&q=80`;
const tall = (id) => `https://images.unsplash.com/photo-${id}?w=900&h=1300&fit=crop&crop=entropy&q=80`;

// ─── Catalog ─────────────────────────────────────────────────────────────────

const RING_SIZES = ["50", "52", "54", "56", "58"];

const CATEGORIES = [
  { key: "rings", name: "خواتم", image: img("1631982690223-8aa4be0a2497", 500) },
  { key: "bridal", name: "دبل وسوليتير", image: img("1769038936714-0c0ac933c379", 500) },
  { key: "earrings", name: "حلقان", image: img("1723802205505-2f88b2227718", 500) },
  { key: "necklaces", name: "سلاسل وقلادات", image: img("1705326452390-3ecf6070595f", 500) },
  { key: "pearls", name: "لؤلؤ", image: img("1586115180241-b3e4f01ed837", 500) },
  { key: "bracelets", name: "أساور وغوايش", image: img("1787769499628-cc33a6c79ad9", 500) },
  { key: "watches", name: "ساعات", image: img("1590736969955-71cc94801759", 500) },
];

/**
 * price / compareAt in EGP (Product.price is stored in pounds, unlike
 * balances and shipping, which are piasters), weight in grams, age in days (under 30 = "جديد").
 * Gold pieces are priced as gold weight × the day's gram price + workmanship.
 */
const PRODUCTS = [
  // ── Rings ──
  {
    slug: "pink-topaz-halo-ring", cat: "rings", featured: true, age: 3,
    name: "خاتم هالو بفص توباز وردي",
    price: 18900, stock: 3, weight: 3.1, brand: "قيراط",
    images: ["1603561591411-07134e71a2a9", "1603561596973-8166e9e089d1"], sizes: RING_SIZES,
    description:
      "فص توباز وردي مستطيل ٨×٦ مم حواليه هالة زركون مرصوصة يدوي، على دهب روز عيار ١٨ مدموغ.\nالقطعة بتتعمل على مقاسك خلال ٥ أيام شغل، وبتوصل في علبة قطيفة ومعاها فاتورة بالوزن.",
  },
  {
    slug: "halo-zircon-ring", cat: "rings", age: 48,
    name: "خاتم هالو بفص زركون",
    price: 1450, compareAt: 1850, stock: 14, weight: 3.4,
    images: ["1605100804763-247f67b3557e", "1613945407943-59cd755fd69e"], sizes: RING_SIZES, colors: ["فضة ٩٢٥", "فضة مطلية روز"],
    description:
      "فص زركون دائري ٦ مم بقطع برلنت، حواليه هالة فصوص صغيرة ودراع مقسوم مرصّع.\nفضة ٩٢٥ مدموغة ومطلية روديوم عشان تفضل لامعة وما تسودّش.",
  },
  {
    slug: "stacking-rings-set", cat: "rings", age: 61,
    name: "طقم خواتم ستاك — ٣ قطع",
    price: 1250, compareAt: 1500, stock: 22, weight: 5.2,
    images: ["1543294001-f7cd5d7fb516"], sizes: ["52", "54", "56"],
    description:
      "تلات خواتم رفيعة تتلبس سوا أو كل واحد لوحده: قلب مرصّع، دائرة مرصّعة، وخاتم بفصوص مستطيلة.\nفضة ٩٢٥ مطلية دهب عيار ١٨ بطبقة سميكة.",
  },
  {
    slug: "champagne-cluster-ring", cat: "rings", age: 55,
    name: "خاتم كلاستر شامبين",
    price: 1650, stock: 9, weight: 3.8,
    images: ["1611955167811-4711904bb9f8"], sizes: RING_SIZES,
    description:
      "سبع فصوص بلون الشامبين مقطوعة نقطة ومرصوصة زي الوردة، على دراع مخرّم.\nفضة ٩٢٥ مطلية دهب روز، ومناسب للسهرات وللبس اليومي.",
  },
  {
    slug: "blue-sapphire-ring", cat: "rings", age: 72,
    name: "خاتم سافاير أزرق",
    price: 2350, stock: 6, weight: 3.6,
    images: ["1735480165036-3d1d2f41460f"], sizes: RING_SIZES,
    description:
      "فص سافاير معملي أزرق ملكي ٧×٥ مم، ودراع مرصّع بفصوص زرقا وبيضا.\nفضة ٩٢٥ مطلية روديوم، والفص نفس صلابة السافاير الطبيعي.",
  },
  {
    slug: "milano-diamond-ring", cat: "rings", age: 40,
    name: "خاتم ميلانو بفص ألماس",
    price: 15800, stock: 4, weight: 2.4, brand: "قيراط",
    images: ["1713950920412-97799efdf870"], sizes: RING_SIZES,
    description:
      "دراع مزدوج من دهب روز عيار ١٨، عليه صف فصوص ألماس طبيعي وفص في النص بإطار أبيض.\nإجمالي الألماس ٠٫١٢ قيراط، ومعاه كارت ضمان من المحل.",
  },

  // ── Bridal ──
  {
    slug: "emerald-cut-solitaire", cat: "bridal", featured: true, age: 6,
    name: "سوليتير إيمرالد كت",
    price: 27500, stock: 2, weight: 2.8, brand: "قيراط",
    images: ["1598560917807-1bae44bd2be8", "1780250784120-c83d1bbbebe8"], sizes: RING_SIZES, colors: ["دهب أصفر عيار ١٨", "دهب أبيض عيار ١٨"],
    description:
      "فص مويسانيت إيمرالد كت ١٫٥ قيراط على دراع مرصّع من الجنبين.\nبيتعمل على الطلب في ٧ أيام شغل، ومعاه شهادة الفص وتعديل مقاس مجاني مرة.",
  },
  {
    slug: "princess-solitaire", cat: "bridal", age: 34,
    name: "سوليتير برنسيس",
    price: 24900, stock: 3, weight: 2.6,
    images: ["1719924998065-0c60e329ef58"], sizes: RING_SIZES, colors: ["دهب أبيض عيار ١٨", "دهب أصفر عيار ١٨"],
    description:
      "فص مويسانيت مربع ١ قيراط مركّب على ٤ شوك، ودراع سادة ناعم.\nتصميم بسيط بيتلبس مع أي دبلة، ومعاه شهادة الفص.",
  },
  {
    slug: "six-prong-solitaire", cat: "bridal", age: 50,
    name: "سوليتير كلاسيك ٦ شوك",
    price: 6800, compareAt: 7900, stock: 7, weight: 3.0,
    images: ["1768423685978-42fe24ec39a0"], sizes: RING_SIZES,
    description:
      "فص مويسانيت دائري ١ قيراط بيرفع فوق الإيد على ٦ شوك، أشهر شكل لخاتم الخطوبة.\nفضة ٩٢٥ مطلية بلاتين، وبديل شيك بميزانية معقولة.",
  },
  {
    slug: "classic-wedding-bands", cat: "bridal", age: 66,
    name: "جوز دبل كلاسيك",
    price: 34500, stock: 4, weight: 6.2,
    images: ["1622398925373-3f91b1e275f5", "1654521883301-070279dd0ae1"], sizes: RING_SIZES,
    description:
      "دبلتين سادة بحرف مدوّر مريح، العريضة ٥ مم والرفيعة ٣ مم.\nدهب أصفر عيار ١٨، والسعر للجوز وبيتحسب بوزن يوم الطلب. الحفر بالأسامي والتاريخ مجانًا.",
  },
  {
    slug: "hammered-silver-bands", cat: "bridal", age: 80,
    name: "دبل فضة مطفية",
    price: 2200, stock: 10, weight: 9.5,
    images: ["1620968867360-5cda83d2bffd"], sizes: RING_SIZES,
    description:
      "جوز دبل فضة ٩٢٥ بلمسة مطفية محفورة بالإيد، العرض ٦ مم.\nلكل اتنين بيحبوا الشكل الطبيعي بعيد عن اللمعة، والحفر من جوه مجانًا.",
  },

  // ── Earrings ──
  {
    slug: "twisted-hoops", cat: "earrings", featured: true, age: 12,
    name: "حلق هوب مجدول",
    price: 950, compareAt: 1200, stock: 25, weight: 4.2,
    images: ["1617038220319-276d3cfab638", "1617038260897-41a1f14a8ca0"],
    description:
      "هوب مجدول قطره ٢٠ مم، تقيل في الشكل وخفيف في الودن.\nفضة ٩٢٥ مطلية دهب عيار ١٨، وقفل بيتقفل بكبسة.",
  },
  {
    slug: "halo-stud-earrings", cat: "earrings", age: 44,
    name: "حلق دبوس هالو",
    price: 1150, stock: 18, weight: 2.1,
    images: ["1588444650733-d0767b753fc8", "1588444650700-fd887f15a9e7"],
    description:
      "فص زركون ٥ مم حواليه هالة فصوص صغيرة، بيدي لمعة ألماس من غير سعره.\nفضة ٩٢٥ مطلية روديوم، وفراشة سيليكون مريحة.",
  },
  {
    slug: "sapphire-drop-earrings", cat: "earrings", age: 58,
    name: "حلق نقطة سافاير",
    price: 2450, compareAt: 2900, stock: 5, weight: 5.6,
    images: ["1535632066927-ab7c9ab60908"],
    description:
      "فص أزرق على شكل نقطة جوه إطار مرصّع بفصوص باجيت، طوله ٣٫٥ سم.\nفضة ٩٢٥ مطلية روديوم، قطعة سهرة بامتياز.",
  },
  {
    slug: "pave-huggie-hoops", cat: "earrings", age: 20,
    name: "حلق هاجي مرصّع",
    price: 13400, stock: 6, weight: 2.1, brand: "قيراط",
    images: ["1777999745582-781ebbd8c7b9"],
    description:
      "هاجي صغير ١٢ مم لازق في الودن، مرصّع من قدام بصف ألماس طبيعي ٠٫١٠ قيراط.\nدهب أصفر عيار ١٨، تلبسيه وتنامي بيه.",
  },
  {
    slug: "trinity-hoops", cat: "earrings", age: 70,
    name: "حلق ٣ حلقات",
    price: 1350, stock: 12, weight: 6.0,
    images: ["1615655114865-4cc1bda5901e"],
    description:
      "تلات حلقات متداخلة بتلات ألوان: دهبي وفضي وروز، بتتحرك مع بعض.\nفضة ٩٢٥ بطلاء تلات ألوان.",
  },
  {
    slug: "laurel-earrings", cat: "earrings", age: 39,
    name: "حلق ورق الغار",
    price: 1750, stock: 8, weight: 6.8,
    images: ["1693212793204-bcea856c75fe", "1693213085235-ea6deadf8cee"],
    description:
      "ورق غار مرصوص على شكل نص دايرة، كل ورقة فص زركون ماركيز.\nفضة ٩٢٥ مطلية روديوم، ومناسب للفرح والخطوبة.",
  },
  {
    slug: "diamond-studs-18k", cat: "earrings", age: 26,
    name: "حلق ستاد ألماس",
    price: 21500, stock: 3, weight: 1.6, brand: "قيراط",
    images: ["1787520309842-6a8e4b7cdd7f"],
    description:
      "فص ألماس طبيعي دائري في كل ودن، إجمالي ٠٫٢٠ قيراط، نقاوة VS ولون G.\nدهب أصفر عيار ١٨ بقفل بُرمة أمان، ومعاه شهادة.",
  },
  {
    slug: "seashell-earrings", cat: "earrings", age: 9,
    name: "حلق صدفة دهبي",
    price: 450, compareAt: 600, stock: 40, weight: 7.0,
    images: ["1778182553300-7593326ca29d"],
    description:
      "حلق على شكل صدفة حلزونية، لمسة صيفي خفيفة.\nستانلس ستيل مطلي دهب: ما بيصدّيش ولا بيغيّر لونه مع المية.",
  },
  {
    slug: "wavy-square-earrings", cat: "earrings", age: 52,
    name: "حلق مربع مموّج",
    price: 520, stock: 30, weight: 6.5,
    images: ["1708220040828-9ab1673681d3"],
    description:
      "مربع ٢ سم بسطح مكرمش بيعكس النور من كل زاوية.\nستانلس ستيل مطلي دهب، خفيف ومناسب للشغل والخروج.",
  },

  // ── Necklaces ──
  {
    slug: "engraved-bar-necklace", cat: "necklaces", age: 31,
    name: "سلسلة بار بالاسم",
    price: 850, stock: 30, weight: 3.0,
    images: ["1569397288884-4d43d6738fbd"], colors: ["فضة مطلية دهب", "فضة ٩٢٥", "فضة مطلية روز"],
    description:
      "بار طوله ٣ سم بنحفر عليه الاسم أو التاريخ اللي تختاريه بالليزر، والحفر مجاني.\nفضة ٩٢٥، طول السلسلة ٤٥ سم وفيها حلقة على ٤٠.",
  },
  {
    slug: "open-circle-necklace", cat: "necklaces", age: 45,
    name: "سلسلة دائرة",
    price: 13900, stock: 5, weight: 2.3, brand: "قيراط",
    images: ["1773929345739-94db8a4ccd0c"],
    description:
      "دائرة مفتوحة ١٫٥ سم بين سلسلتين رفاع، رمز البدايات الجديدة.\nدهب أصفر عيار ١٨ بالكامل، طول ٤٢ سم.",
  },
  {
    slug: "herringbone-chain", cat: "necklaces", age: 63,
    name: "سلسلة هيرينج بون ٤ مم",
    price: 690, compareAt: 850, stock: 26, weight: 9.0,
    images: ["1616837874254-8d5aaa63e273"],
    description:
      "سلسلة مبسوطة بتنام على الرقبة زي شريط دهب، عرض ٤ مم.\nستانلس ستيل مطلي دهب عيار ١٨، ما بتسودّش، وطولها ٤٥ سم.",
  },
  {
    slug: "cushion-halo-pendant", cat: "necklaces", age: 36,
    name: "قلادة كوشن هالو",
    price: 1350, compareAt: 1650, stock: 12, weight: 3.3,
    images: ["1588444968576-f8fe92ce56fd"],
    description:
      "فص زركون كوشن ٨ مم حواليه هالتين فصوص، على سلسلة فينيسي رفيعة.\nفضة ٩٢٥ مطلية روديوم، طول ٤٥ سم.",
  },
  {
    slug: "london-blue-pendant", cat: "necklaces", age: 57,
    name: "قلادة توباز لندن بلو",
    price: 2650, stock: 7, weight: 4.4,
    images: ["1599643478518-a784e5dc4c8f"],
    description:
      "فص توباز أزرق غامق مثمّن على سلسلة رولو.\nفضة ٩٢٥ مطلية دهب، طول ٥٠ سم.",
  },
  {
    slug: "amethyst-pendant", cat: "necklaces", age: 85,
    name: "قلادة جمشت مثمّن",
    price: 3200, stock: 2, weight: 6.1,
    images: ["1719862056532-34900b21387a"],
    description:
      "جمشت طبيعي ١٢ مم بإطار مرصّع، تصميم مستوحى من مجوهرات العشرينات.\nفضة ٩٢٥ مطلية روديوم، والقلادة من غير سلسلة.",
  },
  {
    slug: "oval-pendant-necklace", cat: "necklaces", age: 4,
    name: "سلسلة أوفال",
    price: 980, stock: 15, weight: 5.5,
    images: ["1783541507490-edb026e2a961"],
    description:
      "حلقة أوفال مصبوبة على سلسلة سنيك ناعمة، قطعة بتلفت النظر من غير زحمة.\nفضة ٩٢٥ مطلية دهب، طول ٤٥ سم.",
  },
  {
    slug: "gold-heart-necklace", cat: "necklaces", age: 15,
    name: "سلسلة قلب دهب",
    price: 11200, stock: 6, weight: 1.8, brand: "قيراط",
    images: ["1623321673989-830eff0fd59f"],
    description:
      "قلب صغير منفوخ على سلسلة رفيعة، أحلى هدية للمناسبات.\nدهب أصفر عيار ٢١، والسعر بيتحسب بوزن يوم الطلب.",
  },

  // ── Pearls ──
  {
    slug: "freshwater-pearl-strand", cat: "pearls", featured: true, age: 18,
    name: "عقد لؤلؤ طبيعي ٧ مم",
    price: 3900, compareAt: 4600, stock: 7, weight: 28,
    images: ["1515562141207-7a88fb7ce338", "1595345705177-ffe090eb0784"],
    description:
      "لؤلؤ مياه عذبة طبيعي ٧–٧٫٥ مم، كل حبة متنقية بالإيد ومتعقودة لوحدها.\nقفل فضة ٩٢٥ بفص، طول ٤٥ سم، وبييجي في علبته.",
  },
  {
    slug: "double-pearl-necklace", cat: "pearls", age: 47,
    name: "عقد لؤلؤ صفّين",
    price: 2750, stock: 9, weight: 34,
    images: ["1654699991520-aaaf4dd2608b", "1764974345389-09da4244809c"],
    description:
      "صفين لؤلؤ ٦ مم بيتلبسوا تحت الياقة أو على الفستان.\nلؤلؤ مياه عذبة وقفل فضة مطلية دهب.",
  },
  {
    slug: "baroque-pearl-pendant", cat: "pearls", age: 7,
    name: "قلادة لؤلؤة باروك",
    price: 1250, stock: 11, weight: 4.0,
    images: ["1786052337650-9e1c0dd01f5e"],
    description:
      "لؤلؤة باروك شكلها مختلف عن أي حبة تانية، جوه إطار دهبي حر.\nفضة ٩٢٥ مطلية دهب، طول ٤٢ سم.",
  },
  {
    slug: "pearl-drop-earrings", cat: "pearls", age: 29,
    name: "حلق لؤلؤ دلاية",
    price: 780, stock: 20, weight: 3.2,
    images: ["1590166223826-12dee1677420"],
    description:
      "لؤلؤة دمعة متعلقة في قطعة دهبي مموّجة.\nفضة ٩٢٥ مطلية دهب ولؤلؤ مياه عذبة.",
  },

  // ── Bracelets ──
  {
    slug: "tennis-bracelet", cat: "bracelets", featured: true, age: 23,
    name: "انسيال تنس",
    price: 2350, compareAt: 2900, stock: 11, weight: 9.8,
    images: ["1619119069152-a2b331eb392a", "1763029513623-37d488cb97b1"],
    description:
      "صف فصوص زركون ٣ مم مرصوصة على ٤ شوك، بتلف المعصم كله.\nفضة ٩٢٥ مطلية روديوم، طول ١٧ سم وقفل أمان مزدوج.",
  },
  {
    slug: "plain-21k-bangle", cat: "bracelets", age: 74,
    name: "غويشة سادة عيار ٢١",
    price: 49500, stock: 2, weight: 9.0, brand: "قيراط",
    images: ["1655707063092-5c4509de41b8", "1655707063473-3ee2e5b5eeb8"],
    description:
      "غويشة مصري سادة بنقشة خفيفة على الجنب، شغل إيد.\nدهب عيار ٢١، الوزن التقريبي ٩ جرام، والسعر بيتحسب بسعر جرام يوم الطلب والمصنعية ثابتة.",
  },
  {
    slug: "chunky-chain-bracelet", cat: "bracelets", age: 38,
    name: "انسيال تشانكي",
    price: 750, stock: 20, weight: 14,
    images: ["1602173574767-37ac01994b2a"],
    description:
      "حلقات عريضة متشابكة بتدي حضور قوي للإيد.\nستانلس ستيل مطلي دهب عيار ١٨، طول ١٨ سم.",
  },
  {
    slug: "evil-eye-bracelet", cat: "bracelets", age: 2,
    name: "انسيال عين زرقا",
    price: 520, stock: 35, weight: 2.4,
    images: ["1721206624492-3d05631471ea"],
    description:
      "عين زرقا بمينا على سلسلة بيبر كليب رفيعة.\nفضة ٩٢٥ مطلية دهب، طول ١٦ سم + ٣ سم وصلة.",
  },
  {
    slug: "heart-charm-bracelet", cat: "bracelets", age: 54,
    name: "انسيال قلوب فضة",
    price: 1050, stock: 16, weight: 4.5,
    images: ["1676120963306-8969fa6a810e", "1676291055501-286c48bb186f"], colors: ["أزرق", "أحمر"],
    description:
      "قلوب صغيرة مفرّغة وفي النص قلب بفص ملوّن.\nفضة ٩٢٥، طول ١٧ سم قابل للتعديل.",
  },
  {
    slug: "serpent-bracelet", cat: "bracelets", featured: true, age: 14,
    name: "انسيال ثعبان مرصّع",
    price: 3450, stock: 4, weight: 18,
    images: ["1639065643006-e217c4fee12e"],
    description:
      "انسيال مرن بيلف على المعصم زي الثعبان، مرصّع بالكامل بفصوص زركون.\nفضة ٩٢٥ مطلية روديوم، مقاس واحد بيناسب معظم الإيدين.",
  },
  {
    slug: "clover-station-bracelet", cat: "bracelets", age: 33,
    name: "انسيال برسيم ملوّن",
    price: 1450, stock: 13, weight: 3.6,
    images: ["1717605383946-96c6884c36b4"],
    description:
      "أربع وردات برسيم بأحجار: عقيق أحمر، لازورد، أونيكس، وصدف.\nفضة ٩٢٥ مطلية دهب، طول ١٧ سم.",
  },

  // ── Watches ──
  {
    slug: "rose-leather-watch", cat: "watches", age: 42,
    name: "ساعة كلاسيك روز",
    price: 2950, compareAt: 3600, stock: 8, weight: 38,
    images: ["1524592094714-0f0654e20314", "1506193095-80bc749473f2"],
    description:
      "ميناء أبيض ٣٢ مم بعقارب رفيعة وإطار روز، وسوار جلد طبيعي.\nماكينة يابانية، ضد المية ٣٠ متر، وضمان سنة.",
  },
  {
    slug: "roman-crystal-watch", cat: "watches", age: 27,
    name: "ساعة أرقام رومانية بفصوص",
    price: 4800, stock: 5, weight: 85,
    images: ["1751437761644-460ae92e34c9"],
    description:
      "ميناء صدفي بأرقام رومانية، وإطار وسوار مرصّعين بفصوص كريستال.\nستانلس ستيل مطلي روز، ضد المية ٥٠ متر.",
  },
  {
    slug: "brown-dial-watch", cat: "watches", age: 64,
    name: "ساعة ميناء بني",
    price: 4200, stock: 6, weight: 80,
    images: ["1751437774882-deeea4352018"],
    description:
      "ميناء بني لامع بإطار مرصّع، وسوار معدن روز بقفل فراشة.\nماكينة يابانية، ضد المية ٥٠ متر، وضمان سنة.",
  },
  {
    slug: "navy-dial-watch", cat: "watches", age: 76,
    name: "ساعة ميناء كحلي",
    price: 3350, stock: 7, weight: 90,
    images: ["1584208123923-cc027813cbcb"],
    description:
      "ميناء كحلي بعلامات دهبي وسوار ستانلس دهبي.\nضد المية ٥٠ متر، وبنظبط طول السوار مجانًا.",
  },
];

const BANNERS = [
  { title: "دهب يتلبس كل يوم", subtitle: "قطع خفيفة بتكمّل لبسك من الصبح لآخر الليل.", cta: "تسوّقي الجديد", photo: "1585960622850-ed33c41d6418", link: { type: "PRODUCTS" } },
  { title: "غوايش عيار ٢١", subtitle: "شغل إيد بنقشات قديمة، بالوزن والفاتورة.", cta: "شوفي الأساور", photo: "1758995116383-f51775896add", link: { type: "CATEGORY", cat: "bracelets" } },
  { title: "لحظة الـ«أيوه»", subtitle: "سوليتير ودبل على دهب ١٨، بشهادة وتعديل مقاس مجاني.", cta: "اختاري خاتمك", photo: "1573408301185-9146fe634ad0", link: { type: "CATEGORY", cat: "bridal" } },
  { title: "لؤلؤ طبيعي", subtitle: "عقود لؤلؤ مياه عذبة، متنقية حبة حبة.", cta: "اكتشفي اللؤلؤ", photo: "1785744556873-bfa4e74ff7e0", link: { type: "CATEGORY", cat: "pearls" } },
];

const REVIEWS = [
  ["pink-topaz-halo-ring", "منة الله سامي", 5, "أحلى من الصور", "اللون الوردي في الحقيقة أهدى وأشيك، والمقاس جه مظبوط بالظبط بعد ما قست بدليل المقاسات."],
  ["pink-topaz-halo-ring", "رنا عادل", 5, null, "جالي في علبة قطيفة تحفة ومعاه الفاتورة بالوزن. هدية خطوبتي وفرحت بيه جدًا."],
  ["emerald-cut-solitaire", "كريم مصطفى", 5, "اختيار موفق", "كنت محتار بين كذا شكل وكلمتهم واتساب وساعدوني أختار. الفص بيلمع جدًا والشغل نضيف."],
  ["emerald-cut-solitaire", "يوسف الشريف", 4, null, "الخاتم ممتاز، بس التصنيع خد ٨ أيام بدل ٧. التعامل محترم."],
  ["twisted-hoops", "سلمى حسن", 5, null, "خفيفة جدًا رغم إن شكلها تقيل، ولبستها أسبوع كامل من غير ما الطلاء يتأثر."],
  ["twisted-hoops", "نورهان طارق", 4, "حلوة", "المقاس مناسب للبس اليومي. كنت أتمنى يبقى فيه مقاس أكبر شوية."],
  ["twisted-hoops", "دينا مجدي", 5, null, "تاني مرة أشتريها، المرة دي هدية لأختي."],
  ["freshwater-pearl-strand", "هالة إبراهيم", 5, "لؤلؤ بجد", "الحبات متساوية ولمعتها طبيعية، وكل حبة معقودة لوحدها زي ما مكتوب."],
  ["freshwater-pearl-strand", "مريم فتحي", 5, null, "اشتريته لماما في عيد الأم وكانت مبسوطة جدًا. العلبة شيك."],
  ["tennis-bracelet", "آية محمود", 5, null, "بيلمع جدًا والقفل مزدوج فمطمنة عليه. بالظبط زي الصور."],
  ["tennis-bracelet", "فرح علي", 4, null, "حلو جدًا، بس مقاس ١٧ كان واسع شوية على إيدي، والمحل شالولي حلقة."],
  ["serpent-bracelet", "ياسمين خالد", 5, "قطعة مميزة", "كل اللي شافوه سألوني جبته منين. بيلف على الإيد كويس ومش بيقع."],
  ["engraved-bar-necklace", "شروق أحمد", 5, null, "حفرت عليها تاريخ جوازنا والحفر واضح ونضيف. وصلت في ٣ أيام."],
  ["engraved-bar-necklace", "عمر سعيد", 5, "هدية مثالية", "طلبتها لمراتي باسم بنتنا، وفرحت بيها جدًا."],
  ["engraved-bar-necklace", "ندى رأفت", 4, null, "الطلاء الدهبي حلو، بس السلسلة رفيعة شوية عن ما توقعت."],
  ["halo-zircon-ring", "بسمة عاطف", 5, null, "شكله زي الألماس بالظبط، ومحدش صدّق إنه فضة."],
  ["halo-zircon-ring", "هبة يحيى", 3, null, "الخاتم حلو بس استلمته بعد ٥ أيام، كنت محتاجاه أسرع."],
  ["rose-leather-watch", "أميرة سمير", 5, null, "ساعة رقيقة جدًا والجلد ناعم. لبستها في الشغل وكل يوم."],
  ["diamond-studs-18k", "لمياء حسين", 5, "تستاهل", "جات معاها شهادة الألماس، واللمعة مختلفة تمامًا عن الزركون."],
  ["oval-pendant-necklace", "جنى وليد", 5, null, "بسيطة وبتفرق في أي لبس، بلبسها مع التيشيرت والفستان."],
  ["evil-eye-bracelet", "رحمة صلاح", 5, null, "رقيق وسعره حلو، جبت منه ٣ لي ولصحباتي."],
  ["classic-wedding-bands", "محمد ناصر", 5, "شغل محترم", "الوزن مطابق للفاتورة بالظبط، والحفر بالأسامي جميل."],
  ["seashell-earrings", "سارة نبيل", 4, null, "لطيفة جدًا للصيف، والستانلس مش بيعمل حساسية."],
  ["gold-heart-necklace", "إيمان فاروق", 5, null, "عيار ٢١ وبوزن الفاتورة، هدية عيد ميلاد بنتي."],
];

// ─── Section copy (the Studio edits all of this) ────────────────────────────

const THEME_CONFIG = {
  presetId: "qirat",
  sectionOverrides: {
    home: { showOfferStrip: true, showUrgency: true, showTestimonials: true, showHeroBanner: true },
  },
  sectionContent: {
    offerStrip: {
      items: ["شحن مجاني فوق ٢٥٠٠ جنيه", "علبة هدية مع كل قطعة", "دهب بفاتورة بالوزن وفضة ٩٢٥ مدموغة", "تعديل مقاس الخاتم مجانًا", "استبدال خلال ١٤ يوم"],
    },
    urgency: { headline: "عروض الشتا على قطع مختارة", timerEndDate: "2026-12-31T21:59:00.000Z", timerLabel: "العرض بيخلص بعد", showStockBadge: true },
    collections: {
      headline: "اختاري على حسب اللحظة",
      items: [
        { name: "للعروسة", image: tall("1762505464779-17f78cbfa8b4"), link: "bridal" },
        { name: "طبقات من الدهب", image: tall("1633934542430-0905ccb5f050"), link: "necklaces" },
        { name: "لؤلؤ كل يوم", image: tall("1764974345389-09da4244809c"), link: "pearls" },
        { name: "على المعصم", image: tall("1740567177735-b3a751eb3891"), link: "bracelets" },
      ],
    },
    heroBanner: {
      backgroundImage: wide("1616837874254-8d5aaa63e273"),
      headline: "اسمها على سلسلة",
      subheadline: "حفر مجاني بالاسم أو التاريخ.",
      buttonText: "اختاري سلسلتك",
      buttonLink: "/products/qirat-engraved-bar-necklace",
      textAlign: "right",
      overlayOpacity: 40, // percent, like the Studio slider (0–90)
    },
    whyChooseUs: {
      headline: "وعد قيراط",
      cards: [
        { icon: "💎", title: "دمغة وشهادة", description: "الدهب بفاتورة بالوزن والعيار، والفضة ٩٢٥ مدموغة، والألماس والمويسانيت بشهادة." },
        { icon: "🎁", title: "جاهزة للهدية", description: "كل قطعة في علبة قطيفة، ونكتب الكارت اللي تحبيه من غير مصاريف." },
        { icon: "📏", title: "المقاس علينا", description: "لو الخاتم مش مظبوط بنعدّله مرة مجانًا خلال ٣٠ يوم." },
        { icon: "🔄", title: "استبدال ١٤ يوم", description: "القطع الجاهزة تتبدل خلال ١٤ يوم طالما بحالتها وعلبتها." },
      ],
    },
    aboutBrand: {
      headline: "من ورشة صغيرة في الصاغة",
      text:
        "بدأنا بترابيزة شغل واحدة وصايغ بيحب التفاصيل. لحد النهارده كل قطعة بتعدّي على إيدينا قبل ما توصلك: نوزنها، نلمّعها، ونتأكد إن قفلها بيقفل صح.",
      image: img("1772442125263-c9dd28bbd938", 1400),
      ctaText: "اعرفي أكتر",
    },
    testimonials: {
      headline: "قالوا عن قيراط",
      items: [
        { name: "منة الله سامي", text: "الخاتم أحلى من الصور، والمقاس جه مظبوط بعد ما قست بدليل المقاسات على الموقع.", rating: 5 },
        { name: "كريم مصطفى", text: "كنت محتار في خاتم الخطوبة، كلمتهم واتساب وفضلوا معايا لحد ما اخترت. التعامل محترم جدًا.", rating: 5 },
        { name: "هالة إبراهيم", text: "عقد اللؤلؤ طبيعي بجد وكل حبة معقودة لوحدها. هييجي منهم تاني أكيد.", rating: 5 },
        { name: "شروق أحمد", text: "حفروا تاريخ جوازنا على السلسلة ووصلت في ٣ أيام في علبة شيك جدًا.", rating: 5 },
      ],
    },
    newsletter: {
      headline: "أول من يعرف",
      subheadline: "القطع الجديدة والعروض بتوصل لقايمتنا قبل أي حد.",
    },
  },
};

// ─── Run ─────────────────────────────────────────────────────────────────────

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 20_000 });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function remove() {
  const store = await prisma.store.findUnique({ where: { slug: SLUG }, select: { id: true, user: { select: { id: true, email: true } } } });
  if (!store) return console.log(`No store at "${SLUG}".`);
  if (store.user.email !== OWNER_EMAIL) throw new Error(`"${SLUG}" belongs to ${store.user.email}, not the demo account. Not touching it.`);
  const storeId = store.id;
  const byStore = { storeId };
  const byStoreProduct = { product: { storeId } };
  // Same order as deleteStoreTree (lib/admin/deletion.ts): RESTRICT children first.
  await prisma.$transaction(
    async (tx) => {
      await tx.suggestedOrder.deleteMany({ where: byStore });
      await tx.cartItem.deleteMany({ where: { OR: [byStore, byStoreProduct] } });
      await tx.posReturn.deleteMany({ where: byStore });
      await tx.posReturnItem.deleteMany({ where: byStoreProduct });
      await tx.orderItem.deleteMany({ where: { OR: [{ order: byStore }, byStoreProduct] } });
      await tx.order.deleteMany({ where: byStore });
      await tx.stockMovement.deleteMany({ where: { OR: [byStore, byStoreProduct] } });
      await tx.purchaseOrderItem.deleteMany({ where: { OR: [byStore, byStoreProduct] } });
      await tx.stockTransferItem.deleteMany({ where: { OR: [byStore, byStoreProduct] } });
      await tx.inventoryAdjustmentItem.deleteMany({ where: { OR: [byStore, byStoreProduct] } });
      await tx.stockTransfer.deleteMany({ where: byStore });
      await tx.posShift.deleteMany({ where: byStore });
      await tx.product.deleteMany({ where: byStore });
      await tx.category.deleteMany({ where: byStore });
      await tx.banner.deleteMany({ where: byStore });
      await tx.visit.deleteMany({ where: byStore });
      await tx.storeSettings.deleteMany({ where: byStore });
      await tx.balanceTransaction.deleteMany({ where: byStore });
      await tx.store.delete({ where: { id: storeId } });
      const others = await tx.store.count({ where: { userId: store.user.id } });
      if (others === 0) await tx.user.delete({ where: { id: store.user.id } });
    },
    { timeout: 60_000 },
  );
  console.log(`Removed "${SLUG}" and the demo account.`);
}

async function create() {
  if (await prisma.store.findUnique({ where: { slug: SLUG }, select: { id: true } })) {
    throw new Error(`A store already lives at "${SLUG}". Run with --remove first.`);
  }
  const taken = await prisma.product.findMany({ where: { slug: { in: PRODUCTS.map((p) => `${SLUG}-${p.slug}`) } }, select: { slug: true } });
  if (taken.length) throw new Error(`Product slugs already taken: ${taken.map((t) => t.slug).join(", ")}`);

  const plan = await prisma.plan.findFirst({ where: { key: "PLATINUM" }, select: { id: true } });
  const password = randomBytes(12).toString("base64url");
  const hash = await argon2.hash(password, { type: argon2.argon2id, memoryCost: 65536, timeCost: 3, parallelism: 4 });
  const now = Date.now();
  const yearOut = new Date(now + 365 * DAY);

  const owner =
    (await prisma.user.findUnique({ where: { email: OWNER_EMAIL }, select: { id: true } })) ??
    (await prisma.user.create({
      data: {
        email: OWNER_EMAIL,
        name: "قيراط — متجر تجريبي",
        password: hash,
        passwordAlgo: "argon2id",
        businessType: "مجوهرات وإكسسوارات",
        emailVerified: true,
        mustVerifyEmail: false,
      },
      select: { id: true },
    }));
  // An account left over from an earlier run gets a fresh password too.
  await prisma.user.update({ where: { id: owner.id }, data: { password: hash, passwordAlgo: "argon2id" } });

  const storeId = randomUUID();
  const catIds = Object.fromEntries(CATEGORIES.map((c) => [c.key, randomUUID()]));
  const productIds = Object.fromEntries(PRODUCTS.map((p) => [p.slug, randomUUID()]));

  await prisma.$transaction(
    async (tx) => {
      await tx.store.create({
        data: {
          id: storeId,
          name: "قيراط",
          slug: SLUG,
          userId: owner.id,
          subscriptionStatus: "ACTIVE",
          subscriptionEndsAt: yearOut,
          autoRenew: false,
          planSelected: true,
          ...(plan && { planId: plan.id }),
          onboardingCompleted: true,
          businessCategory: "مجوهرات وإكسسوارات",
          settings: {
            create: {
              themeId: "qirat",
              themeConfig: THEME_CONFIG,
              fontId: "ibm-plex-sans-arabic",
              navbarVariant: "centered",
              storeLanguage: "ar",
              shippingPrice: 6000,
              description: "مجوهرات دهب وفضة ولؤلؤ طبيعي، بنختار كل قطعة بإيدينا. ده متجر تجريبي من كاشو لعرض ثيم «كاشو قيراط»: المنتجات للعرض بس والطلبات منه مش هتتنفّذ.",
              announcementText: "متجر تجريبي لعرض ثيم كاشو قيراط — الطلبات مش هتتنفّذ | شحن مجاني فوق ٢٥٠٠ جنيه | علبة هدية مع كل قطعة",
              seoTitle: "قيراط — مجوهرات وإكسسوارات (متجر تجريبي)",
              seoDescription: "متجر تجريبي من كاشو لعرض ثيم «كاشو قيراط» للمجوهرات والإكسسوارات.",
              isIndexed: false,
              emailNewOrders: false,
              emailCustomerOrders: false,
              emailStoreAlerts: false,
            },
          },
        },
      });

      await tx.category.createMany({
        data: CATEGORIES.map((c, i) => ({ id: catIds[c.key], storeId, name: c.name, slug: c.key, image: c.image, createdAt: new Date(now - (90 - i) * DAY) })),
      });

      await tx.product.createMany({
        data: PRODUCTS.map((p, i) => {
          const images = p.images.map((id) => img(id));
          return {
            id: productIds[p.slug],
            storeId,
            categoryId: catIds[p.cat],
            name: p.name,
            slug: `${SLUG}-${p.slug}`,
            description: p.description,
            price: p.price,
            compareAtPrice: p.compareAt ?? null,
            image: images[0],
            images,
            brand: p.brand ?? null,
            stock: p.stock,
            sku: `QR-${String(i + 1).padStart(3, "0")}`,
            sizes: p.sizes ?? [],
            colors: p.colors ?? [],
            weight: p.weight / 1000, // kg
            isActive: true,
            isFeatured: Boolean(p.featured),
            createdAt: new Date(now - p.age * DAY),
          };
        }),
      });

      await tx.banner.createMany({
        data: BANNERS.map((b, i) => ({
          storeId,
          title: b.title,
          subtitle: b.subtitle,
          ctaLabel: b.cta,
          image: wide(b.photo),
          mobileImage: tall(b.photo),
          position: i,
          linkType: b.link.type,
          linkCategoryId: b.link.cat ? catIds[b.link.cat] : null,
        })),
      });

      await tx.shippingMethod.createMany({
        data: [
          { storeId, name: "القاهرة والجيزة", price: 6000, estimatedDays: 2, sortOrder: 0 },
          { storeId, name: "باقي المحافظات", price: 8500, estimatedDays: 4, sortOrder: 1 },
          { storeId, name: "شحن مؤمَّن للدهب والألماس", price: 15000, estimatedDays: 2, sortOrder: 2 },
        ],
      });

      await tx.productReview.createMany({
        data: REVIEWS.map(([slug, customerName, rating, title, content], i) => ({
          productId: productIds[slug],
          storeId,
          customerName,
          rating,
          title,
          content,
          verifiedPurchase: false,
          reviewDate: new Date(now - (2 + i * 2) * DAY),
        })),
      });
    },
    { timeout: 60_000 },
  );

  console.log(`Created "${SLUG}": ${CATEGORIES.length} categories, ${PRODUCTS.length} products, ${BANNERS.length} banners, ${REVIEWS.length} reviews.`);
  console.log(`Owner login: ${OWNER_EMAIL} / ${password}`);
}

try {
  await (process.argv.includes("--remove") ? remove() : create());
} finally {
  await prisma.$disconnect();
  await pool.end();
}

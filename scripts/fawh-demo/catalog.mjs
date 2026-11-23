// Catalog of the "fawh" showcase store (فوح): a perfume shop selling genuine
// designer fragrances, on the Casho Stage theme in its own blue.
//
// Real data: every product is a real fragrance, identified by eye on its photo;
// notes are the houses' published pyramids; prices are EGP as Egyptian
// retailers listed them in Nov 2026 (Amazon.eg, Noon, Jumia, Faces, Elghazawy,
// Ramfa Beauty) — a compareAt is the retailer's own struck-through price.
// Product.price is pounds, not piasters.
//
// Photos: Unsplash (free licence, hotlinked like the other showcase stores).
// Product shots are cropped square around the bottle with imgix focal points.

export const SLUG = "fawh";

const UNSPLASH = "https://images.unsplash.com/photo-";
/** Square product crop centred on the bottle. */
export const square = (id, [x, y] = [0.5, 0.5], size = 1100) =>
  `${UNSPLASH}${id}?w=${size}&h=${size}&fit=crop&crop=focalpoint&fp-x=${x}&fp-y=${y}&q=80&auto=format`;
/** The whole photo, for the gallery and banners. */
export const full = (id, w = 1600) => `${UNSPLASH}${id}?w=${w}&q=80&auto=format`;
export const wide = (id, [x, y] = [0.5, 0.5]) => `${UNSPLASH}${id}?w=2400&h=1350&fit=crop&crop=focalpoint&fp-x=${x}&fp-y=${y}&q=80&auto=format`;
export const tall = (id, [x, y] = [0.5, 0.5]) => `${UNSPLASH}${id}?w=1000&h=1500&fit=crop&crop=focalpoint&fp-x=${x}&fp-y=${y}&q=80&auto=format`;

export const CATEGORIES = [
  { key: "men", name: "عطور رجالي", photo: ["1523293182086-7651a899d37f", [0.57, 0.55]] },
  { key: "women", name: "عطور حريمي", photo: ["1541643600914-78b084683601", [0.5, 0.5]] },
  { key: "unisex", name: "للجنسين", photo: ["1654617058572-f1f473581778", [0.5, 0.55]] },
];

const pyramid = (top, heart, base) => `المقدمة: ${top}.\nالقلب: ${heart}.\nالقاعدة: ${base}.`;
const ORIGINAL = "أصلي بالكرتونة والسلوفان، ومعاه فاتورة.";

/**
 * price / compareAt in EGP (retailer prices, Nov 2026), weight in kg boxed,
 * age in days (under 30 = "جديد"), photo = [unsplash id, focal point].
 */
export const PRODUCTS = [
  // ── Men ──
  {
    slug: "bleu-de-chanel-edp-100", cat: "men", brand: "Chanel", featured: true, age: 40, stock: 7,
    name: "Bleu de Chanel EDP 100ml", price: 10950,
    photo: ["1523293182086-7651a899d37f", [0.57, 0.55]],
    description: `بلو دو شانيل أو دو بارفان، من تأليف جاك بولج سنة ٢٠١٤: خشبي عطري، أنضف وأدفى من الأو دو تواليت.\n\n${pyramid("جريب فروت، ليمون، نعناع، فلفل وردي", "جنزبيل، جوزة الطيب، ياسمين", "بخور، أرز، صندل، باتشولي، لابدانوم")}\n\n${ORIGINAL}`,
  },
  {
    slug: "versace-eros-edt-100", cat: "men", brand: "Versace", age: 70, stock: 14,
    name: "Versace Eros EDT 100ml", price: 3750,
    photo: ["1587017539504-67cfbddac569", [0.55, 0.5]],
    description: `فرزاتشي إيروس الكلاسيكي من ٢٠١٢: نعناع وتفاح أخضر على فانيليا، من أكتر العطور الرجالي مبيعًا في مصر.\n\n${pyramid("نعناع، تفاح أخضر، ليمون", "تونكا، أمبروكسان، جيرانيوم", "فانيليا مدغشقر، أرز، فيتيفر، طحلب البلوط")}\n\n${ORIGINAL}`,
  },
  {
    slug: "versace-eros-edp-100", cat: "men", brand: "Versace", age: 18, stock: 9,
    name: "Versace Eros EDP 100ml", price: 4900,
    photo: ["1624798956425-ef88fc12b540", [0.55, 0.5]],
    description: `إيروس أو دو بارفان (٢٠٢٠): نفس روح إيروس بس أغمق وأطول ثباتًا، بالجلد والصندل.\n\n${pyramid("نعناع، ليمون، يوسفي", "تفاح مسكّر، أمبروكسان، جيرانيوم، مريمية", "فانيليا، أرز، صندل، جلد، باتشولي")}\n\n${ORIGINAL}`,
  },
  {
    slug: "givenchy-gentleman-edp-100", cat: "men", brand: "Givenchy", age: 55, stock: 11,
    name: "Givenchy Gentleman EDP 100ml", price: 5000,
    photo: ["1588514912908-8f5891714f8d", [0.62, 0.5]],
    description: `جنتلمان جيفنشي أو دو بارفان (٢٠١٨): أوريس بودري على فانيليا سودا وباتشولي، شيك ومناسب للشغل والسهرة.\n\n${pyramid("فلفل أسود، لافندر", "أوريس", "فانيليا سوداء، باتشولي، بنزوين")}\n\n${ORIGINAL}`,
  },
  {
    slug: "ysl-myslf-edp-100", cat: "men", brand: "Yves Saint Laurent", age: 12, stock: 8,
    name: "YSL MYSLF EDP 100ml", price: 7399, compareAt: 8000,
    photo: ["1761845047498-56827f416735", [0.5, 0.45]],
    description: `مايسلف من إيف سان لوران (٢٠٢٣): أول عطر رجالي زهري من الدار، زهر البرتقال على أخشاب عنبرية.\n\n${pyramid("برغموت كالابريا", "زهر البرتقال التونسي", "باتشولي، أخشاب عنبرية")}\n\nالزجاجة قابلة لإعادة التعبئة. ${ORIGINAL}`,
  },

  // ── Women ──
  {
    slug: "chanel-no5-edp-100", cat: "women", brand: "Chanel", featured: true, age: 80, stock: 6,
    name: "Chanel N°5 EDP 100ml", price: 10500,
    photo: ["1541643600914-78b084683601", [0.5, 0.5]],
    description: `شانيل نمبر ٥: العطر الأشهر في العالم، من تأليف إرنست بو سنة ١٩٢١، والأو دو بارفان بتاعه من ١٩٨٦.\n\n${pyramid("ألدهيدات، يلانج يلانج، نيرولي، برغموت", "ياسمين، ورد، زنبق الوادي، أوريس", "صندل، فانيليا، فيتيفر، مسك")}\n\n${ORIGINAL}`,
  },
  {
    slug: "chanel-coco-noir-edp-100", cat: "women", brand: "Chanel", age: 65, stock: 4,
    name: "Chanel Coco Noir EDP 100ml", price: 10140,
    photo: ["1585218334450-afcf929da36e", [0.52, 0.55]],
    description: `كوكو نوار (٢٠١٢): الوجه الليلي لكوكو شانيل، ورد وباتشولي على بخور وتونكا.\n\n${pyramid("جريب فروت، برغموت", "ورد، ياسمين، نرجس، جيرانيوم", "باتشولي، صندل، تونكا، فانيليا، بخور")}\n\n${ORIGINAL}`,
  },
  {
    slug: "ysl-libre-edp-90", cat: "women", brand: "Yves Saint Laurent", featured: true, age: 30, stock: 10,
    name: "YSL Libre EDP 90ml", price: 6870, compareAt: 8900,
    photo: ["1723391962154-8a2b6299bc09", [0.5, 0.55]],
    description: `ليبر من إيف سان لوران (٢٠١٩): لافندر فرنسي مع زهر البرتقال المغربي، على فانيليا مدغشقر.\n\n${pyramid("لافندر، يوسفي، كشمش أسود", "لافندر، زهر البرتقال، ياسمين", "فانيليا مدغشقر، مسك، أرز، عنبر")}\n\n${ORIGINAL}`,
  },
  {
    slug: "armani-si-passione-edp-100", cat: "women", brand: "Giorgio Armani", age: 45, stock: 8,
    name: "Armani Sì Passione EDP 100ml", price: 7560, compareAt: 8700,
    photo: ["1693960794637-42e1cf5baa0b", [0.62, 0.45]],
    description: `سي باسيوني من جورجيو أرماني (٢٠١٧): فواكه وورد على فانيليا، في الزجاجة الحمرا.\n\n${pyramid("كشمش أسود، كمثرى، فلفل وردي، جريب فروت", "ورد، ياسمين، هيليوتروب", "فانيليا، أرز")}\n\n${ORIGINAL}`,
  },
  {
    slug: "valentino-born-in-roma-donna-edp-100", cat: "women", brand: "Valentino", age: 28, stock: 5,
    name: "Valentino Donna Born in Roma EDP 100ml", price: 7600,
    photo: ["1543422655-ac1c6ca993ed", [0.74, 0.55]],
    description: `دونا بورن إن روما (٢٠١٩): ياسمين وفانيليا بوربون في زجاجة الستادز المشهورة.\n\n${pyramid("كشمش أسود، فلفل وردي، برغموت", "ياسمين سامباك، ياسمين جراندي فلورم، شاي الياسمين", "فانيليا بوربون، كاشميران، خشب الجاياك")}\n\n${ORIGINAL}`,
  },
  {
    slug: "marc-jacobs-daisy-edt-100", cat: "women", brand: "Marc Jacobs", age: 90, stock: 9,
    name: "Marc Jacobs Daisy EDT 100ml", price: 7215, compareAt: 9620,
    photo: ["1763986665850-6e66549aa8e0", [0.5, 0.52]],
    description: `ديزي من مارك جيكوبس (٢٠٠٧): فريش وزهري وخفيف، بالغطا اللي على شكل وردة الديزي.\n\n${pyramid("فراولة، ورق البنفسج، جريب فروت أحمر", "جاردينيا، بنفسج، ياسمين", "مسك، فانيليا، أخشاب بيضا")}\n\n${ORIGINAL}`,
  },
  {
    slug: "gucci-guilty-pour-femme-edt-90", cat: "women", brand: "Gucci", age: 60, stock: 7,
    name: "Gucci Guilty Pour Femme EDT 90ml", price: 5900,
    photo: ["1619007556336-4d99b008471e", [0.5, 0.36]],
    description: `جوتشي جيلتي بور فام (٢٠١٠): يوسفي وفلفل وردي مع الليلك والخوخ على عنبر وباتشولي.\n\n${pyramid("يوسفي، فلفل وردي", "ليلك، خوخ، جيرانيوم", "عنبر، باتشولي")}\n\n${ORIGINAL}`,
  },

  // ── Unisex ──
  {
    slug: "tom-ford-ombre-leather-edp-100", cat: "unisex", brand: "Tom Ford", featured: true, age: 8, stock: 3,
    name: "Tom Ford Ombré Leather EDP 100ml", price: 11200,
    photo: ["1654617058572-f1f473581778", [0.5, 0.55]],
    description: `أومبريه ليذر من توم فورد (٢٠١٨): جلد ناعم وهيل على عنبر وطحلب، للجنسين.\n\n${pyramid("هيل", "جلد، ياسمين سامباك", "عنبر، طحلب، باتشولي")}\n\n${ORIGINAL}`,
  },
];

/** Hero (first) + Stage's two-up tiles; photos placed so the copy sits on the dark top. */
export const BANNERS = [
  { title: "Bleu de Chanel", subtitle: "الأو دو بارفان الأصلي، بسعره في مصر.", cta: "اعرف أكتر", link: { product: "bleu-de-chanel-edp-100" }, wide: ["1698793916137-30f994d15133", [0.5, 0.44]], tall: ["1698793916137-30f994d15133", [0.5, 0.5]] },
  { title: "Coco Noir", subtitle: "ورد وباتشولي على بخور. للسهرة.", cta: "اشتري", link: { product: "chanel-coco-noir-edp-100" }, wide: ["1594035910387-fea47794261f", [0.5, 0.6]], tall: ["1594035910387-fea47794261f", [0.5, 0.6]] },
  { title: "Libre", subtitle: "لافندر وزهر برتقال. وفّر ٢٬٠٣٠ جنيه.", cta: "اشتري", link: { product: "ysl-libre-edp-90" }, wide: ["1598121496608-3d0b9627155e", [0.5, 0.45]], tall: ["1598121496608-3d0b9627155e", [0.5, 0.45]] },
  { title: "N°5", subtitle: "أشهر عطر في العالم من ١٩٢١.", cta: "اشتري", link: { product: "chanel-no5-edp-100" }, wide: ["1646032048835-b2a40ee0bede", [0.5, 0.5]], tall: ["1646032048835-b2a40ee0bede", [0.5, 0.5]] },
  { title: "Sì Passione", subtitle: "الزجاجة الحمرا من أرماني.", cta: "اشتري", link: { product: "armani-si-passione-edp-100" }, wide: ["1693960794591-fc7c72a15e9f", [0.5, 0.5]], tall: ["1693960794591-fc7c72a15e9f", [0.5, 0.5]] },
];

/** [product slug, name, rating, title, text] */
export const REVIEWS = [
  ["bleu-de-chanel-edp-100", "أحمد الشاذلي", 5, "أصلي فعلًا", "قارنت الكود اللي على الكرتونة بموقع شانيل وطلع سليم. الثبات أكتر من ٨ ساعات."],
  ["bleu-de-chanel-edp-100", "عمر فوزي", 5, null, "أحسن سعر لقيته للأو دو بارفان، ووصل في يومين مقفول بالسلوفان."],
  ["bleu-de-chanel-edp-100", "يوسف نبيل", 4, null, "العطر ممتاز، بس كنت أتمنى يكون فيه تقسيط."],
  ["versace-eros-edt-100", "كريم منصور", 5, null, "العطر اللي كل الناس بتسأل عليه. فوحانه قوي والسعر كويس جدًا."],
  ["versace-eros-edp-100", "مصطفى رشدي", 5, "أحسن من الـ EDT", "أغمق وأشيك، والثبات أطول بكتير. يستاهل الفرق في السعر."],
  ["givenchy-gentleman-edp-100", "حسن طارق", 5, null, "أوريس وفانيليا، ريحة شيك جدًا للشغل. خدت عليه كومبليمنتس كتير."],
  ["ysl-myslf-edp-100", "خالد إمام", 4, null, "ريحة نضيفة ومختلفة، بس محتاج رشتين تلاتة عشان يفوح."],
  ["chanel-no5-edp-100", "هبة الله محمد", 5, "كلاسيك", "هدية لماما في عيد ميلادها، الكرتونة والتغليف كانوا ممتازين."],
  ["chanel-no5-edp-100", "نادين سامي", 5, null, "أصلي ومختوم، ونفس الريحة اللي في الفري شوب بالظبط."],
  ["chanel-coco-noir-edp-100", "ريم حسام", 5, null, "عطر السهرة بتاعي. التوصيل كان سريع والتعامل محترم."],
  ["ysl-libre-edp-90", "سلمى رأفت", 5, "سعر ممتاز", "جبته في العرض ووفرت ألفين جنيه تقريبًا. أصلي ١٠٠٪."],
  ["ysl-libre-edp-90", "فرح جلال", 5, null, "اللافندر مع الفانيليا حلو جدًا، وثباته على الهدوم يومين."],
  ["armani-si-passione-edp-100", "دينا الشريف", 4, null, "ريحة حلوة وأنثوية، بس سكري شوية على الصيف."],
  ["valentino-born-in-roma-donna-edp-100", "منى صبري", 5, null, "الزجاجة تحفة على التسريحة، والياسمين ناعم جدًا."],
  ["marc-jacobs-daisy-edt-100", "مي عبدالله", 5, null, "خفيف ومنعش للجامعة والصيف."],
  ["gucci-guilty-pour-femme-edt-90", "إسراء ماهر", 4, null, "ريحة حلوة بس الثبات متوسط، حوالي ٥ ساعات."],
  ["tom-ford-ombre-leather-edp-100", "ياسر عبدالحميد", 5, "جلد بجد", "أومبريه ليذر من أحسن عطور الجلد، والسعر هنا أقل من أي مكان."],
  ["tom-ford-ombre-leather-edp-100", "شيماء فتحي", 5, null, "بلبسه أنا وجوزي الاتنين، فعلًا للجنسين."],
];

export const STORE_PHOTOS = {
  about: full("1624613533305-28d421d70875", 1600), // a shop shelf of designer bottles
  collections: [
    { name: "للرجالة", photo: ["1676305982764-0867908969b3", [0.5, 0.5]], link: "men" },
    { name: "للستات", photo: ["1582623105436-75d9f874d06b", [0.5, 0.5]], link: "women" },
    { name: "للجنسين", photo: ["1654617058572-f1f473581778", [0.5, 0.5]], link: "unisex" },
    { name: "كل العطور", photo: ["1720366788970-1f42a5e958dd", [0.55, 0.5]], link: "/products" },
  ],
  heroBanner: ["1654617058572-f1f473581778", [0.5, 0.5]],
};

/** Sources for the prices above (Nov 2026). */
export const PRICE_SOURCES = [
  "https://www.amazon.eg/-/en/Chanel-Bleu-Edp-100Ml/dp/B01LYUDIUM",
  "https://radwanelogail.net/categories/1537467/chanel",
  "https://www.noon.com/egypt-en/no-5-edp-for-women-100ml/N11200614A/p/",
  "https://www.amazon.eg/-/en/Chanel-NO-Women-Eau-Parfum/dp/B00K0GISDU",
  "https://elghazawy.com/en/product/168674/chanel-coco-noir-edp-100ml",
  "https://www.jumia.com.eg/versace-eros-mens-perfume-edt-100ml-134438510.html",
  "https://eg.pricena.com/en/product/versace-eros-for-men-price-in-egypt",
  "https://www.jumia.com.eg/givenchy-gentleman-eau-de-parfum-for-men-100-ml-123017249.html",
  "https://ramfabeauty.com/products/ysl-myslf-eau-de-parfum-men",
  "https://www.noon.com/egypt-en/libre-edp-90ml/N31126632A/p/",
  "https://www.noon.com/egypt-en/si-passione-edp-100ml/N19150908A/p/",
  "https://www.faces.eg/en/brands/valentino",
  "https://ramfabeauty.com/products/daisy-edt-l",
  "https://www.faces.eg/en/brands/gucci",
  "https://www.noon.com/egypt-en/ombre-leather-edp-100ml/N70290557V/p/",
];

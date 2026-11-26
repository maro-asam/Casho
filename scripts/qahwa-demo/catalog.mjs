// Catalog of the "qahwa" showcase store («قهوة»): a specialty coffee roastery
// on the Casho Bunn theme.
//
// Coffees are real origins with their usual processes, altitudes, varieties
// and the tasting notes those lots are known for; each coffee's details ride on
// Product.attributes (المنشأ، المعالجة، الارتفاع، التحميص، النكهات، التحضير…),
// which is what Bunn reads for its crop label, roast meter and coffee-belt map.
// Prices are EGP (Product.price is pounds, not piasters), in the range Egyptian
// specialty roasters and brewing-gear shops list in late 2026 — a demo, not a
// quote. Gear is named generically (no brand names).
//
// Photos: Unsplash (free licence, hotlinked like the other showcase stores),
// each picked by eye; none shows a coffee brand.

export const SLUG = "qahwa";

const UNSPLASH = "https://images.unsplash.com/photo-";
/** Square product crop around a focal point. */
export const square = (id, [x, y] = [0.5, 0.5], size = 1100) =>
  `${UNSPLASH}${id}?w=${size}&h=${size}&fit=crop&crop=focalpoint&fp-x=${x}&fp-y=${y}&q=80&auto=format`;
/** The whole photo, for galleries. */
export const full = (id, w = 1600) => `${UNSPLASH}${id}?w=${w}&q=80&auto=format`;
export const wide = (id, [x, y] = [0.5, 0.5]) => `${UNSPLASH}${id}?w=2400&h=1350&fit=crop&crop=focalpoint&fp-x=${x}&fp-y=${y}&q=80&auto=format`;
export const tall = (id, [x, y] = [0.5, 0.5]) => `${UNSPLASH}${id}?w=1000&h=1400&fit=crop&crop=focalpoint&fp-x=${x}&fp-y=${y}&q=80&auto=format`;

export const CATEGORIES = [
  { key: "specialty", name: "بن مختص", photo: ["1733860398142-65700ede69d2", [0.5, 0.5]] },
  { key: "espresso", name: "خلطات إسبريسو", photo: ["1507133750040-4a8f57021571", [0.5, 0.5]] },
  { key: "turkish", name: "قهوة تركي", photo: ["1506778020041-0ea35027d019", [0.3, 0.38]] },
  { key: "gear", name: "أدوات التحضير", photo: ["1741170112937-2b4c4bf639f2", [0.5, 0.5]] },
  { key: "mugs", name: "مجات وهدايا", photo: ["1775029676778-5a43b2edc4bd", [0.5, 0.55]] },
];

/** A coffee's details as the product form's «خصائص مخصصة» rows. */
const coffee = (d) =>
  [
    ["المنشأ", d.origin],
    ["المنطقة", d.region],
    ["المعالجة", d.process],
    ["الارتفاع", d.altitude],
    ["السلالة", d.variety],
    ["الحصاد", d.harvest],
    ["التحميص", d.roast],
    ["النكهات", d.notes],
    ["التحضير", d.brew],
    ["الوزن الصافي", d.weight ?? "250 جم"],
  ]
    .filter(([, v]) => v)
    .map(([key, value]) => ({ key, value }));

const gear = (rows) => Object.entries(rows).map(([key, value]) => ({ key, value }));

/**
 * price / compareAt in EGP, age in days (under 30 = "جديد"), photos = [main,
 * second] as [unsplash id, focal point], kg = shipping weight.
 */
export const PRODUCTS = [
  // ── Single origins ──
  {
    slug: "ethiopia-yirgacheffe", cat: "specialty", featured: true, age: 9, stock: 34, kg: 0.3,
    name: "إثيوبيا يرجاتشيفي", price: 720,
    photos: [["1695245503558-5cdb37f49092", [0.5, 0.55]], ["1513530176992-0cf39c4cbed4", [0.5, 0.5]]],
    attributes: coffee({ origin: "إثيوبيا", region: "يرجاتشيفي، جيديو", process: "مغسولة", altitude: "1,900–2,200 م", variety: "هيرلوم إثيوبي", harvest: "موسم 2025/26", roast: "فاتح", notes: "ياسمين، ليمون، شاي أسود", brew: "فلتر V60، كيمكس، كولد برو" }),
    description: "أخف وأنضف فنجان عندنا: زهري وحامضي زي كوباية شاي بالليمون. يرجاتشيفي من أشهر مناطق البن في العالم، وبنحمّصها فاتح عشان الياسمين يفضل باين.\n\nأحلى حاجة في V60 أو كيمكس، ومن غير لبن.",
  },
  {
    slug: "ethiopia-guji-natural", cat: "specialty", featured: true, age: 21, stock: 22, kg: 0.3,
    name: "إثيوبيا جوجي — طبيعية", price: 790,
    photos: [["1712402832925-d41c446883d3", [0.55, 0.55]], ["1540965555-ef9a836372ed", [0.5, 0.5]]],
    attributes: coffee({ origin: "إثيوبيا", region: "جوجي، أوروميا", process: "طبيعية (مجففة في الثمرة)", altitude: "2,000–2,300 م", variety: "هيرلوم إثيوبي", harvest: "موسم 2025/26", roast: "فاتح", notes: "توت أزرق، فراولة، شوكولاتة باللبن", brew: "فلتر V60، فرنش برس، كولد برو" }),
    description: "معالجة طبيعية: الحبة بتنشف جوه ثمرة البن، فبتطلع حلوة ومليانة فواكه. لو عمرك ما جربت قهوة طعمها توت، ابدأ بيها.",
  },
  {
    slug: "kenya-nyeri-aa", cat: "specialty", age: 48, stock: 18, kg: 0.3,
    name: "كينيا نيري AA", price: 840,
    photos: [["1562051036-e0eea191d42f", [0.5, 0.5]], ["1612487458970-564127ec86f5", [0.5, 0.5]]],
    attributes: coffee({ origin: "كينيا", region: "نيري، جبل كينيا", process: "مغسولة", altitude: "1,700–1,900 م", variety: "SL28، SL34", roast: "متوسط فاتح", notes: "كشمش أسود، جريب فروت، عسل", brew: "فلتر V60، إيروبريس" }),
    description: "كينيا معروفة بالحموضة اللامعة والطعم الكثيف. AA ده أكبر مقاس حبة في التصنيف الكيني. فنجان جريء وحلو في نفس الوقت.",
  },
  {
    slug: "colombia-huila", cat: "specialty", age: 60, stock: 40, kg: 0.3,
    name: "كولومبيا هويلا", price: 650,
    photos: [["1598198192305-46b0805890d3", [0.5, 0.5]], ["1580933073521-dc49ac0d4e6a", [0.5, 0.5]]],
    attributes: coffee({ origin: "كولومبيا", region: "هويلا", process: "مغسولة", altitude: "1,600–1,900 م", variety: "كاتورا، كاستيو", roast: "متوسط", notes: "كراميل، تفاح أحمر، كاكاو", brew: "فلتر V60، إسبريسو، فرنش برس" }),
    description: "القهوة اللي بتعجب الكل: متوازنة، حلوة ومش حامضة زيادة. تنفع فلتر الصبح وتنفع إسبريسو بعد الضهر.",
  },
  {
    slug: "colombia-decaf", cat: "specialty", age: 75, stock: 15, kg: 0.3,
    name: "كولومبيا ديكاف — منزوعة الكافيين", price: 690,
    photos: [["1605711599412-775918dbe770", [0.5, 0.5]], ["1447933601403-0c6688de566e", [0.5, 0.5]]],
    attributes: coffee({ origin: "كولومبيا", region: "توليما", process: "مغسولة، منزوعة الكافيين بقصب السكر", altitude: "1,500–1,800 م", variety: "كاستيو، كاتورا", roast: "متوسط", notes: "شوكولاتة باللبن، قصب السكر، برقوق", brew: "فلتر V60، إسبريسو، موكا" }),
    description: "كل طعم القهوة من غير سهر. الكافيين اتشال بطريقة طبيعية بمستخلص قصب السكر، من غير كيماويات.",
  },
  {
    slug: "brazil-cerrado", cat: "specialty", age: 90, stock: 52, kg: 0.3,
    name: "البرازيل سيرادو", price: 540, compareAt: 620,
    photos: [["1671225142630-6fd7deff0def", [0.5, 0.5]], ["1675306408031-a9aad9f23308", [0.5, 0.5]]],
    attributes: coffee({ origin: "البرازيل", region: "سيرادو، ميناس جيرايس", process: "طبيعية", altitude: "1,000–1,200 م", variety: "موندو نوفو، كاتواي", roast: "متوسط غامق", notes: "شوكولاتة، بندق، كراميل", brew: "إسبريسو، موكا، فرنش برس" }),
    description: "طعم القهوة الكلاسيكي اللي متعودين عليه بس أنضف: شوكولاتة وبندق وجسم تقيل. ممتازة مع اللبن.",
  },
  {
    slug: "guatemala-antigua", cat: "specialty", age: 34, stock: 26, kg: 0.3,
    name: "جواتيمالا أنتيجوا", price: 710,
    photos: [["1524350876685-274059332603", [0.5, 0.55]], ["1606486544554-164d98da4889", [0.5, 0.5]]],
    attributes: coffee({ origin: "جواتيمالا", region: "أنتيجوا", process: "مغسولة", altitude: "1,500–1,700 م", variety: "بوربون، كاتورا", roast: "متوسط", notes: "شوكولاتة داكنة، برتقال، قرفة", brew: "فلتر V60، فرنش برس، إسبريسو" }),
    description: "مزروعة في وادي بين تلات براكين، والتربة البركانية بتدّيها طعم غني ودافي. فنجان شتوي بامتياز.",
  },
  {
    slug: "costa-rica-tarrazu-honey", cat: "specialty", age: 14, stock: 20, kg: 0.3,
    name: "كوستاريكا تارازو — هاني", price: 780,
    photos: [["1587734195503-904fca47e0e9", [0.6, 0.5]], ["1551610290-e153ec567dd8", [0.5, 0.5]]],
    attributes: coffee({ origin: "كوستاريكا", region: "تارازو", process: "هاني (نص مغسولة)", altitude: "1,600–1,900 م", variety: "كاتواي، كاتورا", roast: "متوسط فاتح", notes: "عسل، مشمش، ليمون", brew: "فلتر V60، كيمكس" }),
    description: "معالجة «هاني»: بيسيبوا شوية من لب الثمرة على الحبة وهي بتنشف، فبتاخد حلاوة زي العسل من غير ما تبقى تقيلة.",
  },
  {
    slug: "yemen-haraz", cat: "specialty", featured: true, age: 6, stock: 8, kg: 0.3,
    name: "اليمن حرازي", price: 1450,
    photos: [["1690983326555-8b8e27843a32", [0.5, 0.5]], ["1755498208443-5d2b6180d934", [0.5, 0.5]]],
    attributes: coffee({ origin: "اليمن", region: "جبال حراز", process: "طبيعية", altitude: "2,000–2,400 م", variety: "أوديني، تفاحي", harvest: "موسم 2025", roast: "متوسط", notes: "تمر، زبيب، كاكاو، حبهان", brew: "فلتر V60، فرنش برس، قهوة تركي" }),
    description: "من المدرجات الجبلية اللي القهوة اتشربت فيها لأول مرة في التاريخ. كمية قليلة جدًا كل موسم، وطعمها فيه تمر وتوابل محدش يقدر يقلدها.",
  },
  {
    slug: "rwanda-nyamasheke", cat: "specialty", age: 40, stock: 16, kg: 0.3,
    name: "رواندا نياماشيكي", price: 760,
    photos: [["1780660231448-7f0aa4d236e9", [0.5, 0.5]], ["1625021659159-f63f546d74a7", [0.5, 0.5]]],
    attributes: coffee({ origin: "رواندا", region: "نياماشيكي، بحيرة كيفو", process: "مغسولة", altitude: "1,700–2,000 م", variety: "ريد بوربون", roast: "فاتح", notes: "كرز أحمر، برتقال، شاي", brew: "فلتر V60، كيمكس" }),
    description: "بن بوربون أحمر من على ضفاف بحيرة كيفو. نضيف وعصيري، وكل رشفة فيها فاكهة.",
  },
  {
    slug: "sumatra-mandheling", cat: "specialty", age: 120, stock: 24, kg: 0.3,
    name: "سومطرة ماندهيلنج", price: 680,
    photos: [["1652007762843-131e95e453d2", [0.5, 0.5]], ["1561986810-4f3ba2f46ceb", [0.5, 0.5]]],
    attributes: coffee({ origin: "إندونيسيا", region: "سومطرة الشمالية", process: "تقشير رطب (جيلينج باسه)", altitude: "1,100–1,500 م", variety: "تيم تيم، أتيك", roast: "غامق", notes: "شوكولاتة داكنة، تبغ، أعشاب", brew: "إسبريسو، فرنش برس، قهوة تركي" }),
    description: "تقيلة وترابية وحموضتها قليلة جدًا. لو بتحب القهوة الغامقة القوية، دي قهوتك.",
  },
  {
    slug: "panama-geisha", cat: "specialty", featured: true, age: 4, stock: 5, kg: 0.15,
    name: "بنما جيشا — إصدار محدود", price: 2150,
    photos: [["1540965555-ef9a836372ed", [0.55, 0.45]], ["1459755486867-b55449bb39ff", [0.5, 0.5]]],
    attributes: coffee({ origin: "بنما", region: "بوكيتي، تشيريكي", process: "مغسولة", altitude: "1,600–1,800 م", variety: "جيشا", harvest: "موسم 2025", roast: "فاتح جدًا", notes: "ياسمين، برغموت، خوخ، عسل", brew: "فلتر V60", weight: "100 جم" }),
    description: "الجيشا من أغلى وأندر أنواع البن في العالم: زهرية جدًا وحلوة وخفيفة زي الشاي. علبة ١٠٠ جم بس، لحد ما تخلص.",
  },

  // ── Espresso & blends ──
  {
    slug: "house-espresso", cat: "espresso", featured: true, age: 70, stock: 60, kg: 0.3,
    name: "خلطة البيت — إسبريسو", price: 560,
    photos: [["1459755486867-b55449bb39ff", [0.4, 0.5]], ["1447933601403-0c6688de566e", [0.5, 0.5]]],
    attributes: coffee({ origin: "البرازيل، كولومبيا، إثيوبيا", process: "طبيعية ومغسولة", roast: "متوسط غامق", notes: "شوكولاتة، بندق، كراميل، برتقال", brew: "إسبريسو، موكا، لاتيه وكابتشينو" }),
    description: "خلطتنا اليومية: البرازيل للجسم والشوكولاتة، وكولومبيا للحلاوة، ولمسة إثيوبي تدّيها روح. بتطلع شوت متوازن لوحده وممتاز مع اللبن.",
  },
  {
    slug: "latte-blend", cat: "espresso", age: 25, stock: 45, kg: 0.3,
    name: "خلطة اللاتيه", price: 540,
    photos: [["1760175445000-0e01e193d1cd", [0.5, 0.5]], ["1533776992670-a72f4c28235e", [0.5, 0.5]]],
    attributes: coffee({ origin: "البرازيل، إندونيسيا", process: "طبيعية وتقشير رطب", roast: "غامق", notes: "كاكاو، توفي، لوز", brew: "إسبريسو، لاتيه وكابتشينو، موكا" }),
    description: "معمولة مخصوص عشان تبان مع اللبن: جسم تقيل وطعم كاكاو مايختفيش تحت الحليب.",
  },
  {
    slug: "morning-filter-blend", cat: "espresso", age: 55, stock: 38, kg: 0.3,
    name: "خلطة الصبح — فلتر", price: 520,
    photos: [["1582768772255-7fb8066357ce", [0.5, 0.5]], ["1580933073521-dc49ac0d4e6a", [0.5, 0.5]]],
    attributes: coffee({ origin: "كولومبيا، إثيوبيا", process: "مغسولة", roast: "متوسط", notes: "شوكولاتة باللبن، تفاح، شاي", brew: "فلتر V60، فرنش برس، ماكينة قهوة فلتر" }),
    description: "كوباية الصبح اللي مش محتاجة تفكير: سهلة وحلوة ونضيفة، في الفلتر أو الفرنش برس.",
  },
  {
    slug: "cold-brew-blend", cat: "espresso", age: 11, stock: 28, kg: 0.55,
    name: "خلطة كولد برو", price: 980,
    photos: [["1759259639356-6eee63241869", [0.5, 0.5]], ["1671225142630-6fd7deff0def", [0.5, 0.5]]],
    attributes: coffee({ origin: "البرازيل، إثيوبيا", process: "طبيعية", roast: "متوسط", notes: "شوكولاتة، كرز، سكر بني", brew: "كولد برو", weight: "500 جم" }),
    description: "للصيف: بن مختار عشان يطلع حلو وناعم وهو بيتنقع في المية الساقعة ١٢–١٨ ساعة. كيس نص كيلو يعمل كمية كبيرة.",
  },

  // ── Turkish (already ground) ──
  {
    slug: "turkish-plain", cat: "turkish", age: 100, stock: 90, kg: 0.3,
    name: "بن تركي سادة", price: 250, colors: ["فاتح", "وسط", "غامق"],
    photos: [["1695593217066-1e663f8524db", [0.5, 0.5]], ["1762224234374-0d8c1a68cac7", [0.5, 0.5]]],
    attributes: coffee({ origin: "البرازيل، إثيوبيا", process: "طبيعية ومغسولة", notes: "شوكولاتة، مكسرات", brew: "قهوة تركي" }),
    description: "بن تركي مطحون ناعم زي البودرة، بنطحنه يوم الشحن. اختار درجة التحميص اللي بتحبها.",
  },
  {
    slug: "turkish-mohawwag", cat: "turkish", featured: true, age: 100, stock: 80, kg: 0.3,
    name: "بن تركي محوّج", price: 270, colors: ["فاتح", "وسط", "غامق"],
    photos: [["1787069791470-59cfc1dc5249", [0.5, 0.5]], ["1566346289644-4e9c3dce657d", [0.5, 0.5]]],
    attributes: coffee({ origin: "البرازيل، إثيوبيا", notes: "حبهان، قرنفل، شوكولاتة", brew: "قهوة تركي" }),
    description: "محوّج بالطريقة المصرية: حبهان وقرنفل وحبة مستكة. ريحته بتملا البيت أول ما الكنكة تسخن.",
  },
  {
    slug: "yemeni-cardamom", cat: "turkish", age: 18, stock: 30, kg: 0.3,
    name: "بن يمني مطحون بالحبهان", price: 360,
    photos: [["1661685249316-a06e692e1cb2", [0.5, 0.55]], ["1774529233247-d3f34ed11994", [0.5, 0.5]]],
    attributes: coffee({ origin: "اليمن", process: "طبيعية", roast: "متوسط", notes: "حبهان، تمر، كاكاو", brew: "قهوة تركي، دلة" }),
    description: "بن يمني مطحون مع حبهان كتير، للي بيحب القهوة العربي. اعملها في الكنكة أو الدلة.",
  },

  // ── Brewing gear ──
  {
    slug: "ceramic-dripper-02", cat: "gear", featured: true, age: 45, stock: 14, kg: 0.6,
    name: "قمع تقطير سيراميك مقاس 02", price: 1250,
    photos: [["1620051524363-5ce1bca4ec98", [0.45, 0.4]], ["1544421604-029b2ff95af1", [0.5, 0.5]]],
    attributes: gear({ "الخامة": "سيراميك", "السعة": "١–٤ أكواب", "يستخدم مع": "فلاتر مخروطية مقاس 02" }),
    description: "قمع تقطير مخروطي بخطوط حلزونية جوه بتخلّي المية تنزل بانتظام. السيراميك بيحافظ على الحرارة طول التحضير.",
  },
  {
    slug: "paper-filters-100", cat: "gear", age: 45, stock: 70, kg: 0.15,
    name: "فلاتر ورق للتقطير — ١٠٠ فلتر", price: 320,
    photos: [["1758773320985-f42feb1dcd36", [0.5, 0.35]], ["1741170112937-2b4c4bf639f2", [0.5, 0.5]]],
    attributes: gear({ "العدد": "١٠٠ فلتر", "المقاس": "02 مخروطي", "اللون": "أبيض بدون تبييض كلور" }),
    description: "فلاتر مخروطية رفيعة ماتدّيش طعم ورق. اشطفها بمية سخنة قبل الاستخدام.",
  },
  {
    slug: "glass-pour-over-6", cat: "gear", age: 30, stock: 9, kg: 1.1,
    name: "دورق تقطير زجاجي ٦ أكواب", price: 2850,
    photos: [["1761394196125-5b2ca434f328", [0.5, 0.5]], ["1771576741595-9819e22a6ff3", [0.5, 0.5]]],
    attributes: gear({ "الخامة": "زجاج بوروسيليكات وطوق خشب", "السعة": "٩٠٠ مل (٦ أكواب)" }),
    description: "قمع ودورق في قطعة واحدة: حط الفلتر، صب، وقدّم في نفس الدورق. شكله حلو على أي ترابيزة.",
  },
  {
    slug: "french-press-600", cat: "gear", age: 80, stock: 20, kg: 0.9,
    name: "فرنش برس ٦٠٠ مل", price: 780,
    photos: [["1708127368781-cd5f069a90a5", [0.5, 0.5]], ["1519082274554-1ca37fb8abb7", [0.5, 0.5]]],
    attributes: gear({ "الخامة": "زجاج وستانلس ستيل", "السعة": "٦٠٠ مل (٣–٤ أكواب)" }),
    description: "أسهل طريقة تعمل بيها قهوة غنية وتقيلة: بن خشن ومية سخنة و٤ دقايق. فلتر الستانلس بيسيب زيوت القهوة في الفنجان.",
  },
  {
    slug: "moka-pot-3", cat: "gear", age: 65, stock: 12, kg: 0.7,
    name: "موكا بوت ألومنيوم ٣ فناجين", price: 1650,
    photos: [["1638129284529-bed6d6f588e7", [0.5, 0.5]], ["1452415005154-c06158558480", [0.5, 0.5]]],
    attributes: gear({ "الخامة": "ألومنيوم", "السعة": "٣ فناجين (١٥٠ مل)", "يشتغل على": "البوتاجاز والسخان الكهربا" }),
    description: "قهوة قوية زي الإسبريسو على البوتاجاز. املاها بالبن من غير ضغط، وشيلها أول ما تفور.",
  },
  {
    slug: "gooseneck-kettle", cat: "gear", featured: true, age: 26, stock: 7, kg: 1.2,
    name: "غلاية ببوز رفيع ١ لتر", price: 1950, compareAt: 2300,
    photos: [["1592417766326-088bf3da80c5", [0.5, 0.55]], ["1768674150917-55b1ddf46a02", [0.5, 0.5]]],
    attributes: gear({ "الخامة": "ستانلس ستيل مطلي أسود", "السعة": "١ لتر", "يشتغل على": "البوتاجاز" }),
    description: "البوز الرفيع بيدّيك تحكم كامل في سرعة الصب، وده سر فنجان V60 الحلو.",
  },
  {
    slug: "coffee-scale-timer", cat: "gear", age: 33, stock: 11, kg: 0.5,
    name: "ميزان قهوة بمؤقت", price: 1350,
    photos: [["1620051524446-5160985790e1", [0.5, 0.6]], ["1620051787072-65526e7882b0", [0.5, 0.5]]],
    attributes: gear({ "الدقة": "٠٫١ جم", "الحد الأقصى": "٣ كجم", "الشحن": "USB-C" }),
    description: "وزن البن والمية بدقة وعدّاد للوقت في شاشة واحدة. الفرق بين فنجان حلو مرة وحلو كل مرة.",
  },
  {
    slug: "hand-grinder-steel", cat: "gear", featured: true, age: 12, stock: 6, kg: 0.8,
    name: "مطحنة بن يدوية بتروس ستانلس", price: 2950,
    photos: [["1758979645721-ad65bacd6708", [0.5, 0.5]], ["1741170112939-e972f019c81d", [0.5, 0.5]]],
    attributes: gear({ "التروس": "ستانلس ستيل مخروطية", "الطحنات": "من التركي للفرنش برس", "السعة": "٢٥ جم" }),
    description: "أهم أداة في ركن القهوة: البن بيفقد ريحته بسرعة بعد الطحن، فاطحن قبل التحضير على طول. طحنة منتظمة من الناعم للخشن.",
  },
  {
    slug: "wooden-grinder-classic", cat: "gear", age: 95, stock: 10, kg: 0.9,
    name: "مطحنة خشب كلاسيك", price: 950,
    photos: [["1573066516618-70e8e69506e7", [0.5, 0.5]], ["1573066380308-24ff4c273dbc", [0.5, 0.5]]],
    attributes: gear({ "الخامة": "خشب وحديد", "الدرج": "درج للبن المطحون" }),
    description: "مطحنة يدوية بالشكل القديم بدرج خشب. تنفع للتركي والإسبريسو، وشكلها ديكور لوحده.",
  },
  {
    slug: "copper-cezve", cat: "gear", age: 58, stock: 25, kg: 0.4,
    name: "كنكة نحاس مطروق", price: 420,
    photos: [["1632929427496-05e89b7e8550", [0.6, 0.45]], ["1576685880864-50b3b35f1c55", [0.5, 0.5]]],
    attributes: gear({ "الخامة": "نحاس مطروق ومبطّن قصدير", "السعة": "٢–٣ فناجين" }),
    description: "النحاس بيسخن بالتساوي، فالوش بيطلع تقيل وحلو. مبطّنة من جوه بالقصدير وآمنة على الأكل.",
  },

  // ── Mugs & gifts ──
  {
    slug: "ceramic-mug-350", cat: "mugs", age: 44, stock: 40, kg: 0.5,
    name: "مج سيراميك ٣٥٠ مل", price: 290,
    photos: [["1775029676778-5a43b2edc4bd", [0.5, 0.5]], ["1594075731547-8c705bb69e50", [0.5, 0.5]]],
    attributes: gear({ "الخامة": "سيراميك مزجّج", "السعة": "٣٥٠ مل", "يدخل": "غسالة الأطباق والميكروويف" }),
    description: "مج تقيل بيحافظ على سخونة القهوة، بألوان هادية مطفية.",
  },
  {
    slug: "cappuccino-cup", cat: "mugs", age: 16, stock: 30, kg: 0.6,
    name: "فنجان كابتشينو بالطبق ١٨٠ مل", price: 380,
    photos: [["1533776992670-a72f4c28235e", [0.5, 0.5]], ["1507133750040-4a8f57021571", [0.5, 0.5]]],
    attributes: gear({ "الخامة": "بورسلين", "السعة": "١٨٠ مل" }),
    description: "الحجم المظبوط للكابتشينو والفلات وايت، وحوافه الواسعة بتخلّي رسمة اللاتيه تبان.",
  },
  {
    slug: "tasting-box", cat: "mugs", featured: true, age: 8, stock: 12, kg: 0.5,
    name: "بوكس تذوّق — ٣ محاصيل × ١٠٠ جم", price: 1150, compareAt: 1350,
    photos: [["1763924996486-aa3aeacaf15e", [0.5, 0.5]], ["1780660231448-7f0aa4d236e9", [0.5, 0.5]]],
    attributes: gear({ "جوّه البوكس": "إثيوبيا يرجاتشيفي، كولومبيا هويلا، البرازيل سيرادو", "المحتوى": "٣ أكياس × ١٠٠ جم", "الطحنة": "حبوب كاملة" }),
    description: "رحلة في تلات قارات: فنجان زهري، وفنجان متوازن، وفنجان شوكولاتة. هدية حلوة لأي حد بيحب القهوة.",
  },
];

export const BANNERS = [
  {
    title: "قهوة بتتحمّص على دفعات صغيرة",
    subtitle: "محاصيل مختارة من إثيوبيا لكولومبيا لليمن. اختار البن، واختار الطحنة، وإحنا نحمّص ونشحن.",
    cta: "شوف المحاصيل",
    wide: ["1717380047369-30d9b9ce95e5", [0.5, 0.5]],
    tall: ["1717380047369-30d9b9ce95e5", [0.5, 0.5]],
    link: { category: "specialty" },
  },
  {
    title: "اليمن حرازي رجع",
    subtitle: "كمية محدودة من جبال حراز: تمر وزبيب وحبهان.",
    cta: "اطلبه قبل ما يخلص",
    wide: ["1511537190424-bbbab87ac5eb", [0.5, 0.5]],
    tall: ["1511537190424-bbbab87ac5eb", [0.5, 0.5]],
    link: { product: "yemen-haraz" },
  },
  {
    title: "ركن القهوة في بيتك",
    subtitle: "قمع، غلاية، ميزان ومطحنة. كل اللي تحتاجه عشان تحضّرها صح.",
    cta: "أدوات التحضير",
    wide: ["1620051524347-854568bb2e0f", [0.5, 0.5]],
    tall: ["1620051524347-854568bb2e0f", [0.5, 0.5]],
    link: { category: "gear" },
  },
];

/** [product slug, name, rating, title, content] — reviews kept modest and specific. */
export const REVIEWS = [
  ["ethiopia-yirgacheffe", "منة الله صلاح", 5, "زي الشاي بالليمون فعلًا", "أول مرة أفهم يعني إيه قهوة زهرية. عملتها V60 بالنسبة اللي في الدليل وطلعت تحفة."],
  ["ethiopia-yirgacheffe", "عمر الدسوقي", 5, null, "الطحنة فلتر جات مظبوطة جدًا، والكيس لسه ريحته جامدة لما فتحته."],
  ["ethiopia-yirgacheffe", "نورهان ماهر", 4, null, "حلوة جدًا بس خفيفة عليا، المرة الجاية هجرب الجوجي."],
  ["ethiopia-guji-natural", "يوسف حمدي", 5, "طعم توت حقيقي", "مش مصدق إن القهوة ممكن يبقى طعمها كده. عملتها كولد برو وكانت أحلى من أي عصير."],
  ["ethiopia-guji-natural", "سارة عبد العزيز", 5, null, "ريحة الكيس لوحدها تستاهل. جربتها فرنش برس وطلعت حلوة ومليانة."],
  ["kenya-nyeri-aa", "كريم الشافعي", 5, null, "حموضة لامعة وحلاوة عسل. من أحسن الكيني اللي جربته في مصر."],
  ["colombia-huila", "مصطفى رجب", 5, "قهوتي اليومية", "متوازنة ومش حامضة، بعملها إسبريسو الصبح وفلتر بالليل."],
  ["colombia-huila", "داليا فوزي", 4, null, "حلوة وسعرها معقول. كنت عايزة الكيس يبقى فيه سوستة أحسن."],
  ["brazil-cerrado", "أحمد صبري", 5, null, "شوكولاتة وبندق زي ما مكتوب بالظبط، وممتازة مع اللبن."],
  ["yemen-haraz", "حسام النجار", 5, "تستاهل كل جنيه", "فيها تمر وتوابل وطعم طويل جدًا بعد الشرب. كمية قليلة فاشتريت كيسين."],
  ["yemen-haraz", "ريم أبو العلا", 5, null, "عملتها في الكنكة سادة من غير سكر وكانت حكاية."],
  ["panama-geisha", "طارق منصور", 5, "تجربة لازم تتعمل مرة", "خفيفة زي الشاي وريحة ياسمين وبرغموت. ١٠٠ جم بس بس تستاهل."],
  ["house-espresso", "محمود عادل", 5, null, "شوت متوازن وكريما حلوة على ماكينة البيت. خلصت تالت كيس."],
  ["house-espresso", "هاجر سامي", 4, null, "حلوة في اللاتيه جدًا، لوحدها شوية غامقة على ذوقي."],
  ["latte-blend", "إسلام مجدي", 5, null, "الكاكاو باين حتى مع لبن كتير، اللي كنت بدور عليه."],
  ["turkish-mohawwag", "أم يوسف", 5, "ريحة زمان", "التحويج مظبوط مش زيادة، وطحنة ناعمة جدًا والوش بيطلع تقيل."],
  ["turkish-mohawwag", "شريف عبد الله", 5, null, "اخترت وسط وطلعت أحسن من البن اللي كنت بجيبه من المحمصة اللي جنبي."],
  ["turkish-plain", "علا الجمال", 4, null, "بن حلو وناعم، المرة الجاية هجرب الغامق."],
  ["ceramic-dripper-02", "باسم فاروق", 5, null, "تقيل ومتين والصب منتظم. مع الغلاية أم بوز رفيع الموضوع بقى سهل."],
  ["gooseneck-kettle", "نادين حلمي", 5, null, "التحكم في الصب فرق جدًا في طعم الـ V60."],
  ["hand-grinder-steel", "عمرو الحسيني", 5, "أحسن حاجة اشتريتها للقهوة", "طحنة منتظمة جدًا من التركي للفرنش. ثابتة في الإيد ومش بتتعب."],
  ["coffee-scale-timer", "مي إبراهيم", 4, null, "دقيق وبيشحن USB-C، كنت أتمنى يبقى أصغر شوية."],
  ["tasting-box", "كريم وحنان", 5, "هدية عيد ميلاد", "التغليف شيك جدًا والتلات محاصيل مختلفين خالص عن بعض."],
  ["copper-cezve", "سلمى الشريف", 5, null, "شغل يدوي حلو والوش بيطلع أحسن من الكنكة الستانلس."],
];

/** Store-level photos (about, custom banner). */
export const STORE_PHOTOS = {
  about: square("1537130508299-46ab547b4be3", [0.5, 0.45], 1200),
  heroBanner: ["1610632380989-680fe40816c6", [0.5, 0.5]],
};

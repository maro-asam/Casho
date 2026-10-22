// Sample catalogs offered during onboarding, one per business type picked at
// registration. Plain data (no DB) so the onboarding page can preview a kit
// before the merchant chooses it.

const img = (id: string) => `https://images.unsplash.com/photo-${id}?w=800&q=75`;

export type DemoProduct = {
  name: string;
  /** EGP. */
  price: number;
  compareAt?: number;
  stock: number;
  /** Index into the kit's categories. */
  category: number;
  description: string;
  image: string;
  sizes?: string[];
  colors?: string[];
  digital?: boolean;
};

export type DemoKit = {
  id: string;
  categories: string[];
  products: DemoProduct[];
};

const FASHION: DemoKit = {
  id: "fashion",
  categories: ["رجالي", "حريمي"],
  products: [
    { name: "تيشيرت قطن بيزك", price: 350, compareAt: 450, stock: 60, category: 0, description: "قطن مصري ١٠٠٪، خامة تقيلة مش بتكش بعد الغسيل.", image: img("1521572163474-6864f9cf17ab"), sizes: ["S", "M", "L", "XL"], colors: ["أبيض", "أسود"] },
    { name: "هودي أوفر سايز", price: 750, compareAt: 950, stock: 25, category: 0, description: "هودي ميلتون مبطّن، قصة أوفر سايز مريحة للشتا.", image: img("1556821840-3a63f95609a7"), sizes: ["M", "L", "XL"], colors: ["رمادي", "أسود"] },
    { name: "بنطلون جينز سليم", price: 650, stock: 30, category: 0, description: "جينز ستريتش بقصة سليم فيت، بيلبس مع أي حاجة.", image: img("1542272604-787c3835535d"), sizes: ["30", "32", "34", "36"] },
    { name: "جاكيت شتوي", price: 1450, compareAt: 1800, stock: 4, category: 0, description: "جاكيت مبطّن ضد المية، دافي وخفيف.", image: img("1551488831-00ddcb6c6bd3"), sizes: ["M", "L", "XL"] },
    { name: "فستان سواريه", price: 1650, stock: 12, category: 1, description: "فستان شيفون طويل بحزام، مناسب للخروجات والمناسبات.", image: img("1595777457583-95e059d581b8"), sizes: ["S", "M", "L"], colors: ["أحمر"] },
    { name: "كوتشي رياضي", price: 1250, compareAt: 1500, stock: 18, category: 1, description: "نعل طبي مريح للمشي الطويل.", image: img("1542291026-7eec264c27ff"), sizes: ["38", "39", "40", "41", "42"] },
  ],
};

const ACCESSORIES: DemoKit = {
  id: "accessories",
  categories: ["مجوهرات", "إكسسوارات"],
  products: [
    { name: "خاتم فضة بفص زركون", price: 890, compareAt: 1100, stock: 15, category: 0, description: "فضة ٩٢٥ مدموغة، بييجي في علبة هدية.", image: img("1605100804763-247f67b3557e"), sizes: ["16", "17", "18"] },
    { name: "سلسلة بحجر كريستال", price: 650, stock: 20, category: 0, description: "سلسلة ستانلس مطلية دهب، مش بتسوّد.", image: img("1599643478518-a784e5dc4c8f") },
    { name: "ساعة كلاسيك", price: 1350, compareAt: 1700, stock: 10, category: 1, description: "ساعة بإطار معدن وأستيك جلد، ضد المية.", image: img("1523275335684-37898b6baf30") },
    { name: "شنطة يد جلد", price: 1150, stock: 3, category: 1, description: "جلد طبيعي بخياطة يدوي، فيها جيب داخلي بسوستة.", image: img("1548036328-c9fa89d128fa"), colors: ["بني", "أسود"] },
    { name: "نظارة شمس", price: 450, compareAt: 600, stock: 35, category: 1, description: "عدسات بولارايزد بحماية UV400.", image: img("1572635196237-14b3f281503f") },
  ],
};

const ELECTRONICS: DemoKit = {
  id: "electronics",
  categories: ["صوتيات", "إكسسوارات موبايل"],
  products: [
    { name: "سماعة هيدفون لاسلكي", price: 1850, compareAt: 2300, stock: 14, category: 0, description: "بلوتوث 5.3، بطارية ٤٠ ساعة وعزل ضوضاء.", image: img("1505740420928-5e560c06d30e") },
    { name: "إيربودز بعلبة شحن", price: 950, stock: 30, category: 0, description: "صوت ستيريو وتحكم باللمس، مقاومة للعرق.", image: img("1590658268037-6bf12165a8df") },
    { name: "سبيكر بلوتوث محمول", price: 1250, compareAt: 1500, stock: 8, category: 0, description: "صوت عالي وبيز قوي، ضد المية IPX7.", image: img("1608043152269-423dbba4e7e1") },
    { name: "ساعة سمارت", price: 1650, stock: 4, category: 1, description: "بتقيس النبض والنوم والخطوات، وبتعرض إشعارات الموبايل.", image: img("1546868871-7041f2a55e12"), colors: ["أسود"] },
    { name: "كيبورد لاسلكي", price: 750, stock: 22, category: 1, description: "كيبورد رفيع بيشحن، عربي وإنجليزي.", image: img("1587829741301-dc798b83add3") },
    { name: "جراب موبايل كربون", price: 250, compareAt: 350, stock: 50, category: 1, description: "رفيع ومقاوم للخدوش والوقعات.", image: img("1601593346740-925612772716") },
  ],
};

const FOOD: DemoKit = {
  id: "food",
  categories: ["بن ومشروبات", "حلويات ومخبوزات"],
  products: [
    { name: "بن محوّج ٢٥٠ جم", price: 220, stock: 40, category: 0, description: "تحميص وسط وطحن طازة على طلبك.", image: img("1559056199-641a0ac8b55e"), sizes: ["سادة", "محوّج"] },
    { name: "زيت زيتون بكر ١ لتر", price: 480, compareAt: 550, stock: 25, category: 0, description: "عصرة أولى على البارد من سيوة.", image: img("1474979266404-7eaacbcd87c5") },
    { name: "شاي ليمون مثلّج", price: 85, stock: 60, category: 0, description: "بيتعمل بالطلب، من غير مواد حافظة.", image: img("1556679343-c7306c1976bc") },
    { name: "علبة شوكولاتة هاند ميد", price: 390, compareAt: 450, stock: 5, category: 1, description: "شوكولاتة بلجيكي بالمكسرات، ١٢ قطعة.", image: img("1606312619070-d48b4c652a52") },
  ],
};

const BEAUTY: DemoKit = {
  id: "beauty",
  categories: ["عناية بالبشرة", "عناية بالشعر"],
  products: [
    { name: "غسول وش للبشرة الدهنية", price: 320, compareAt: 400, stock: 35, category: 0, description: "بينضّف من غير ما ينشّف البشرة، مناسب للاستخدام اليومي.", image: img("1620916566398-39f1143ab7be") },
    { name: "سيروم فيتامين سي", price: 550, stock: 4, category: 0, description: "بيوحّد لون البشرة وبيدّي نضارة من أول أسبوع.", image: img("1612817288484-6f916006741a") },
    { name: "صابون طبيعي هاند ميد", price: 120, stock: 80, category: 0, description: "زيت زيتون ولافندر، من غير كيماويات.", image: img("1600857544200-b2f666a9a2ec"), sizes: ["لافندر", "عسل", "فحم"] },
    { name: "ماسك ترميم الشعر", price: 420, compareAt: 500, stock: 20, category: 1, description: "بالكيراتين وزبدة الشيا للشعر المصبوغ والمتقصف.", image: img("1608248543803-ba4f8c70ae0b") },
  ],
};

const HOME: DemoKit = {
  id: "home",
  categories: ["ديكور", "إضاءة"],
  products: [
    { name: "شمعة معطّرة", price: 280, compareAt: 350, stock: 40, category: 0, description: "شمع صويا طبيعي، بتولّع ٤٠ ساعة.", image: img("1602874801007-bd458bb1b8b6"), sizes: ["فانيليا", "عود", "لافندر"] },
    { name: "زرعة صبار بالقصرية", price: 190, stock: 25, category: 0, description: "مش محتاجة رعاية، بتتسقي مرة كل أسبوعين.", image: img("1485955900006-10f4d324d411") },
    { name: "مج سيراميك", price: 160, stock: 60, category: 0, description: "سيراميك مطفي، ينفع في الميكروويف وغسالة الأطباق.", image: img("1514228742587-6b1558fcca3d") },
    { name: "مخدة فايبر فندقي", price: 350, stock: 30, category: 0, description: "فايبر سيليكون ٥٠×٧٠، ما بتفطسش.", image: img("1584100936595-c0654b55a2e2") },
    { name: "أباجورة أرضي", price: 1450, compareAt: 1750, stock: 3, category: 1, description: "ستاند معدن برأس متحركة، لمبة E27.", image: img("1507473885765-e6ed057f782c") },
  ],
};

const SPORTS: DemoKit = {
  id: "sports",
  categories: ["معدات", "إكسسوارات"],
  products: [
    { name: "مات يوجا ٨ مم", price: 450, compareAt: 550, stock: 30, category: 0, description: "مانع للانزلاق وسهل يتلف، معاه حزام.", image: img("1601925260368-ae2f83cf8b7f"), colors: ["أخضر", "موف", "أسود"] },
    { name: "طقم دمبل وأستيك مقاومة", price: 950, stock: 4, category: 0, description: "دمبلين ٣ كيلو + أستيك مقاومة بمقابض.", image: img("1584735935682-2f2b69dff9d2") },
    { name: "زمزمية حافظة للحرارة", price: 320, stock: 45, category: 1, description: "ستانلس ٧٥٠ مل، بتحافظ على البرودة ٢٤ ساعة.", image: img("1602143407151-7111542de6e8"), colors: ["أخضر", "أسود"] },
    { name: "كوتشي جري", price: 1350, compareAt: 1600, stock: 16, category: 1, description: "خفيف ونعل بيمتص الصدمات.", image: img("1542291026-7eec264c27ff"), sizes: ["40", "41", "42", "43", "44"] },
  ],
};

const BOOKS: DemoKit = {
  id: "books",
  categories: ["كتب", "أدوات مكتبية"],
  products: [
    { name: "ديوان شعر", price: 180, stock: 40, category: 0, description: "طبعة ورق شمواه بغلاف مقوّى.", image: img("1544947950-fa07a98d237f") },
    { name: "نوتة سلك A5", price: 95, compareAt: 120, stock: 70, category: 1, description: "١٢٠ ورقة سطر، ورق ٨٠ جرام.", image: img("1531346878377-a5be20888e57") },
    { name: "قلم جل أسود", price: 35, stock: 4, category: 1, description: "سن ٠٫٥ مم، كتابة ناعمة من غير تبقيع.", image: img("1583485088034-697b5bc54ccd") },
  ],
};

const KIDS: DemoKit = {
  id: "kids",
  categories: ["ألعاب"],
  products: [
    { name: "دبدوب قطيفة", price: 290, compareAt: 350, stock: 25, category: 0, description: "قطيفة ناعمة وآمنة للأطفال، ٤٠ سم.", image: img("1559454403-b8fb88521f11") },
    { name: "مكعبات تركيب ٥٠٠ قطعة", price: 550, stock: 18, category: 0, description: "بتنمّي الخيال والتركيز، من سن ٤ سنين.", image: img("1587654780291-39c9404d746b") },
    { name: "مجموعة روبوتات", price: 420, stock: 3, category: 0, description: "٦ روبوتات بتتحرك، بلاستيك آمن.", image: img("1558060370-d644479cb6f7") },
  ],
};

const DIGITAL: DemoKit = {
  id: "digital",
  categories: ["كورسات", "ملفات جاهزة"],
  products: [
    { name: "كورس تصميم السوشيال ميديا", price: 750, compareAt: 1200, stock: 0, category: 0, description: "١٢ درس فيديو من الصفر للاحتراف، بتتفرج عليهم في أي وقت.", image: img("1516321318423-f06f85e504b3"), digital: true },
    { name: "باكدج قوالب كانفا", price: 250, stock: 0, category: 1, description: "٥٠ قالب بوست وستوري جاهزين تعدل عليهم.", image: img("1499750310107-5fef28a66643"), digital: true },
    { name: "بلانر شهري PDF", price: 90, stock: 0, category: 1, description: "تطبعه أو تكتب عليه من التابلت.", image: img("1531346878377-a5be20888e57"), digital: true },
  ],
};

const CARS: DemoKit = {
  id: "cars",
  categories: ["قطع غيار", "إكسسوارات"],
  products: [
    { name: "طقم سير موتور", price: 1850, stock: 6, category: 0, description: "أصلي بضمان ٦ شهور، مع التركيب في الفرع.", image: img("1486262715619-67b85e0b08d3") },
    { name: "جلدة دركسيون", price: 250, compareAt: 320, stock: 40, category: 1, description: "جلد صناعي مانع للانزلاق، مقاس عالمي.", image: img("1449965408869-eaa3f722e40d") },
    { name: "شمع تلميع نانو سيراميك", price: 650, compareAt: 800, stock: 20, category: 1, description: "طبقة حماية للدهان بتعيش ٦ شهور، سهل تستخدمه في البيت.", image: img("1503376780353-7e6692767b70") },
  ],
};

/** Register's business types → kit. Anything unknown gets the fashion kit. */
const BY_BUSINESS_TYPE: Record<string, DemoKit> = {
  "ملابس وأزياء": FASHION,
  "إلكترونيات وتقنية": ELECTRONICS,
  "أغذية ومشروبات": FOOD,
  "صحة وجمال": BEAUTY,
  "منزل وديكور": HOME,
  "رياضة ولياقة": SPORTS,
  "كتب وتعليم": BOOKS,
  "مجوهرات وإكسسوارات": ACCESSORIES,
  "حرف يدوية": HOME,
  "خدمات رقمية": DIGITAL,
  "أطفال وألعاب": KIDS,
  "سيارات وقطع غيار": CARS,
};

export function demoKitFor(businessType: string | null | undefined): DemoKit {
  return BY_BUSINESS_TYPE[businessType?.trim() ?? ""] ?? FASHION;
}

export const DEMO_CUSTOMERS = [
  { name: "أحمد محمود", address: "١٢ شارع التحرير، الدقي", governorate: "giza" },
  { name: "سارة إبراهيم", address: "شارع ٩، المعادي", governorate: "cairo" },
  { name: "محمد خالد", address: "شارع الجمهورية، المنصورة", governorate: "dakahlia" },
  { name: "نورهان علي", address: "سموحة، شارع فوزي معاذ", governorate: "alexandria" },
  { name: "يوسف حسن", address: "التجمع الخامس، الحي الأول", governorate: "cairo" },
];

/** Marks everything the seeder creates, so it can be found and removed later. */
export const DEMO_SKU_PREFIX = "DEMO-";
export const DEMO_SESSION_PREFIX = "demo:";
export const DEMO_CUSTOMER_NOTE = "عميل تجريبي — اتضاف مع البيانات التجريبية";

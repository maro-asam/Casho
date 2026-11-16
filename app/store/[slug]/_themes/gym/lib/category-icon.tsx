import {
  Activity,
  Apple,
  Baby,
  Backpack,
  Beef,
  BicepsFlexed,
  BookOpen,
  Cake,
  Camera,
  Car,
  Carrot,
  Coffee,
  Cookie,
  CookingPot,
  Dumbbell,
  Fish,
  Flame,
  Flower2,
  Footprints,
  Gamepad2,
  Gem,
  Gift,
  Glasses,
  Hand,
  Headphones,
  HeartPulse,
  House,
  Lamp,
  Laptop,
  Leaf,
  Milk,
  PawPrint,
  Pill,
  Plug,
  Scale,
  Shirt,
  ShoppingBasket,
  Smartphone,
  Sofa,
  Sparkles,
  SprayCan,
  Tag,
  Timer,
  ToyBrick,
  Trophy,
  Tv,
  Watch,
  Waves,
  Wrench,
  Zap,
  type LucideIcon,
  type LucideProps,
} from "lucide-react";
import { createElement } from "react";

import { WHEY, anyOf } from "./coach";

// Categories without a photo get an icon picked from their name. Gym is used
// by stores in every field, so gym shelves (protein, pre-workout, plates,
// gloves…) come first, then the common shelves of other fields (phones,
// perfume, kids, kitchen…). First match wins: specific shelves before broad
// words. Anything else gets a plain tag. `u` flag: \p{L} keeps Arabic words
// whole ("جيم" but not "جيمنج").
const RULES: [RegExp, LucideIcon][] = [
  // Beauty before protein: "بروتين الشعر" is a hair treatment.
  [/شعر|كيراتين|بشرة|ميك ?اب|مكياج|تجميل|سيروم|كريمات|كريم(?![\p{L}])|\bhair|\bskin|make ?up|beauty|cosmetic|serum/iu, Sparkles],
  [/سناك|بروتين بار|شوفان|وجب|حلويات|snack|protein bars?|\bbars?\b|\boats?\b|\bmeals?\b/iu, Cookie],
  [anyOf(/بروتين/, WHEY, /كازين|protein|whey|casein|isolate/), Milk],
  [/كرياتين|ضخامة|تضخيم|عضل|جينر|\bmass\b|gainer|creatine|muscle/iu, BicepsFlexed],
  [/طاقة|بري ?و+رك|قبل التمرين|كافيين|pre.?workout|energy|caffeine/iu, Zap],
  [/حرق|تنشيف|تخسيس|دهون|كارنيتين|burner|shred|\bcut(ting)?\b|carnitine|\bfat\b/iu, Flame],
  [/أمينو|امينو|bcaa|eaa|glutamine|جلوتامين|ريكفري|استشفاء|recovery|amino/iu, Activity],
  [/فيتامين|معادن|أوميجا|اوميجا|زنك|ماغنيسيوم|vitamin|mineral|omega|zinc|magnesium/iu, Pill],
  [/مفاصل|صحة|قلب|joint|health|wellness|cardio/iu, HeartPulse],
  [/أوزان|اوزان|أثقال|اثقال|دمبل|دامبل|باربل|كيتل ?بل|بنش|جيم(?![\p{L}])|dumbbells?|barbells?|kettlebells?|weights|bumper|\bgym\b/iu, Dumbbell],
  [/جوانتي|قفاز|قبض|حزام|رباط|أربطة|ستراب|glove|grip|belt|strap|wrap/iu, Hand],
  [/شيكر|زجاج[ةا]|جردل|شنط|حقائب|محافظ|بورتبل|shaker|bottle|bags?\b|wallets?|gallon|luggage/iu, Backpack],
  // Before clothes: "footwear" / "eyewear" contain "wear".
  [/حذاء|أحذية|احذية|كوتشي|سنيكر|صنادل|شباشب|shoe|sneaker|footwear|sandals?|heels/iu, Footprints],
  [/نظار|glasses|eyewear/iu, Glasses],
  [/لبس|ملابس|تيشيرت|هودي|شورت|شرت|فساتين|فستان|عبايات|بلوزات|جاكيت|بناطيل|حجاب|wear|shirt|hoodie|shorts?\b|apparel|cloth|dress|jacket|\bcoats?\b|pants|jeans|fashion/iu, Shirt],
  [/ميزان|قياس|scale/iu, Scale],
  [/مشاية|عجلة|كارديو|حبل|treadmill|bike|\bropes?\b/iu, Timer],
  [/يوجا|مرونة|يوغا|yoga|\bmats?\b|stretch|foam/iu, Waves],
  [/بطول|كأس|ميدال|trophy|medal/iu, Trophy],
  // Other fields.
  // Before phones: "headphone" / "microphone" contain "phone".
  [/سماع|هيدفون|ايربودز|سبيكر|ميكروفون|headphone|earbud|earphone|airpods|speaker|microphone|audio/iu, Headphones],
  [/موبايل|موبيل|هاتف|هواتف|تليفون|جوال|[اآ]يفون|سامسونج|phone|mobile|iphone|android/iu, Smartphone],
  [/لاب ?توب|كمبيوتر|حاسب|laptop|computer|\bpcs?\b|macbook/iu, Laptop],
  [/شاحن|كابل|charger|cable|adapter/iu, Plug],
  [/شاش|تلفزيون|تليفزيون|\btvs?\b|television|monitor/iu, Tv],
  [/كاميرا|تصوير|camera|photo/iu, Camera],
  [/جيمنج|جيمينج|بلاي ?ستيشن|اكس ?بوكس|gaming|playstation|xbox|console|video ?games?/iu, Gamepad2],
  [/ساعات|ساعة|ساعه|watch/iu, Watch],
  [/مجوهرات|ذهب|فض[ةه]|خواتم|خاتم|سلاسل|حلق|اكسسوار|إكسسوار|jewel|\brings?\b|earrings?|necklaces?|bracelets?|accessor/iu, Gem],
  [/عطر|عطور|برفان|بارفان|بخور|مسك(?![\p{L}])|perfume|fragrance|parfum/iu, SprayCan],
  [/أطفال|اطفال|بيبي|رضع|مواليد|baby|kids|infant|toddler/iu, Baby],
  [/لعب|ألعاب|العاب|\btoys?\b|puzzle/iu, ToyBrick],
  [/هدايا|هدية|gift/iu, Gift],
  [/كتب|كتاب|روايات|رواية|مكتبة|قرطاسية|أدوات مكتبية|books?\b|novels?|stationery/iu, BookOpen],
  [/أثاث|اثاث|كنب|غرف نوم|furniture|sofa/iu, Sofa],
  [/إضاءة|اضاءة|نجف|لمبات|lighting|lamps?\b/iu, Lamp],
  [/مطبخ|طبخ|أواني|اواني|حلل|شواي|kitchen|cookware|grills?\b|bbq/iu, CookingPot],
  [/منزل|بيت(?![\p{L}])|ديكور|مفروشات|مفارش|ستائر|\bhome\b|decor|\bhouse/iu, House],
  [/قهوة|قهوه|شاي|coffee|\btea\b/iu, Coffee],
  [/تورت|كيك|مخبوزات|مخبز|cake|bakery/iu, Cake],
  [/لحوم|لحمة|دواجن|فراخ|meat|chicken|poultry/iu, Beef],
  [/أسماك|اسماك|سمك|بحري|fish|seafood/iu, Fish],
  [/خضار|خضروات|فاكهة|فواكه|vegetables?|fruits?|produce/iu, Carrot],
  [/أكل|طعام|زبدة|عسل|food|nutrition|butter/iu, Apple],
  [/طبيعي|أعشاب|اعشاب|عضوي|herb|natural|organic/iu, Leaf],
  [/بقالة|سوبر ?ماركت|منظفات|grocery|supermarket/iu, ShoppingBasket],
  [/حيوان|أليف|قطط|كلاب|\bpets?\b|\bcats?\b|\bdogs?\b/iu, PawPrint],
  [/سيار|عربيات|قطع غيار|\bcars?\b|automotive|auto ?parts/iu, Car],
  [/ورود|زهور|نباتات|بوكيه|flowers?|plants?/iu, Flower2],
  [/أدوات|ادوات|صيانة|\btools?\b|hardware/iu, Wrench],
];

export function categoryIcon(name: string): LucideIcon {
  return RULES.find(([re]) => re.test(name))?.[1] ?? Tag;
}

/** The icon for a category name (see `categoryIcon`). */
export function CategoryIcon({ name, ...props }: { name: string } & LucideProps) {
  return createElement(categoryIcon(name), props);
}

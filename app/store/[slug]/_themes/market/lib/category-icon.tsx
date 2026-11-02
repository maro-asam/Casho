import {
  Apple,
  Baby,
  Bean,
  Beef,
  CakeSlice,
  Candy,
  Carrot,
  Cherry,
  Cigarette,
  Coffee,
  Cookie,
  Croissant,
  CupSoda,
  Droplets,
  Egg,
  Fish,
  GlassWater,
  IceCreamCone,
  Leaf,
  Milk,
  Newspaper,
  PawPrint,
  Pill,
  Salad,
  ShoppingBasket,
  Smartphone,
  Snowflake,
  Soup,
  Sparkles,
  SprayCan,
  Wheat,
  type LucideIcon,
  type LucideProps,
} from "lucide-react";
import { createElement } from "react";

/** System-color family of an aisle's icon, like a home-screen app icon. */
export type AisleTone = "green" | "orange" | "red" | "blue" | "teal" | "brown" | "purple" | "pink" | "indigo" | "gray";

// Aisles without a photo get an icon and a color picked from their name, so a
// shop's shelves read at a glance. First match wins (specific before broad);
// anything else gets a basket.
const RULES: [RegExp, LucideIcon, AisleTone][] = [
  [/خضار|خضر|ورقيات|سلطة|vegetable|veggie|salad/i, Carrot, "green"],
  [/فاكهة|فواكه|fruit/i, Cherry, "pink"],
  [/طازج|fresh|produce/i, Salad, "green"],
  [/ألبان|البان|لبن|حليب|زبادي|dairy|milk|yogh?urt/i, Milk, "blue"],
  [/جبن|cheese/i, Milk, "orange"],
  [/بيض|egg/i, Egg, "orange"],
  [/لحم|لحوم|كبدة|meat|beef/i, Beef, "red"],
  [/فراخ|دواجن|chicken|poultry/i, Beef, "red"],
  [/سمك|أسماك|اسماك|تونة|fish|seafood|tuna/i, Fish, "teal"],
  [/مخبوزات|عيش|خبز|فينو|bakery|bread/i, Croissant, "brown"],
  [/حلويات|تورت|كيك|dessert|cake/i, CakeSlice, "pink"],
  [/شوكولات|شيكولات|لبان|candy|chocolate|sweets/i, Candy, "purple"],
  [/سناك|تسالي|شيبس|بسكويت|snack|chips|biscuit/i, Cookie, "orange"],
  [/آيس|ايس|مثلجات|ice ?cream/i, IceCreamCone, "pink"],
  [/مجمد|frozen/i, Snowflake, "blue"],
  [/قهوة|شاي|نسكافيه|coffee|tea/i, Coffee, "brown"],
  [/مياه|مية|ماء|water/i, GlassWater, "blue"],
  [/مشروب|عصير|غازي|بيبسي|كولا|drink|juice|soda|beverage/i, CupSoda, "red"],
  [/أرز|ارز|مكرونة|دقيق|سكر|زيت|rice|pasta|flour|sugar|oil/i, Wheat, "orange"],
  [/بقوليات|فول|عدس|bean|lentil/i, Bean, "brown"],
  [/معلبات|صلصة|شوربة|canned|sauce|soup/i, Soup, "red"],
  [/بهارات|توابل|عطارة|spice|herb/i, Leaf, "green"],
  [/بقالة|تموين|grocery|pantry|staples/i, ShoppingBasket, "orange"],
  [/منظف|تنظيف|غسيل|صابون|clean|detergent|laundry/i, SprayCan, "teal"],
  [/ورق|مناديل|tissue|paper towel/i, Droplets, "blue"],
  [/عناية|تجميل|شامبو|care|beauty|shampoo/i, Sparkles, "purple"],
  [/أطفال|اطفال|بيبي|حفاض|baby|diaper/i, Baby, "pink"],
  [/صيدلية|دواء|أدوية|فيتامين|pharmacy|vitamin/i, Pill, "red"],
  [/حيوانات|قطط|كلاب|pet|cat food|dog food/i, PawPrint, "brown"],
  [/سجاير|سجائر|دخان|تبغ|cigarette|tobacco/i, Cigarette, "gray"],
  [/كروت|شحن|رصيد|موبايل|recharge|mobile|phone/i, Smartphone, "indigo"],
  [/جرايد|جرائد|مجلات|صحف|newspaper|magazine/i, Newspaper, "gray"],
  [/تفاح|apple/i, Apple, "red"],
];

export function aisleOf(name: string): { icon: LucideIcon; tone: AisleTone } {
  const rule = RULES.find(([re]) => re.test(name));
  return rule ? { icon: rule[1], tone: rule[2] } : { icon: ShoppingBasket, tone: "orange" };
}

/** The icon for an aisle name (see `aisleOf`). */
export function CategoryIcon({ name, ...props }: { name: string } & LucideProps) {
  return createElement(aisleOf(name).icon, props);
}

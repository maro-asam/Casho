import {
  Activity,
  Apple,
  Backpack,
  BicepsFlexed,
  Cookie,
  Dumbbell,
  Flame,
  Footprints,
  Hand,
  HeartPulse,
  Leaf,
  Milk,
  Pill,
  Scale,
  Shirt,
  Timer,
  Trophy,
  Waves,
  Zap,
  type LucideIcon,
  type LucideProps,
} from "lucide-react";
import { createElement } from "react";

// Categories without a photo get an icon picked from their name, so a gym
// shop's shelves read at a glance (protein, pre-workout, plates, gloves…).
// First match wins (specific shelves before broad words like "مكملات");
// anything else gets a dumbbell.
const RULES: [RegExp, LucideIcon][] = [
  [/سناك|بروتين بار|شوفان|وجب|حلويات|snack|protein bars?|\bbars?\b|oat|meal/i, Cookie],
  [/بروتين|واي|كازين|protein|whey|casein|isolate/i, Milk],
  [/كرياتين|ضخامة|تضخيم|عضل|جينر|mass|gainer|creatine|muscle/i, BicepsFlexed],
  [/طاقة|بري ?و+رك|قبل التمرين|كافيين|pre.?workout|energy|caffeine/i, Zap],
  [/حرق|تنشيف|تخسيس|دهون|كارنيتين|burner|shred|cut|carnitine|fat/i, Flame],
  [/أمينو|امينو|bcaa|eaa|glutamine|جلوتامين|ريكفري|استشفاء|recovery|amino/i, Activity],
  [/فيتامين|معادن|أوميجا|اوميجا|زنك|ماغنيسيوم|vitamin|mineral|omega|zinc|magnesium/i, Pill],
  [/مفاصل|صحة|قلب|joint|health|wellness|cardio/i, HeartPulse],
  [/أكل|طعام|زبدة|عسل|food|nutrition|butter/i, Apple],
  [/طبيعي|أعشاب|اعشاب|عضوي|herb|natural|organic/i, Leaf],
  [/جوانتي|قفاز|قبض|حزام|رباط|أربطة|ستراب|glove|grip|belt|strap|wrap/i, Hand],
  [/شيكر|زجاج|جردل|شنط|شنطة|بورتبل|shaker|bottle|bag|gallon/i, Backpack],
  [/لبس|ملابس|تيشيرت|هودي|شورت|شرت|wear|shirt|hoodie|short|apparel|cloth/i, Shirt],
  [/حذاء|أحذية|احذية|كوتشي|سنيكر|shoe|sneaker|footwear/i, Footprints],
  [/ميزان|قياس|scale/i, Scale],
  [/مشاية|عجلة|كارديو|حبل|treadmill|bike|rope/i, Timer],
  [/يوجا|مرونة|يوغا|yoga|\bmats?\b|stretch|foam/i, Waves],
  [/بطول|كأس|ميدال|trophy|medal/i, Trophy],
];

export function categoryIcon(name: string): LucideIcon {
  return RULES.find(([re]) => re.test(name))?.[1] ?? Dumbbell;
}

/** The icon for a category name (see `categoryIcon`). */
export function CategoryIcon({ name, ...props }: { name: string } & LucideProps) {
  return createElement(categoryIcon(name), props);
}

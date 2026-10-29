import {
  Activity,
  Baby,
  Bandage,
  Droplets,
  Dumbbell,
  Eye,
  HeartPulse,
  Leaf,
  Pill,
  ShieldPlus,
  Smile,
  Sparkles,
  Stethoscope,
  Syringe,
  Tablets,
  Thermometer,
  type LucideIcon,
  type LucideProps,
} from "lucide-react";
import { createElement } from "react";

// Categories without a photo get an icon picked from their name, so a
// pharmacy's shelves read at a glance (vitamins, baby care, skin care…).
// First match wins (specific shelves before broad words like "عناية");
// anything else gets a medical shield.
const RULES: [RegExp, LucideIcon][] = [
  [/فيتامين|مكمل|معادن|أوميجا|اوميجا|vitamin|supplement|omega/i, Tablets],
  [/أطفال|اطفال|طفل|بيبي|رضع|رضيع|أمومة|امومة|حفاض|baby|kid|infant|mother/i, Baby],
  [/شعر|شامبو|hair|shampoo/i, Droplets],
  [/أسنان|اسنان|فم|معجون|dental|oral|tooth/i, Smile],
  [/عين|عيون|عدسات|eye|lens|optic/i, Eye],
  [/حرار|ترمومتر|thermo/i, Thermometer],
  [/حقن|سرنج|إبر|ابر|syringe|inject|needle/i, Syringe],
  [/أجهز|اجهز|قياس|ضغط|سكر|جلوكوز|device|monitor|glucose/i, Stethoscope],
  [/إسعاف|اسعاف|جروح|ضماد|شاش|first aid|bandage|wound/i, Bandage],
  [/قلب|heart|cardio/i, HeartPulse],
  [/رياض|لياقة|بروتين|sport|fitness|protein/i, Dumbbell],
  [/أعشاب|اعشاب|طبيعي|عضوي|herb|natural|organic/i, Leaf],
  [/دواء|أدوية|ادوية|علاج|مسكن|برد|كحة|medicine|drug|pharma|pain|cold/i, Pill],
  // Broad "care" words last, so "العناية بالفم" still gets the tooth.
  [/بشر|تجميل|مكياج|عناية|كريم|واقي|skin|beauty|care|cosmetic|derma/i, Sparkles],
  [/صحة|صحي|health|wellness/i, Activity],
];

export function categoryIcon(name: string): LucideIcon {
  return RULES.find(([re]) => re.test(name))?.[1] ?? ShieldPlus;
}

/** The icon for a category name (see `categoryIcon`). */
export function CategoryIcon({ name, ...props }: { name: string } & LucideProps) {
  return createElement(categoryIcon(name), props);
}

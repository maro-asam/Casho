import { ArrowDown, ArrowUp, Plus, type LucideIcon } from "lucide-react";

import type { PillTone } from "@/components/saas-page";
import type { OfferType } from "@/lib/offers/offer-pricing";
import { tr } from "@/lib/i18n/dashboard";

export const OFFER_TYPE_META: {
  value: OfferType;
  label: string;
  /** Short title for segmented controls and glyph captions. */
  title: string;
  short: string;
  tone: PillTone;
  icon: LucideIcon;
  /** System-color fill for the type glyph (an app-icon-like rounded square). */
  glyph: string;
  description: string;
}[] = [
  {
    value: "UPSELL",
    get label() { return tr("ترقية (Upsell)"); },
    get title() { return tr("ترقية"); },
    short: "Upsell",
    tone: "accent",
    icon: ArrowUp,
    glyph: "bg-linear-to-b from-[#8e86ff] to-(--sys-indigo)",
    get description() { return tr("أول ما العميل يضيف المنتج، نعرض عليه نسخة أحسن بدله — ولو وافق بنبدّلها في السلة."); },
  },
  {
    value: "CROSS_SELL",
    get label() { return tr("منتج مكمّل (Cross-sell)"); },
    get title() { return tr("منتج مكمّل"); },
    short: "Cross-sell",
    tone: "info",
    icon: Plus,
    glyph: "bg-linear-to-b from-primary/80 to-primary",
    get description() { return tr("منتج بيتشترى مع اللي اختاره — بيظهر بعد الإضافة وتحت السلة، ويتضاف جنبه."); },
  },
  {
    value: "DOWNSELL",
    get label() { return tr("بديل أوفر (Downsell)"); },
    get title() { return tr("بديل أوفر"); },
    short: "Downsell",
    tone: "warning",
    icon: ArrowDown,
    glyph: "bg-linear-to-b from-[#ffb340] to-(--sys-orange)",
    get description() { return tr("لو العميل رفض الترقية، نعرض عليه حاجة أرخص يضيفها بدل ما يمشي من غيرها."); },
  },
];

export function offerTypeMeta(type: OfferType) {
  return OFFER_TYPE_META.find((m) => m.value === type) ?? OFFER_TYPE_META[1];
}

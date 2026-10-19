import type { PillTone } from "@/components/saas-page";
import type { OfferType } from "@/lib/offers/offer-pricing";
import { tr } from "@/lib/i18n/dashboard";

export const OFFER_TYPE_META: { value: OfferType; label: string; short: string; tone: PillTone; description: string }[] = [
  {
    value: "UPSELL",
    get label() { return tr("ترقية (Upsell)"); },
    short: "Upsell",
    tone: "accent",
    get description() { return tr("أول ما العميل يضيف المنتج، نعرض عليه نسخة أحسن بدله — ولو وافق بنبدّلها في السلة."); },
  },
  {
    value: "CROSS_SELL",
    get label() { return tr("منتج مكمّل (Cross-sell)"); },
    short: "Cross-sell",
    tone: "info",
    get description() { return tr("منتج بيتشترى مع اللي اختاره — بيظهر بعد الإضافة وتحت السلة، ويتضاف جنبه."); },
  },
  {
    value: "DOWNSELL",
    get label() { return tr("بديل أوفر (Downsell)"); },
    short: "Downsell",
    tone: "warning",
    get description() { return tr("لو العميل رفض الترقية، نعرض عليه حاجة أرخص يضيفها بدل ما يمشي من غيرها."); },
  },
];

export function offerTypeMeta(type: OfferType) {
  return OFFER_TYPE_META.find((m) => m.value === type) ?? OFFER_TYPE_META[1];
}

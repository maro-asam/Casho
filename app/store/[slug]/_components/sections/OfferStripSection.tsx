"use client";

import { Marquee } from "@/components/ui/marquee";
import type { OfferStripContent } from "@/types/store-theme.types";

const DEFAULT_ITEMS = [
  "🚚 توصيل سريع لجميع المحافظات",
  "✅ ضمان الاسترجاع خلال 30 يوم",
  "💳 الدفع عند الاستلام متاح",
  "🎁 هدية مجانية مع كل طلب",
];

type Props = {
  content?: OfferStripContent;
};

export default function OfferStripSection({ content }: Props) {
  const items = content?.items?.length ? content.items : DEFAULT_ITEMS;

  return (
    <div
      className="w-full overflow-hidden py-2.5 text-sm font-medium"
      style={{
        background: "var(--store-primary)",
        color: "var(--store-primary-foreground)",
      }}
    >
      <Marquee pauseOnHover repeat={3}>
        {items.map((item, i) => (
          <span key={i} className="mx-8 shrink-0 whitespace-nowrap">
            {item}
            <span className="mx-8 opacity-40">•</span>
          </span>
        ))}
      </Marquee>
    </div>
  );
}

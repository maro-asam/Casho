"use client";

import { Badge } from "@/components/ui/badge";
import { StockMovementType } from "@prisma/client";

const config: Record<StockMovementType, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  SALE: { label: "بيع", variant: "destructive" },
  RETURN: { label: "إرجاع", variant: "secondary" },
  PURCHASE: { label: "شراء", variant: "default" },
  ADJUSTMENT: { label: "تسوية", variant: "outline" },
  DAMAGE: { label: "تلف", variant: "destructive" },
  INITIAL: { label: "رصيد ابتدائي", variant: "secondary" },
  TRANSFER_IN: { label: "تحويل وارد", variant: "default" },
  TRANSFER_OUT: { label: "تحويل صادر", variant: "outline" },
  COUNT: { label: "جرد", variant: "secondary" },
  WRITE_OFF: { label: "شطب", variant: "destructive" },
};

export function StockMovementBadge({ type }: { type: StockMovementType }) {
  const c = config[type] ?? { label: type, variant: "outline" as const };
  return <Badge variant={c.variant}>{c.label}</Badge>;
}

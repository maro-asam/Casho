"use client";

import { Badge } from "@/components/ui/badge";
import { StockMovementType } from "@prisma/client";
import { tr } from "@/lib/i18n/dashboard";

const config: Record<StockMovementType, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  SALE: { get label() { return tr("بيع"); }, variant: "destructive" },
  RETURN: { get label() { return tr("إرجاع"); }, variant: "secondary" },
  PURCHASE: { get label() { return tr("شراء"); }, variant: "default" },
  ADJUSTMENT: { get label() { return tr("تسوية"); }, variant: "outline" },
  DAMAGE: { get label() { return tr("تلف"); }, variant: "destructive" },
  INITIAL: { get label() { return tr("رصيد ابتدائي"); }, variant: "secondary" },
  TRANSFER_IN: { get label() { return tr("تحويل وارد"); }, variant: "default" },
  TRANSFER_OUT: { get label() { return tr("تحويل صادر"); }, variant: "outline" },
  COUNT: { get label() { return tr("جرد"); }, variant: "secondary" },
  WRITE_OFF: { get label() { return tr("شطب"); }, variant: "destructive" },
};

export function StockMovementBadge({ type }: { type: StockMovementType }) {
  const c = config[type] ?? { label: type, variant: "outline" as const };
  return <Badge variant={c.variant}>{c.label}</Badge>;
}

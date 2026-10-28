import { Tag } from "@/components/saas-page";
import { tr } from "@/lib/i18n/dashboard";

type Props = {
  confidence: number;
  className?: string;
};

/** How sure the AI is that the conversation is an order. Always a label, never color alone. */
export function ConfidenceBadge({ confidence, className }: Props) {
  const pct = Math.round(confidence * 100);
  const tone = pct >= 85 ? "success" : pct >= 70 ? "warning" : "danger";
  return (
    <Tag tone={tone} className={className}>
      {tr("ثقة {0}%", pct)}
    </Tag>
  );
}

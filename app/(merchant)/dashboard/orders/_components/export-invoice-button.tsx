import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { tr } from "@/lib/i18n/dashboard";

/**
 * Opens the printable invoice (a real React page, so customer-entered text is
 * escaped) in a new tab and triggers the print dialog there.
 */
export default function ExportInvoiceButton({ orderId }: { orderId: string }) {
  return (
    <Button asChild variant="outline" className="h-9 gap-1.5">
      <a href={`/print/orders/${orderId}/invoice?print=1`} target="_blank" rel="noopener">
        <FileText className="size-4" />
        {tr("الفاتورة")}
      </a>
    </Button>
  );
}

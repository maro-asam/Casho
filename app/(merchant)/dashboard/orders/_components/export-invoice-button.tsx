import { FileText } from "lucide-react";
import { appleButton } from "@/components/saas-page";
import { tr } from "@/lib/i18n/dashboard";

/**
 * Opens the printable invoice (a real React page, so customer-entered text is
 * escaped) in a new tab and triggers the print dialog there.
 */
export default function ExportInvoiceButton({ orderId }: { orderId: string }) {
  return (
    <a href={`/print/orders/${orderId}/invoice?print=1`} target="_blank" rel="noopener" className={appleButton.gray}>
      <FileText className="size-4 text-muted-foreground" />
      {tr("الفاتورة")}
    </a>
  );
}

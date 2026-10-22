import { Download, ExternalLink, Lock } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export type DigitalItem = {
  id: string;
  name: string;
  /** Only passed once the order is paid — the link never reaches the page before that. */
  url: string | null;
  fileName: string | null;
};

/** Files and links of the digital products in an order, unlocked by payment. */
export function DigitalDownloads({ items, paid, canceled }: { items: DigitalItem[]; paid: boolean; canceled: boolean }) {
  if (items.length === 0 || canceled) return null;

  return (
    <Card className="rounded-[28px] border-primary/20">
      <CardHeader className="pb-4 text-right">
        <CardTitle className="flex items-center gap-2 text-lg">
          {paid ? <Download className="size-5 text-primary" /> : <Lock className="size-5 text-muted-foreground" />}
          {paid ? "منتجاتك الرقمية جاهزة" : "منتجاتك الرقمية"}
        </CardTitle>
        <CardDescription>
          {paid
            ? "نزّلها دلوقتي واحتفظ بنسخة — اللينك هيفضل موجود هنا في صفحة الطلب."
            : "روابط التحميل هتظهر هنا أول ما الدفع يتأكد."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-3 rounded-2xl bg-muted/50 p-3">
            <div className="min-w-0 flex-1 text-right">
              <p className="truncate font-medium">{item.name}</p>
              {item.fileName && <p className="truncate text-xs text-muted-foreground" dir="auto">{item.fileName}</p>}
            </div>
            {paid && item.url ? (
              <a
                href={item.url}
                target="_blank"
                rel="noreferrer"
                {...(item.fileName ? { download: item.fileName } : {})}
                className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              >
                {item.fileName ? <Download className="size-4" /> : <ExternalLink className="size-4" />}
                {item.fileName ? "تحميل" : "افتح"}
              </a>
            ) : (
              <span className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl bg-muted px-4 text-sm text-muted-foreground">
                <Lock className="size-4" />
                بعد الدفع
              </span>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

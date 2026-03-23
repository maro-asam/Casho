import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Gift, Download, Sparkles } from "lucide-react";
import Link from "next/link";

const StarterGuideCard = () => {
  return (
    <Card className="overflow-hidden rounded-22xl border bg-linear-to-l from-primary/10 via-background to-background shadow-sm">
      <CardContent className="flex flex-col gap-5 p-5 md:flex-row md:items-center md:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="rounded-full p-3 text-xs">
              <Gift className="ms-1 size-3.5" />
              هدية للتجار الجدد
            </Badge>

            <Badge
              variant="secondary"
              className="rounded-full p-3 text-xs"
            >
              PDF مجاني
            </Badge>
          </div>

          <div className="space-y-1">
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <Sparkles className="size-4 text-primary" />
              دليل البداية السريعة لمتجرك
            </h2>

            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              حمّل ملف PDF فيه خطوات عملية تساعدك تبدأ متجرك بشكل صح، من تجهيز
              المنتجات لحد تحسين المبيعات وتجهيز تجربة العميل.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link href="/files/merchant-starter-guide.pdf" target="_blank">
            <Button variant="outline" className="rounded-xl">
              <FileText className="me-2 size-4" />
              معاينة الملف
            </Button>
          </Link>

          <Link href="/files/merchant-starter-guide.pdf" download>
            <Button className="rounded-xl">
              <Download className="me-2 size-4" />
              تحميل الـ PDF
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export default StarterGuideCard;
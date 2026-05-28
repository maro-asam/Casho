import { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Phone } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "واتساب" };

export default function WhatsappIntegrationPage() {
  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon" className="rounded-xl">
          <Link href="/integrations">
            <ArrowRight className="size-5" />
          </Link>
        </Button>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold">واتساب</h1>
            <Badge variant="secondary" className="rounded-full border-0 bg-zinc-500/10 text-zinc-600 text-xs">
              قريباً
            </Badge>
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">
            اكتشاف الطلبات من محادثات واتساب البزنس تلقائياً
          </p>
        </div>
      </div>

      <Card className="border-border">
        <CardContent className="flex min-h-80 flex-col items-center justify-center p-8 text-center">
          <div className="mb-5 grid size-20 place-items-center rounded-2xl bg-linear-to-br from-green-500/10 to-emerald-500/10">
            <Phone className="size-9 text-green-500" />
          </div>

          <Badge className="mb-3 rounded-full border-0 bg-zinc-500/10 text-zinc-600 dark:text-zinc-400">
            قريباً
          </Badge>

          <h2 className="text-xl font-bold">واتساب بزنس</h2>
          <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
            ربط حسابك التجاري على واتساب لاستقبال وتحليل طلبات الرسائل تلقائياً بالذكاء الاصطناعي.
          </p>

          <ul className="mt-4 space-y-1.5 text-right">
            {[
              "تحليل محادثات واتساب البزنس",
              "اكتشاف الطلبات النصية والصوتية",
              "دعم القوائم والأزرار التفاعلية",
              "تكامل مع WhatsApp Business API",
            ].map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="size-1.5 rounded-full bg-muted-foreground/40" />
                {f}
              </li>
            ))}
          </ul>

          <Button disabled className="mt-6 rounded-xl" size="lg">
            ربط واتساب
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

import { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, MessageSquare } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Facebook Messenger" };

export default function FacebookIntegrationPage() {
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
            <h1 className="text-xl font-bold">Facebook Messenger</h1>
            <Badge variant="secondary" className="rounded-full border-0 bg-zinc-500/10 text-zinc-600 text-xs">
              قريباً
            </Badge>
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">
            اكتشاف الطلبات من رسائل Facebook Messenger تلقائياً
          </p>
        </div>
      </div>

      <ComingSoonCard
        icon={MessageSquare}
        name="Facebook Messenger"
        description="ربط صفحتك التجارية على Facebook لاستقبال وتحليل طلبات الرسائل تلقائياً بالذكاء الاصطناعي."
        features={[
          "تحليل محادثات Messenger تلقائياً",
          "اكتشاف الطلبات من الرسائل النصية",
          "دعم الرد الآلي على الاستفسارات",
          "تكامل مع صفحات Facebook Business",
        ]}
        gradient="from-blue-500/10 to-sky-500/10"
        iconColor="text-blue-500"
      />
    </div>
  );
}

function ComingSoonCard({
  icon: Icon,
  name,
  description,
  features,
  gradient,
  iconColor,
}: {
  icon: React.ComponentType<{ className?: string }>;
  name: string;
  description: string;
  features: string[];
  gradient: string;
  iconColor: string;
}) {
  return (
    <Card className="border-border">
      <CardContent className="flex min-h-80 flex-col items-center justify-center p-8 text-center">
        <div className={`mb-5 grid size-20 place-items-center rounded-2xl bg-linear-to-br ${gradient}`}>
          <Icon className={`size-9 ${iconColor}`} />
        </div>

        <Badge className="mb-3 rounded-full border-0 bg-zinc-500/10 text-zinc-600 dark:text-zinc-400">
          قريباً
        </Badge>

        <h2 className="text-xl font-bold">{name}</h2>
        <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
          {description}
        </p>

        <ul className="mt-4 space-y-1.5 text-right">
          {features.map((f) => (
            <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="size-1.5 rounded-full bg-muted-foreground/40" />
              {f}
            </li>
          ))}
        </ul>

        <Button disabled className="mt-6 rounded-xl" size="lg">
          ربط {name}
        </Button>
      </CardContent>
    </Card>
  );
}

import Link from "next/link";
import { Lock, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { tr } from "@/lib/i18n/dashboard";

const PLAN_DISPLAY_NAMES: Record<string, string> = {
  get silver() { return tr("سيلفر"); },
  get gold() { return tr("جولد"); },
  get platinum() { return tr("بلاتينيوم"); },
};

export function UpgradeRequiredCard({
  title,
  description,
  requiredPlanSlug,
  className,
}: {
  title: string;
  description?: string;
  requiredPlanSlug: string | null;
  className?: string;
}) {
  const requiredPlanLabel = requiredPlanSlug ? PLAN_DISPLAY_NAMES[requiredPlanSlug] ?? requiredPlanSlug : null;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Lock className="size-4" />
          </span>
          <CardTitle>{title}</CardTitle>
        </div>
        <CardDescription>
          {description ?? tr("هذه الميزة غير متاحة في باقتك الحالية.")}
          {requiredPlanLabel ? (
            <>
              {" "}{tr("متاحة من باقة")}{" "}
              <Badge variant="secondary" className="align-middle">
                {requiredPlanLabel}
              </Badge>{" "}{tr("وما فوق.")}
            </>
          ) : null}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild size="sm">
          <Link href={requiredPlanSlug ? `/change-plan?plan=${requiredPlanSlug}` : "/change-plan"}>
            <Sparkles className="size-4" />
            {tr("ترقية الباقة")}
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

import Link from "next/link";
import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const plans = [
  {
    name: "Pro",
    price: "499 جنيه",
    period: "/ شهريًا",
    badge: "قريبًا",
    features: [
      "كل مميزات Starter",
      "دومين مخصص",
      "إحصائيات متقدمة",
      "تخصيص أكبر للمتجر",
      "أولوية في الدعم",
    ],
    active: false,
  },
  {
    name: "Starter",
    price: "299 جنيه",
    period: "/ شهريًا",
    badge: "أفضل اختيار",
    features: [
      "متجر إلكتروني كامل",
      "رابط خاص لمتجرك",
      "إضافة منتجات بدون حدود",
      "استقبال الطلبات بسهولة",
      "طرق دفع مصرية",
      "لوحة تحكم بسيطة",
    ],
    active: true,
  },
  {
    name: "Business",
    price: "999 جنيه",
    period: "/ شهريًا",
    badge: "قريبًا",
    features: [
      "كل مميزات Pro",
      "تقارير متقدمة",
      "إدارة فريق",
      "تخصيصات أكبر",
      "دعم مخصص",
    ],
    active: false,
  },
];

const Pricing = () => {
  return (
    <section id="pricing" className="w-full py-20">
      <div className="mx-auto max-w-7xl px-6">
        {/* Title */}
        <div className="mb-14 text-center">
          <h2 className="text-3xl font-bold md:text-4xl">أسعار بسيطة وواضحة</h2>
          <p className="mt-4 text-muted-foreground">
            ابدأ الآن بالخطة المناسبة
          </p>
        </div>

        {/* Plans */}
        <div className="grid gap-8 lg:grid-cols-3 items-center">
          {plans.map((plan, index) => (
            <div key={index} className="relative">
              {!plan.active && (
                <div className="absolute inset-0 z-10 rounded-3xl bg-background/40 backdrop-blur-[2px]" />
              )}

              <Card
                className={`h-full rounded-3xl border shadow-sm transition
                ${
                  plan.active
                    ? "scale-105 border-primary shadow-lg"
                    : "opacity-70 blur-[1px] pointer-events-none"
                }`}
              >
                <CardHeader className="space-y-3 text-center">
                  <Badge
                    variant={plan.active ? "default" : "secondary"}
                    className="mx-auto"
                  >
                    {plan.badge}
                  </Badge>

                  <CardTitle className="text-2xl">{plan.name}</CardTitle>

                  <div className="text-4xl font-bold">
                    {plan.price}
                    <span className="text-sm text-muted-foreground">
                      {" "}
                      {plan.period}
                    </span>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {plan.features.map((feature, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm">
                      <Check className="h-4 w-4 text-primary" />
                      {feature}
                    </div>
                  ))}
                </CardContent>

                <CardFooter>
                  {plan.active ? (
                    <Button asChild size="lg" className="w-full">
                      <Link href="/register">ابدأ متجرك دلوقتي</Link>
                    </Button>
                  ) : (
                    <Button disabled size="lg" className="w-full">
                      قريبًا
                    </Button>
                  )}
                </CardFooter>
              </Card>
            </div>
          ))}
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          أول 50 متجر بسعر 300 جنيه فقط — بعد ذلك السعر سيكون 499 جنيه
        </p>
      </div>
    </section>
  );
};

export default Pricing;
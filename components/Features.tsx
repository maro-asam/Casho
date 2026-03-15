import {
  CreditCard,
  LayoutDashboard,
  Link as LinkIcon,
  Package,
  ShoppingBag,
  Smartphone,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: ShoppingBag,
    title: "متجر إلكتروني جاهز",
    description:
      "ابدأ بمتجر احترافي جاهز للبيع بدون تعقيد وبدون الحاجة لخبرة تقنية.",
  },
  {
    icon: LinkIcon,
    title: "رابط خاص لمتجرك",
    description:
      "احصل على لينك مخصص تقدر تشاركه بسهولة مع عملائك على فيسبوك وواتساب وإنستجرام.",
  },
  {
    icon: Package,
    title: "إدارة المنتجات بسهولة",
    description:
      "أضف منتجاتك وصورها وأسعارها بسرعة، وعدل عليها في أي وقت من لوحة التحكم.",
  },
  {
    icon: LayoutDashboard,
    title: "لوحة تحكم بسيطة",
    description: "تابع الطلبات ونظم متجرك من مكان واحد بواجهة سهلة وسريعة.",
  },
  {
    icon: CreditCard,
    title: "طرق دفع متعددة",
    description:
      "ادعم وسائل الدفع المناسبة للسوق المصري زي فودافون كاش وإنستا باي وفوري والدفع عند الاستلام.",
  },
  {
    icon: Smartphone,
    title: "متوافق مع الموبايل",
    description:
      "متجرك هيظهر بشكل ممتاز على الموبايل لأن أغلب عملاء السوشيال بيشتروا من الهاتف.",
  },
];

const Features = () => {
  return (
    <section id="features" className="w-full py-20">
      <div className="mx-auto  px-6">
        <div className="mb-14 text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            كل اللي تحتاجه عشان تبدأ <span className="text-primary">البيع</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            منصة مصممة للتجار اللي عايزين يبيعوا أونلاين بسرعة، بدون صداع
            الإعدادات المعقدة أو التكاليف الكبيرة.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {features.map((feature, index) => {
            const Icon = feature.icon;

            return (
              <Card
                key={index}
                className="rounded-2xl border-border/60 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-md"
              >
                <CardContent className="p-6">
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>

                  <h3 className="mb-3 text-lg font-semibold">
                    {feature.title}
                  </h3>

                  <p className="text-sm leading-7 text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Features;

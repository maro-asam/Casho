import {
  BadgeCheck,
  BrushCleaning,
  Clock3,
  FileText,
  Image as ImageIcon,
  LayoutTemplate,
  MessageCircleMore,
  PackagePlus,
  Palette,
  PenSquare,
  ShoppingBag,
  Sparkles,
  Store,
  ArrowUpLeft,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import RequestServiceDialog from "../../_components/RequestServiceDialog";

type ServiceItem = {
  id: string;
  title: string;
  description: string;
  price: string;
  duration: string;
  icon: React.ElementType;
  features: string[];
  popular?: boolean;
};

const brandingServices: ServiceItem[] = [
  {
    id: "logo-design",
    title: "تصميم لوجو",
    description: "لوجو بسيط واحترافي يخلي متجرك يبان كبراند من أول نظرة.",
    price: "يبدأ من 799 جنيه",
    duration: "2 - 4 أيام",
    icon: Palette,
    popular: true,
    features: ["لوجو احترافي", "نسخة مناسبة للبروفايل", "ألوان مناسبة للهوية"],
  },
  {
    id: "store-banner-design",
    title: "تصميم بنرات المتجر",
    description:
      "بنرات وكفرات احترافية للعروض والمنتجات بشكل يلفت العميل بسرعة.",
    price: "يبدأ من 599 جنيه",
    duration: "1 - 3 أيام",
    icon: BrushCleaning,
    features: [
      "بانر رئيسي للمتجر",
      "تصميم متناسق مع البراند",
      "جاهز للرفع فورًا",
    ],
  },
  {
    id: "store-setup-identity",
    title: "تجهيز هوية المتجر",
    description:
      "تجهيز ألوان وشكل بصري مناسب لمتجرك علشان يطلع بشكل منظم ومحترف.",
    price: "يبدأ من 999 جنيه",
    duration: "2 - 5 أيام",
    icon: LayoutTemplate,
    features: [
      "اختيار ألوان مناسبة",
      "تجهيز شكل بصري موحد",
      "تناسق أفضل للمتجر",
    ],
  },
];

const contentServices: ServiceItem[] = [
  {
    id: "content-creation",
    title: "صناعة محتوى",
    description: "محتوى جاهز للنشر يساعدك تعرض منتجاتك وتشد العملاء بشكل أفضل.",
    price: "يبدأ من 1499 جنيه",
    duration: "3 - 5 أيام",
    icon: PenSquare,
    popular: true,
    features: ["أفكار بوستات", "كابشنات جاهزة", "محتوى مناسب للجمهور"],
  },
  {
    id: "product-description",
    title: "كتابة وصف المنتجات",
    description:
      "كتابة وصف احترافي ومنظم للمنتجات بدل الوصف العشوائي أو الناقص.",
    price: "يبدأ من 499 جنيه",
    duration: "1 - 3 أيام",
    icon: FileText,
    features: ["وصف واضح وجذاب", "إبراز مميزات المنتج", "صياغة مناسبة للبيع"],
  },
  {
    id: "social-posts-package",
    title: "باكدج بوستات سوشيال",
    description:
      "بوستات جاهزة للنشر تساعدك تنشط صفحتك وتعرض منتجاتك بشكل أفضل.",
    price: "يبدأ من 1299 جنيه",
    duration: "3 - 6 أيام",
    icon: ImageIcon,
    features: ["أفكار + كابشن", "تنظيم المحتوى", "مناسب للسوشيال ميديا"],
  },
];

const operationServices: ServiceItem[] = [
  {
    id: "moderator",
    title: "ادارة البيزنس",
    description:
      "الرد على العملاء والاستفسارات بسرعة بدل ما الأوردرات تضيع وسط الرسائل.",
    price: "يبدأ من 2499 جنيه / شهريًا",
    duration: "خدمة شهرية",
    icon: MessageCircleMore,
    popular: true,
    features: [
      "الرد على الرسائل",
      "تنظيم الاستفسارات",
      "تسريع التواصل مع العملاء",
    ],
  },
  {
    id: "product-uploading",
    title: "رفع المنتجات",
    description:
      "نرفع المنتجات ونرتبها داخل المتجر بدل ما تضيع وقتك في الإدخال والتنسيق.",
    price: "يبدأ من 399 جنيه",
    duration: "حسب عدد المنتجات",
    icon: PackagePlus,
    features: [
      "إدخال المنتجات",
      "تنسيق الاسم والسعر",
      "ترتيب أفضل داخل المتجر",
    ],
  },

  {
    id: "monthly-store-management",
    title: "إدارة شهرية للمتجر",
    description:
      "مساعدة مستمرة في تشغيل المتجر وتنظيم المنتجات ومتابعة الشغل بشكل عام.",
    price: "حسب الاتفاق",
    duration: "خدمة شهرية",
    icon: Store,
    features: ["متابعة مستمرة", "تنظيم التشغيل", "مساعدة في إدارة المتجر"],
  },
];

function ServiceCard({
  service,
  storeId,
}: {
  service: ServiceItem;
  storeId?: string;
}) {
  const Icon = service.icon;

  return (
    <Card
      dir="rtl"
      className="group h-full rounded-3xl border-border/70 bg-background shadow-sm transition-all"
    >
      <CardHeader className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Icon className="size-5" />
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            {service.popular && (
              <Badge className="rounded-full px-3 py-1 text-xs">
                الأكثر طلبًا
              </Badge>
            )}
            <Badge
              variant="secondary"
              className="rounded-full px-3 py-1 text-xs"
            >
              خدمة إضافية
            </Badge>
          </div>
        </div>

        <div className="space-y-2 text-right">
          <CardTitle className="text-xl font-bold leading-8">
            {service.title}
          </CardTitle>
          <CardDescription className="text-right text-sm leading-7 text-muted-foreground">
            {service.description}
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="grid grid-cols-1 gap-3 rounded-2xl border border-border/60 bg-muted/30 p-4 sm:grid-cols-2">
          <div className="space-y-1 text-right">
            <p className="text-xs text-muted-foreground">السعر</p>
            <p className="font-semibold">{service.price}</p>
          </div>

          <div className="space-y-1 text-right">
            <p className="text-xs text-muted-foreground">مدة التنفيذ</p>
            <div className="flex items-center justify-end gap-2 font-semibold">
              <span>{service.duration}</span>
              <Clock3 className="size-4 text-primary" />
            </div>
          </div>
        </div>

        <div className="space-y-3 text-right">
          <p className="text-sm font-semibold">الخدمة تشمل:</p>

          <div className="space-y-2">
            {service.features.map((feature) => (
              <div
                key={feature}
                className="flex items-center justify-end gap-2 text-sm text-muted-foreground"
              >
                <span>{feature}</span>
                <BadgeCheck className="size-4 shrink-0 text-primary" />
              </div>
            ))}
          </div>
        </div>

        <RequestServiceDialog
          service={{ id: service.id, title: service.title }}
          storeId={storeId}
        />
      </CardContent>
    </Card>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div
      dir="rtl"
      className="mb-6 flex flex-col gap-4 rounded-3xl border border-border/60 bg-primary/10 p-5 md:flex-row md:items-center md:justify-between "
    >
      <div className="text-right">
        <h2 className="text-2xl font-bold text-primary">{title}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">
          {description}
        </p>
      </div>

      <div className="flex size-14 shrink-0 items-center justify-center self-end rounded-2xl bg-primary/10 text-primary md:self-auto">
        <Icon className="size-6" />
      </div>
    </div>
  );
}

const ServicesRoute = () => {
  return (
    <main className="wrapper py-8 md:py-12" dir="rtl">
      <section className="relative overflow-hidden rounded-[32px] border border-border/60 px-6 py-8 shadow-sm md:px-10 md:py-12">
        <div className="relative mx-auto max-w-4xl text-center">
          <Badge className="mb-4 rounded-full px-4 py-3 text-sm">
            <Sparkles className="size-4" />
            خدمات إضافية تساعدك تبيع أكتر
          </Badge>

          <h1 className="text-3xl font-extrabold leading-tight md:text-5xl">
            كل اللي متجرك محتاجه
            <span className="mt-2 block bg-linear-to-l from-primary to-sky-500 bg-clip-text text-transparent">
              في مكان واحد
            </span>
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-muted-foreground md:text-base">
            لو محتاج تجهز شكل متجرك، تعمل محتوى، ترفع منتجات، أو تتابع الرسائل
            والمبيعات، تقدر تطلب الخدمة المناسبة بسهولة ومن غير لخبطة.
          </p>
        </div>
      </section>

      <section className="mt-10 space-y-10">
        <section>
          <SectionHeader
            icon={Palette}
            title="خدمات الهوية والتأسيس"
            description="خدمات تساعدك تخلي متجرك شكله احترافي من البداية وتجهز البراند بشكل يدي ثقة أكبر للعميل."
          />

          <div className="grid gap-5 lg:grid-cols-3">
            {brandingServices.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        </section>

        <section>
          <SectionHeader
            icon={PenSquare}
            title="خدمات المحتوى"
            description="مناسبة للتاجر اللي محتاج يعرض منتجاته بشكل أحسن ويكون عنده محتوى جاهز يساعده في البيع والتسويق."
          />

          <div className="grid gap-5 lg:grid-cols-3">
            {contentServices.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        </section>

        <section>
          <SectionHeader
            icon={ShoppingBag}
            title="خدمات التشغيل والمبيعات"
            description="الخدمات دي تساعدك تشغل المتجر بشكل أسهل، تتابع العملاء، وتوفر وقتك في الحاجات اليومية المتكررة."
          />

          <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
            {operationServices.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        </section>
      </section>

      <section className="mt-12">
        <Card
          dir="rtl"
          className="rounded-[28px] border-border/60 bg-primary/5 shadow-sm"
        >
          <CardContent className="flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between md:p-8">
            <div className="text-right">
              <h3 className="text-2xl font-bold">عايز خدمة مخصصة؟</h3>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">
                لو محتاج خدمة مش موجودة فوق، زي إدارة إعلانات، تجهيز كامل
                للمتجر، أو باكدج مخصوص ليك، ابعت طلبك وهنراجع أنسب حل ليك.
              </p>
            </div>

            <Button size="lg" className="h-12 rounded-2xl px-6">
              اطلب خدمة مخصصة
              <ArrowUpLeft className="ms-2 size-4" />
            </Button>
          </CardContent>
        </Card>
      </section>
    </main>
  );
};

export default ServicesRoute;

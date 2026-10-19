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
  Store,
  ArrowUpLeft,
  Sparkles,
} from "lucide-react";
import { Metadata } from "next";

import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import RequestServiceDialog from "./_components/RequestServiceDialog";
import { lazyList, tdir, tr } from "@/lib/i18n/dashboard";
import { loadDashboardLocale } from "@/lib/i18n/dashboard/server";

export async function generateMetadata(): Promise<Metadata> {
  await loadDashboardLocale();
  return {
  title: tr("خدمات اضافية"),
  description: tr("خدمات إضافية تساعدك تبيع أكتر وتدير متجرك بشكل أسهل"),
};
}

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
    get title() { return tr("تصميم لوجو"); },
    get description() { return tr("لوجو بسيط واحترافي يخلي متجرك يبان كبراند من أول نظرة."); },
    get price() { return tr("يبدأ من 799 جنيه"); },
    get duration() { return tr("2 - 4 أيام"); },
    icon: Palette,
    popular: true,
    features: lazyList(["لوجو احترافي", "نسخة مناسبة للبروفايل", "ألوان مناسبة للهوية"]),
  },
  {
    id: "store-banner-design",
    get title() { return tr("تصميم بنرات المتجر"); },
    get description() { return tr("بنرات وكفرات احترافية للعروض والمنتجات بشكل يلفت العميل بسرعة."); },
    get price() { return tr("يبدأ من 599 جنيه"); },
    get duration() { return tr("1 - 3 أيام"); },
    icon: BrushCleaning,
    features: lazyList(["بانر رئيسي للمتجر", "تصميم متناسق مع البراند", "جاهز للرفع فورًا"]),
  },
  {
    id: "delete-powered-by-casho",
    get title() { return tr("إزالة يتم التشغيل بواسطة كاشو"); },
    get description() { return tr("إزالة شعار كاشو من المتجر تدي مظهر احترافي وتخلي البراند بتاعك هو البطل."); },
    get price() { return tr("150 ج.م"); },
    get duration() { return tr("شهريًا"); },
    icon: LayoutTemplate,
    features: lazyList(["إزالة شعار كاشو", "مظهر أكثر احترافية", "تجربة مستخدم أنظف"]),
  },
];

const contentServices: ServiceItem[] = [
  {
    id: "content-creation",
    get title() { return tr("صناعة محتوى"); },
    get description() { return tr("محتوى جاهز للنشر يساعدك تعرض منتجاتك وتشد العملاء بشكل أفضل."); },
    get price() { return tr("يبدأ من 1499 جنيه"); },
    get duration() { return tr("3 - 5 أيام"); },
    icon: PenSquare,
    popular: true,
    features: lazyList(["أفكار بوستات", "كابشنات جاهزة", "محتوى مناسب للجمهور"]),
  },
  {
    id: "product-description",
    get title() { return tr("كتابة وصف المنتجات"); },
    get description() { return tr("كتابة وصف احترافي ومنظم للمنتجات بدل الوصف العشوائي أو الناقص."); },
    get price() { return tr("يبدأ من 499 جنيه"); },
    get duration() { return tr("1 - 3 أيام"); },
    icon: FileText,
    features: lazyList(["وصف واضح وجذاب", "إبراز مميزات المنتج", "صياغة مناسبة للبيع"]),
  },
  {
    id: "social-posts-package",
    get title() { return tr("باكدج بوستات سوشيال"); },
    get description() { return tr("بوستات جاهزة للنشر تساعدك تنشط صفحتك وتعرض منتجاتك بشكل أفضل."); },
    get price() { return tr("يبدأ من 1299 جنيه"); },
    get duration() { return tr("3 - 6 أيام"); },
    icon: ImageIcon,
    features: lazyList(["أفكار + كابشن", "تنظيم المحتوى", "مناسب للسوشيال ميديا"]),
  },
];

const operationServices: ServiceItem[] = [
  {
    id: "moderator",
    get title() { return tr("إدارة البيزنس"); },
    get description() { return tr("الرد على العملاء والاستفسارات بسرعة بدل ما الأوردرات تضيع وسط الرسائل."); },
    get price() { return tr("يبدأ من 2499 جنيه / شهريًا"); },
    get duration() { return tr("خدمة شهرية"); },
    icon: MessageCircleMore,
    popular: true,
    features: lazyList(["الرد على الرسائل", "تنظيم الاستفسارات", "تسريع التواصل مع العملاء"]),
  },
  {
    id: "product-uploading",
    get title() { return tr("رفع المنتجات"); },
    get description() { return tr("نرفع المنتجات ونرتبها داخل المتجر بدل ما تضيع وقتك في الإدخال والتنسيق."); },
    get price() { return tr("يبدأ من 399 جنيه"); },
    get duration() { return tr("حسب عدد المنتجات"); },
    icon: PackagePlus,
    features: lazyList(["إدخال المنتجات", "تنسيق الاسم والسعر", "ترتيب أفضل داخل المتجر"]),
  },
  {
    id: "monthly-store-management",
    get title() { return tr("إدارة شهرية للمتجر"); },
    get description() { return tr("مساعدة مستمرة في تشغيل المتجر وتنظيم المنتجات بشكل عام."); },
    get price() { return tr("حسب الاتفاق"); },
    get duration() { return tr("خدمة شهرية"); },
    icon: Store,
    features: lazyList(["متابعة مستمرة", "تنظيم التشغيل", "مساعدة في إدارة المتجر"]),
  },
];

function ServiceCard({ service, storeId }: { service: ServiceItem; storeId?: string }) {
  const Icon = service.icon;

  return (
    <Card
      dir={tdir()}
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-2xl border transition-all duration-200",
        "hover:-translate-y-1 hover:shadow-lg p-0",
        service.popular
          ? "border-primary/30 shadow-sm shadow-primary/5"
          : "border-border/60",
      )}
    >
      {service.popular && (
        <div className="bg-primary px-4 py-1.5 text-center text-xs font-semibold text-primary-foreground">
          {tr("⭐ الأكثر طلبًا")}
        </div>
      )}

      <CardContent className="flex flex-1 flex-col gap-5 p-5">
        <div className="flex items-start gap-3">
          <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            <Icon className="size-5" />
          </div>
          <div className="min-w-0 flex-1 pt-0.5">
            <h3 className="font-bold leading-snug">{service.title}</h3>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              {service.description}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="rounded-lg bg-primary/10 px-3 py-1.5 text-sm font-semibold text-primary">
            {service.price}
          </span>
          <span className="flex items-center gap-1.5 rounded-lg bg-muted/60 px-3 py-1.5 text-sm text-muted-foreground">
            <Clock3 className="size-3.5 shrink-0" />
            {service.duration}
          </span>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {tr("الخدمة تشمل")}
          </p>
          <ul className="space-y-1.5">
            {service.features.map((feature) => (
              <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                <BadgeCheck className="size-4 shrink-0 text-primary" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-auto pt-1">
          <RequestServiceDialog
            service={{ id: service.id, title: service.title }}
            storeId={storeId}
          />
        </div>
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
    <div dir={tdir()} className="mb-5 flex items-center gap-3">
      <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
        <Icon className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-3">
          <h2 className="whitespace-nowrap text-base font-bold">{title}</h2>
          <div className="h-px flex-1 bg-border/60" />
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

export default async function ServicesRoute() {
  await loadDashboardLocale();
  const userId = await requireUserId();
  const store = await prisma.store.findFirst({
    where: { userId },
    select: { id: true },
  });

  return (
    <div className="space-y-10" dir={tdir()}>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden rounded-2xl border border-border/60 px-8 py-10 text-center shadow-sm">
        <div className="pointer-events-none absolute -start-20 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -end-20 bottom-0 h-48 w-48 rounded-full bg-sky-500/10 blur-3xl" />

        <div className="relative">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            <Sparkles className="size-3.5" />
            {tr("خدمات إضافية تساعدك تبيع أكتر")}
          </div>

          <h1 className="text-3xl font-extrabold leading-tight md:text-5xl">
            {tr("كل اللي متجرك محتاجه")}
            <span className="mt-2 block bg-linear-to-l from-primary to-sky-500 bg-clip-text text-transparent">
              {tr("في مكان واحد")}
            </span>
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-muted-foreground md:text-base">
            {tr("لو محتاج تجهز شكل متجرك، تعمل محتوى، ترفع منتجات، أو تتابع الرسائل والمبيعات، تقدر تطلب الخدمة المناسبة بسهولة ومن غير لخبطة.")}
          </p>
        </div>
      </section>

      {/* ── Branding ── */}
      <section>
        <SectionHeader
          icon={Palette}
          title={tr("خدمات الهوية والتأسيس")}
          description={tr("خدمات تساعدك تخلي متجرك شكله احترافي من البداية وتجهز البراند بشكل يدي ثقة أكبر للعميل.")}
        />
        <div className="grid gap-5 lg:grid-cols-3">
          {brandingServices.map((service) => (
            <ServiceCard key={service.id} service={service} storeId={store?.id} />
          ))}
        </div>
      </section>

      {/* ── Content ── */}
      <section>
        <SectionHeader
          icon={PenSquare}
          title={tr("خدمات المحتوى")}
          description={tr("مناسبة للتاجر اللي محتاج يعرض منتجاته بشكل أحسن ويكون عنده محتوى جاهز يساعده في البيع والتسويق.")}
        />
        <div className="grid gap-5 lg:grid-cols-3">
          {contentServices.map((service) => (
            <ServiceCard key={service.id} service={service} storeId={store?.id} />
          ))}
        </div>
      </section>

      {/* ── Operations ── */}
      <section>
        <SectionHeader
          icon={ShoppingBag}
          title={tr("خدمات التشغيل والمبيعات")}
          description={tr("الخدمات دي تساعدك تشغل المتجر بشكل أسهل، تتابع العملاء، وتوفر وقتك في الحاجات اليومية المتكررة.")}
        />
        <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
          {operationServices.map((service) => (
            <ServiceCard key={service.id} service={service} storeId={store?.id} />
          ))}
        </div>
      </section>

      {/* ── Custom CTA ── */}
      <section className="pb-4">
        <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-linear-to-l from-primary/8 via-background to-sky-500/5 p-8">
          <div className="pointer-events-none absolute -end-10 -top-10 h-40 w-40 rounded-full bg-sky-500/8 blur-3xl" />
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-xl font-bold">{tr("عايز خدمة مخصصة؟")}</h3>
              <p className="mt-2 max-w-xl text-sm leading-7 text-muted-foreground">
                {tr("لو محتاج خدمة مش موجودة فوق، زي إدارة إعلانات، تجهيز كامل للمتجر، أو باكدج مخصوص ليك، ابعت طلبك وهنراجع أنسب حل ليك.")}
              </p>
            </div>
            <Button size="lg" className="h-11 shrink-0 rounded-xl px-6">
              {tr("اطلب خدمة مخصصة")}
              <ArrowUpLeft className="ms-2 size-4" />
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

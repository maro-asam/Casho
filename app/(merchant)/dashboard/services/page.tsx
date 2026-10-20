import Link from "next/link";
import {
  BrushCleaning,
  FileText,
  Image as ImageIcon,
  Inbox,
  LayoutTemplate,
  MessageCircleMore,
  PackagePlus,
  Palette,
  PenSquare,
  Sparkles,
  Store,
} from "lucide-react";
import type { Metadata } from "next";
import type { ServiceRequestStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { Card, LargeTitle, Segmented, StatusText, readParam, type PillTone, type SearchParamsRecord } from "@/components/saas-page";
import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { cn } from "@/lib/utils";
import RequestServiceDialog from "./_components/RequestServiceDialog";
import { lazyIntl, lazyList, tdir, tr } from "@/lib/i18n/dashboard";
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

type Category = "branding" | "content" | "operations";

const CATEGORIES: { value: Category; label: string; description: string; tint: string }[] = [
  {
    value: "branding",
    get label() { return tr("خدمات الهوية والتأسيس"); },
    get description() { return tr("خدمات تساعدك تخلي متجرك شكله احترافي من البداية وتجهز البراند بشكل يدي ثقة أكبر للعميل."); },
    tint: "from-[#ff6b8b] to-[#d6336c]",
  },
  {
    value: "content",
    get label() { return tr("خدمات المحتوى"); },
    get description() { return tr("مناسبة للتاجر اللي محتاج يعرض منتجاته بشكل أحسن ويكون عنده محتوى جاهز يساعده في البيع والتسويق."); },
    tint: "from-[#ffb340] to-[#ff7a00]",
  },
  {
    value: "operations",
    get label() { return tr("خدمات التشغيل والمبيعات"); },
    get description() { return tr("الخدمات دي تساعدك تشغل المتجر بشكل أسهل، تتابع العملاء، وتوفر وقتك في الحاجات اليومية المتكررة."); },
    tint: "from-[#40c8e0] to-[#007aff]",
  },
];

const REQUEST_STATUS: Record<ServiceRequestStatus, { label: string; tone: PillTone }> = {
  PENDING: { get label() { return tr("قيد المراجعة"); }, tone: "warning" },
  CONTACTED: { get label() { return tr("تم التواصل"); }, tone: "info" },
  IN_PROGRESS: { get label() { return tr("جاري التنفيذ"); }, tone: "accent" },
  COMPLETED: { get label() { return tr("اتنفذت"); }, tone: "success" },
  CANCELED: { get label() { return tr("ملغي"); }, tone: "neutral" },
};

const df = lazyIntl.date({ timeZone: "Africa/Cairo", day: "numeric", month: "short", year: "numeric" });

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

const servicesFor = (cat: Category): ServiceItem[] =>
  cat === "branding" ? brandingServices : cat === "content" ? contentServices : operationServices;

/** App-icon tile: white glyph on the category gradient. */
function Glyph({ icon: Icon, tint, size = "md" }: { icon: React.ElementType; tint: string; size?: "md" | "lg" }) {
  return (
    <span
      aria-hidden
      className={cn(
        "grid shrink-0 place-items-center bg-linear-to-br text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]",
        tint,
        size === "md" ? "size-14 rounded-[14px]" : "size-16 rounded-[18px]",
      )}
    >
      <Icon className={size === "md" ? "size-7" : "size-8"} strokeWidth={1.8} />
    </span>
  );
}

type Defaults = { fullName?: string; phone?: string; storeLink?: string };

/** App Store style row: icon, name + tagline, price, GET-style capsule. */
function ServiceRow({ service, tint, storeId, defaults }: { service: ServiceItem; tint: string; storeId?: string; defaults: Defaults }) {
  return (
    <li className="flex items-center gap-4 px-5 py-4">
      <Glyph icon={service.icon} tint={tint} />
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-x-2 text-[17px] leading-[22px] font-semibold">
          {service.title}
          {service.popular && <span className="text-[12px] font-semibold text-(--sys-orange)">{tr("الأكثر طلبًا")}</span>}
        </p>
        <p className="mt-0.5 line-clamp-2 text-[13px] leading-[18px] text-muted-foreground">{service.description}</p>
        <p className="mt-1 text-[12px] text-muted-foreground">
          <span className="font-semibold text-foreground/80">{service.price}</span> · {service.duration}
        </p>
      </div>
      <RequestServiceDialog
        service={{ id: service.id, title: service.title, description: service.description, price: service.price, duration: service.duration, features: service.features }}
        glyph={<Glyph icon={service.icon} tint={tint} size="lg" />}
        storeId={storeId}
        defaults={defaults}
      />
    </li>
  );
}

export default async function ServicesRoute({ searchParams }: { searchParams?: Promise<SearchParamsRecord> }) {
  await loadDashboardLocale();
  const userId = await requireUserId();
  const params = await searchParams;
  const [store, user] = await Promise.all([
    prisma.store.findFirst({ where: { userId }, select: { id: true, slug: true } }),
    prisma.user.findUnique({ where: { id: userId }, select: { name: true, phone_number: true } }),
  ]);
  const requests = store
    ? await prisma.serviceRequest
        .findMany({
          where: { storeId: store.id },
          orderBy: { createdAt: "desc" },
          take: 5,
          select: { id: true, serviceTitle: true, status: true, createdAt: true },
        })
        .catch(() => [])
    : [];

  const defaults: Defaults = {
    fullName: user?.name ?? undefined,
    phone: user?.phone_number ?? undefined,
    storeLink: store ? buildStoreUrl(store.slug) : undefined,
  };
  const catParam = readParam(params, "cat");
  const active = CATEGORIES.find((c) => c.value === catParam)?.value;
  const shown = active ? CATEGORIES.filter((c) => c.value === active) : CATEGORIES;
  const featured = brandingServices[0];

  return (
    <div className="space-y-8" dir={tdir()}>
      <LargeTitle
        title={tr("خدمات اضافية")}
        subtitle={tr("خدمات إضافية تساعدك تبيع أكتر وتدير متجرك بشكل أسهل")}
        actions={<RequestServiceDialog trigger="custom" service={{ id: "custom", title: tr("خدمة مخصصة") }} storeId={store?.id} defaults={defaults} />}
      />

      {/* ── Today-style feature card ───────────────────────────── */}
      <section className="relative overflow-hidden rounded-[28px] bg-linear-to-br from-[#5e5ce6] via-[#007aff] to-[#40c8e0] p-7 text-white sm:p-10">
        <div aria-hidden className="pointer-events-none absolute -end-6 -bottom-10 hidden grid-cols-3 gap-3 opacity-90 md:grid">
          {[Palette, PenSquare, MessageCircleMore, PackagePlus, ImageIcon, FileText].map((Icon, i) => (
            <span key={i} className="grid size-20 rotate-[-8deg] place-items-center rounded-[22px] bg-white/15 backdrop-blur-sm">
              <Icon className="size-9" strokeWidth={1.6} />
            </span>
          ))}
        </div>
        <div className="relative max-w-xl space-y-3">
          <p className="flex items-center gap-1.5 text-[13px] font-semibold text-white/80">
            <Sparkles className="size-4" />
            {tr("خدمات إضافية تساعدك تبيع أكتر")}
          </p>
          <h2 className="text-[32px] leading-[38px] font-bold sm:text-[44px] sm:leading-[50px] ltr:tracking-[-0.02em]">
            {tr("كل اللي متجرك محتاجه")} {tr("في مكان واحد")}
          </h2>
          <p className="text-[17px] leading-[25px] text-white/85">
            {tr("لو محتاج تجهز شكل متجرك، تعمل محتوى، ترفع منتجات، أو تتابع الرسائل والمبيعات، تقدر تطلب الخدمة المناسبة بسهولة ومن غير لخبطة.")}
          </p>
          <div className="flex items-center gap-3 pt-3">
            <span className="text-[13px] text-white/80">
              {tr("الأكثر طلبًا")}: <span className="font-semibold text-white">{featured.title}</span> · {featured.price}
            </span>
          </div>
        </div>
      </section>

      {/* ── Your requests ──────────────────────────────────────── */}
      {requests.length > 0 && (
        <Card title={tr("طلباتك")} subtitle={tr("بنحدّث حالة كل طلب أول بأول.")} icon={Inbox}>
          <ul className="apple-rows pb-2 [--row-inset:20px]">
            {requests.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 px-5 py-3">
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-medium">{r.serviceTitle}</p>
                  <p className="text-[13px] text-muted-foreground">{df.format(r.createdAt)}</p>
                </div>
                <StatusText tone={REQUEST_STATUS[r.status].tone}>{REQUEST_STATUS[r.status].label}</StatusText>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* ── Catalog ────────────────────────────────────────────── */}
      <div className="space-y-6">
        <Segmented
          label={tr("نوع الخدمة")}
          param="cat"
          basePath="/services"
          searchParams={params}
          segments={[{ label: tr("الكل") }, ...CATEGORIES.map((c) => ({ label: c.label, value: c.value }))]}
        />

        {shown.map((cat) => (
          <section key={cat.value} aria-labelledby={`cat-${cat.value}`} className="space-y-3">
            <div className="px-1">
              <h2 id={`cat-${cat.value}`} className="text-[22px] leading-[28px] font-bold ltr:tracking-[-0.01em]">
                {cat.label}
              </h2>
              <p className="mt-0.5 max-w-3xl text-[15px] text-muted-foreground">{cat.description}</p>
            </div>
            <ul className="apple-card apple-rows overflow-hidden [--row-inset:92px]">
              {servicesFor(cat.value).map((service) => (
                <ServiceRow key={service.id} service={service} tint={cat.tint} storeId={store?.id} defaults={defaults} />
              ))}
            </ul>
          </section>
        ))}
      </div>

      {/* ── Custom request ─────────────────────────────────────── */}
      <section className="apple-card flex flex-col items-center gap-4 px-6 py-10 text-center">
        <span className="grid size-14 place-items-center rounded-full bg-(--fill-3) text-primary">
          <Store className="size-7" strokeWidth={1.8} />
        </span>
        <div className="space-y-1.5">
          <h2 className="text-[22px] font-bold">{tr("عايز خدمة مخصصة؟")}</h2>
          <p className="mx-auto max-w-xl text-[15px] leading-6 text-muted-foreground">
            {tr("لو محتاج خدمة مش موجودة فوق، زي إدارة إعلانات، تجهيز كامل للمتجر، أو باكدج مخصوص ليك، ابعت طلبك وهنراجع أنسب حل ليك.")}
          </p>
        </div>
        <RequestServiceDialog trigger="custom" service={{ id: "custom", title: tr("خدمة مخصصة") }} storeId={store?.id} defaults={defaults} />
        <Link href="/support" className="text-[13px] text-primary">
          {tr("أو كلّم الدعم")}
        </Link>
      </section>
    </div>
  );
}

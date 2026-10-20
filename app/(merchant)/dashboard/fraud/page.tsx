import type { Metadata } from "next";
import { Ban, KeyRound, PackageX, Shield, ShieldAlert, ShieldCheck, Store, UserSearch } from "lucide-react";

import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { LargeTitle, Unavailable } from "@/components/saas-page";
import { isOtpConfigured } from "@/lib/fraud/otp";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";
import { IconTile } from "../settings/_components/settings-ui";
import { BlocklistManager } from "./_components/blocklist-manager";
import { FraudSettingsForm } from "./_components/fraud-settings-form";
import { lazyIntl, tdir, tr } from "@/lib/i18n/dashboard";
import { loadDashboardLocale } from "@/lib/i18n/dashboard/server";

export async function generateMetadata(): Promise<Metadata> {
  await loadDashboardLocale();
  return {
    title: tr("الحماية من الأوردرات الوهمية"),
  };
}

const nf = lazyIntl.number();
const pct = lazyIntl.number({ style: "percent", maximumFractionDigits: 0 });
const dateFmt = lazyIntl.date({ timeZone: "Africa/Cairo", day: "numeric", month: "short", year: "numeric" });

/** Last 90 days of this store's online orders, plus its blocklist. */
async function loadProtectionData(storeId: string) {
  const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const recent = { storeId, source: "ONLINE" as const, createdAt: { gte: since } };
  const [delivered, returned, risky, unconfirmed, blocked] = await Promise.all([
    prisma.order.count({ where: { ...recent, status: "DELIVERED" } }),
    prisma.order.count({ where: { ...recent, status: "CANCELED", returnedAt: { not: null } } }),
    prisma.order.count({ where: { ...recent, riskLevel: { in: ["MEDIUM", "HIGH"] } } }),
    prisma.order.count({ where: { ...recent, confirmationStatus: "PENDING", status: "CANCELED" } }),
    prisma.blockedPhone.findMany({
      where: { storeId },
      orderBy: { createdAt: "desc" },
      take: 300,
      select: { id: true, phone: true, reason: true, createdAt: true },
    }),
  ]);
  return { delivered, returned, risky, unconfirmed, blocked };
}

/** Saved settings → a protection level the merchant can read at a glance. */
function protectionLevel(otpMode: "OFF" | "RISKY" | "ALL", blockHighRisk: boolean, otpAvailable: boolean) {
  const score = (otpAvailable ? { OFF: 0, RISKY: 1, ALL: 2 }[otpMode] : 0) + (blockHighRisk ? 1 : 0);
  if (score >= 2)
    return {
      title: tr("حماية قوية"),
      body: tr("الأرقام المشبوهة لازم تأكد قبل ما الطلب يوصلك، والنصابين مش هيقدروا يطلبوا كاش."),
      bg: "bg-linear-to-br from-[#34c759] to-[#248a3d]",
      icon: ShieldCheck,
    };
  if (score === 1)
    return {
      title: tr("حماية متوسطة"),
      body: tr("فيه طبقة حماية شغالة. فعّل التانية عشان تقفل الباب على الطلبات الوهمية."),
      bg: "bg-linear-to-br from-[#0a84ff] to-[#0060df]",
      icon: Shield,
    };
  return {
    title: tr("حماية أساسية"),
    body: tr("بتشوف سمعة الرقم جنب كل طلب بس. فعّل كود التأكيد أو رفض الكاش للأرقام الخطرة."),
    bg: "bg-linear-to-br from-[#ff9f0a] to-[#e07800]",
    icon: ShieldAlert,
  };
}

export default async function FraudRoute() {
  await loadDashboardLocale();
  const userId = await requireUserId();

  const store = await prisma.store.findFirst({
    where: { userId },
    select: { id: true, settings: { select: { orderOtpMode: true, blockHighRiskOrders: true } } },
  });

  if (!store) {
    return (
      <div className="apple-card">
        <Unavailable icon={Store} title={tr("لسه معندكش متجر")} description={tr("أنشئ متجرك الأول وبعدها ظبّط الحماية.")} />
      </div>
    );
  }

  const otpAvailable = isOtpConfigured();
  const settings = {
    orderOtpMode: store.settings?.orderOtpMode ?? "OFF",
    blockHighRiskOrders: store.settings?.blockHighRiskOrders ?? false,
  };
  const { delivered, returned, risky, unconfirmed, blocked } = await loadProtectionData(store.id);
  const shipped = delivered + returned;
  const returnRate = shipped ? returned / shipped : 0;
  const level = protectionLevel(settings.orderOtpMode, settings.blockHighRiskOrders, otpAvailable);
  const LevelIcon = level.icon;

  const stats = [
    {
      label: tr("نسبة المرتجع"),
      value: shipped ? pct.format(returnRate) : "—",
      hint: tr("{0} من {1} طلب اتشحن", nf.format(returned), nf.format(shipped)),
      warn: returnRate >= 0.2,
    },
    { label: tr("طلبات من أرقام مشبوهة"), value: nf.format(risky), hint: tr("اتعلّم عليها في صفحة الطلبات"), warn: false },
    { label: tr("طلبات وهمية اتلغت لوحدها"), value: nf.format(unconfirmed), hint: tr("ماأكدتش بالكود"), warn: false },
    { label: tr("أرقام محظورة"), value: nf.format(blocked.length), hint: tr("مش هتقدر تطلب من متجرك"), warn: false },
  ];

  const how = [
    { icon: UserSearch, tint: "bg-primary", title: tr("سمعة الرقم"), body: tr("كل طلب بيظهر جنبه تاريخ الرقم: استلم كام مرة ورفض كام مرة.") },
    { icon: KeyRound, tint: "bg-(--sys-indigo)", title: tr("كود التأكيد"), body: tr("الرقم المشبوه بيأكد بكود، والطلب اللي ماتأكدش بيتلغى لوحده.") },
    { icon: Ban, tint: "bg-(--sys-red)", title: tr("الحظر"), body: tr("الرقم اللي بيكرر الرفض تحظره ومش هيقدر يطلب تاني.") },
  ];

  return (
    <div className="space-y-8" dir={tdir()}>
      <LargeTitle
        eyebrow={<p className="text-[13px] font-semibold text-muted-foreground">{tr("الحماية")}</p>}
        title={tr("الحماية من الأوردرات الوهمية")}
        subtitle={tr("اعرف الرقم النصاب قبل ما تشحن، أكّد الطلبات بكود، واحظر الأرقام اللي بترفض الاستلام.")}
      />

      {/* Hero: protection level + the last 90 days. */}
      <section className="apple-card overflow-hidden" aria-labelledby="level-title">
        <div className="flex flex-col items-center gap-5 px-6 py-7 text-center sm:flex-row sm:text-start">
          <span
            aria-hidden
            className={cn("grid size-20 shrink-0 place-items-center rounded-[22px] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]", level.bg)}
          >
            <LevelIcon className="size-10" strokeWidth={1.8} />
          </span>
          <div className="min-w-0 space-y-1">
            <p className="text-[13px] font-semibold text-muted-foreground">{tr("مستوى الحماية")}</p>
            <h2 id="level-title" className="text-[28px] leading-[34px] font-bold ltr:tracking-[-0.015em]">
              {level.title}
            </h2>
            <p className="max-w-xl text-[15px] leading-[21px] text-muted-foreground">{level.body}</p>
          </div>
        </div>
        <dl className="grid grid-cols-2 gap-px border-t border-border/60 bg-border/60 lg:grid-cols-4" aria-label={tr("آخر ٩٠ يوم")}>
          {stats.map((s) => (
            <div key={s.label} className="flex flex-col bg-card px-5 py-4">
              <dt className="text-[13px] text-muted-foreground">{s.label}</dt>
              <dd className={cn("mt-0.5 text-[28px] leading-[34px] font-bold tabular-nums", s.warn && "text-(--sys-orange)")}>{s.value}</dd>
              <dd className="text-[12px] text-muted-foreground">{s.hint}</dd>
            </div>
          ))}
        </dl>
      </section>
      <p className="-mt-5 flex items-start gap-2 px-4 text-[13px] leading-[18px] text-muted-foreground">
        <PackageX className="mt-px size-4 shrink-0" />
        {tr("الأرقام دي عن آخر ٩٠ يوم. علّم الطلب \"مرتجع\" من صفحته لما العميل يرفض الاستلام — ده اللي بيبني سمعة الرقم.")}
      </p>

      <div className="grid items-start gap-8 xl:grid-cols-2">
        <FraudSettingsForm storeId={store.id} otpAvailable={otpAvailable} initial={settings} />
        <BlocklistManager
          storeId={store.id}
          entries={blocked.map((b) => ({ id: b.id, phone: b.phone, reason: b.reason, createdAt: dateFmt.format(b.createdAt) }))}
        />
      </div>

      <section className="space-y-2" aria-labelledby="how-title">
        <h2 id="how-title" className="px-4 text-[13px] font-semibold text-muted-foreground">
          {tr("إزاي بنحميك")}
        </h2>
        <ol className="grid gap-px overflow-hidden rounded-[14px] bg-border/60 md:grid-cols-3">
          {how.map((step) => (
            <li key={step.title} className="flex gap-3.5 bg-card px-5 py-4">
              <IconTile icon={step.icon} tint={step.tint} />
              <div className="min-w-0">
                <p className="text-[15px] font-semibold">{step.title}</p>
                <p className="mt-0.5 text-[13px] leading-[18px] text-muted-foreground">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

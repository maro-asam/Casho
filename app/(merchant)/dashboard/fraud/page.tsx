import type { Metadata } from "next";
import { Store } from "lucide-react";

import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { EmptyState, PageHeader } from "@/components/saas-page";
import { isOtpConfigured } from "@/lib/fraud/otp";
import { prisma } from "@/lib/prisma";
import { BlocklistManager } from "./_components/blocklist-manager";
import { FraudSettingsForm } from "./_components/fraud-settings-form";

export const metadata: Metadata = {
  title: "الحماية من الأوردرات الوهمية",
};

const nf = new Intl.NumberFormat("ar-EG");
const pct = new Intl.NumberFormat("ar-EG", { style: "percent", maximumFractionDigits: 0 });
const dateFmt = new Intl.DateTimeFormat("ar-EG", { timeZone: "Africa/Cairo", day: "numeric", month: "short", year: "numeric" });

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

export default async function FraudRoute() {
  const userId = await requireUserId();

  const store = await prisma.store.findFirst({
    where: { userId },
    select: { id: true, settings: { select: { orderOtpMode: true, blockHighRiskOrders: true } } },
  });

  if (!store) {
    return (
      <EmptyState
        icon={Store}
        title="لسه معندكش متجر"
        description="أنشئ متجرك الأول وبعدها ظبّط الحماية."
        className="rounded-xl border border-dashed border-border"
      />
    );
  }

  const { delivered, returned, risky, unconfirmed, blocked } = await loadProtectionData(store.id);
  const shipped = delivered + returned;

  const stats = [
    { label: "نسبة المرتجع", value: shipped ? pct.format(returned / shipped) : "—", hint: `${nf.format(returned)} من ${nf.format(shipped)} طلب اتشحن` },
    { label: "طلبات من أرقام مشبوهة", value: nf.format(risky), hint: "اتعلّم عليها في صفحة الطلبات" },
    { label: "طلبات وهمية اتلغت لوحدها", value: nf.format(unconfirmed), hint: "ماأكدتش بالكود" },
    { label: "أرقام محظورة", value: nf.format(blocked.length), hint: "مش هتقدر تطلب من متجرك" },
  ];

  return (
    <div className="space-y-6" dir="rtl">
      <PageHeader
        title="الحماية من الأوردرات الوهمية"
        description="اعرف الرقم النصاب قبل ما تشحن، أكّد الطلبات بكود، واحظر الأرقام اللي بترفض الاستلام."
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="آخر ٩٠ يوم">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="mt-1 text-2xl font-bold tabular-nums">{s.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{s.hint}</p>
          </div>
        ))}
      </section>
      <p className="-mt-3 text-xs text-muted-foreground">الأرقام دي عن آخر ٩٠ يوم. علّم الطلب &quot;مرتجع&quot; من صفحته لما العميل يرفض الاستلام — ده اللي بيبني سمعة الرقم.</p>

      <FraudSettingsForm
        storeId={store.id}
        otpAvailable={isOtpConfigured()}
        initial={{
          orderOtpMode: store.settings?.orderOtpMode ?? "OFF",
          blockHighRiskOrders: store.settings?.blockHighRiskOrders ?? false,
        }}
      />

      <BlocklistManager
        storeId={store.id}
        entries={blocked.map((b) => ({ id: b.id, phone: b.phone, reason: b.reason, createdAt: dateFmt.format(b.createdAt) }))}
      />
    </div>
  );
}

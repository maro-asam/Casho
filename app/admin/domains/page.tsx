import type { Metadata } from "next";
import Link from "next/link";
import { Globe, Hourglass, Wallet } from "lucide-react";
import { BalanceTransactionType, type DomainRegistrationStatus } from "@prisma/client";

import { requireAdmin } from "@/actions/admin/admin-guard.actions";
import { PageHeader, StatusText } from "@/components/saas-page";
import { registrarConfigured } from "@/lib/domains/registrar";
import { getDomainSettings } from "@/lib/domains/settings";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";
import { KpiStrip, Panel, PanelEmpty, th, theadRow } from "../_components/admin-ui";
import { fmtDate, fmtMoney, fmtNum, fmtRelative } from "../_lib/format";
import { DomainSettingsForm } from "./_components/domain-settings-form";

export const metadata: Metadata = { title: "الدومينات" };

const STATUS: Record<DomainRegistrationStatus, { label: string; tone: "success" | "warning" | "danger" | "neutral" }> = {
  ACTIVE: { label: "شغّال", tone: "success" },
  PENDING: { label: "بيتسجّل", tone: "warning" },
  FAILED: { label: "فشل — اترجع", tone: "danger" },
  EXPIRED: { label: "خلص", tone: "neutral" },
};

const usd = (cents: number) => `$${(cents / 100).toFixed(2)}`;

export default async function AdminDomainsPage() {
  await requireAdmin();
  const now = new Date();

  const [settings, grouped, money, registrations] = await Promise.all([
    getDomainSettings(),
    prisma.domainRegistration.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.balanceTransaction.groupBy({
      by: ["type"],
      where: { type: { in: [BalanceTransactionType.DOMAIN_CHARGE, BalanceTransactionType.DOMAIN_REFUND] } },
      _sum: { amount: true },
    }),
    prisma.domainRegistration.findMany({
      orderBy: { updatedAt: "desc" },
      take: 50,
      select: {
        id: true,
        domain: true,
        status: true,
        pricePaid: true,
        costUsdCents: true,
        renewalCostUsdCents: true,
        autoRenew: true,
        expiresAt: true,
        lastError: true,
        renewalOrderId: true,
        updatedAt: true,
        store: { select: { name: true, slug: true } },
      },
    }),
  ]);

  const count = (s: DomainRegistrationStatus) => grouped.find((g) => g.status === s)?._count._all ?? 0;
  const sum = (t: BalanceTransactionType) => money.find((m) => m.type === t)?._sum.amount ?? 0;
  // Charges are stored negative, refunds positive. `|| 0` keeps an empty ledger from showing "-0".
  const net = -sum(BalanceTransactionType.DOMAIN_CHARGE) - sum(BalanceTransactionType.DOMAIN_REFUND) || 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="الدومينات"
        description="التجار بيشتروا دومينات من Vercel بالجنيه من رصيدهم. التسجيل على حساب Vercel بتاع كاشو، والتجديد بيتخصم من رصيد التاجر قبل ما الدومين يخلص بشهر."
      />

      <KpiStrip
        items={[
          { label: "دومينات شغّالة", value: fmtNum(count("ACTIVE")), icon: Globe },
          { label: "بتتسجّل دلوقتي", value: fmtNum(count("PENDING")), icon: Hourglass },
          {
            label: "صافي المدفوع من التجار",
            value: fmtMoney(net),
            hint: "شراء + تجديد − مرتجع",
            icon: Wallet,
            href: "/admin/transactions?type=DOMAIN_CHARGE",
          },
        ]}
      />

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <DomainSettingsForm
          registrarReady={registrarConfigured}
          initial={{ enabled: settings.enabled, usdRate: settings.usdRate, markupBps: settings.markupBps, registrant: settings.registrant }}
        />

        <Panel title="آخر الدومينات" description="أحدث ٥٠ عملية. السعر بالدولار هو اللي Vercel بتاخده." flush>
          {registrations.length === 0 ? (
            <PanelEmpty>لسه محدش اشترى دومين.</PanelEmpty>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className={theadRow}>
                    <th className={cn(th, "ps-5")}>الدومين</th>
                    <th className={th}>الحالة</th>
                    <th className={cn(th, "text-left")}>المدفوع</th>
                    <th className={cn(th, "pe-5")}>بيخلص</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {registrations.map((r) => (
                    <tr key={r.id} className="align-top">
                      <td className="py-3 ps-5">
                        <p className="font-medium" dir="ltr">
                          {r.domain}
                        </p>
                        <Link href={`/admin/stores/${r.store.slug}`} className="text-xs text-muted-foreground hover:underline">
                          {r.store.name}
                        </Link>
                      </td>
                      <td className="py-3">
                        <StatusText tone={STATUS[r.status].tone}>{STATUS[r.status].label}</StatusText>
                        {r.renewalOrderId && <p className="mt-1 text-xs text-muted-foreground">تجديد شغّال</p>}
                        {r.lastError && r.status !== "ACTIVE" && (
                          <p className="mt-1 max-w-40 truncate font-mono text-xs text-muted-foreground" dir="ltr" title={r.lastError}>
                            {r.lastError}
                          </p>
                        )}
                      </td>
                      <td className="py-3 text-left tabular-nums">
                        <p className="font-semibold">{fmtMoney(r.pricePaid)}</p>
                        <p className="text-xs text-muted-foreground" dir="ltr">
                          {usd(r.costUsdCents)} · renew {usd(r.renewalCostUsdCents)}
                        </p>
                      </td>
                      <td className="py-3 pe-5">
                        <p>{fmtDate(r.expiresAt)}</p>
                        <p className="text-xs text-muted-foreground">
                          {r.status === "ACTIVE" ? (r.autoRenew ? "تجديد تلقائي" : "التجديد مقفول") : fmtRelative(r.updatedAt, now)}
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}

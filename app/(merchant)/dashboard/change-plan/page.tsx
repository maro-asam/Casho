import Link from "next/link";
import type { Metadata } from "next";
import { ArrowDown, ArrowUp, Check, History, Minus, Repeat, Store, Wallet } from "lucide-react";

import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { EmptyState, PageHeader } from "@/components/saas-page";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { hasRunningPaidPeriod, isInTrial } from "@/lib/billing/plan-quote";
import { formatMoney } from "@/lib/balance-ui/meta";
import { getAllActivePlans, getEntitlementsSnapshot, PLAN_KEYS } from "@/lib/entitlements";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";
import { PlanPicker } from "./_components/plan-picker";
import { featureValueLabel, nf, type PlanForUI } from "./_components/plan-types";
import { SubscriptionHero } from "./_components/subscription-hero";
import { lazyIntl, tdir, tr, trv } from "@/lib/i18n/dashboard";
import { loadDashboardLocale } from "@/lib/i18n/dashboard/server";

export async function generateMetadata(): Promise<Metadata> {
  await loadDashboardLocale();
  return {
  title: tr("الباقة والاشتراك"),
};
}

const dtf = lazyIntl.date({ timeZone: "Africa/Cairo", day: "numeric", month: "short", year: "numeric" });

const HISTORY_LABEL: Record<string, { label: string; icon: typeof ArrowUp }> = {
  subscription_upgraded: { get label() { return tr("ترقية"); }, icon: ArrowUp },
  subscription_downgraded: { get label() { return tr("نزول"); }, icon: ArrowDown },
  subscription_cycle_changed: { get label() { return tr("تغيير دورة الدفع"); }, icon: Repeat },
  subscription_selected: { get label() { return tr("اختيار باقة"); }, icon: Check },
  subscription_activated: { get label() { return tr("تفعيل الاشتراك"); }, icon: Check },
  subscription_plan_selected: { get label() { return tr("اختيار باقة"); }, icon: Check },
  subscription_plan_changed: { get label() { return tr("تغيير الباقة"); }, icon: Repeat },
};

const FAQ = [
  {
    get q() { return tr("لو رقّيت في نص الشهر هدفع كام؟"); },
    get a() { return tr("بنحسب الأيام اللي فاضلة من باقتك الحالية ونخصم قيمتها من سعر الباقة الجديدة، وتبدأ فترة جديدة كاملة من النهارده. بتشوف المبلغ بالظبط قبل ما تأكد."); },
  },
  {
    get q() { return tr("لو نزلت باقة هخسر منتجاتي؟"); },
    get a() { return tr("لأ، مفيش أي حاجة بتتمسح. لو عندك أكتر من حد الباقة الجديدة هتفضل موجودة، بس مش هتقدر تضيف جديد. وقيمة الأيام المتبقية بترجعلك رصيد."); },
  },
  {
    get q() { return tr("إيه اللي بيحصل لو الرصيد خلص؟"); },
    get a() { return tr("بنبعتلك تنبيه قبل التجديد بـ ٣ أيام. لو الرصيد مكفاش، المتجر بيفضل شغال ٣ أيام سماح. بعدها بيتوقف لحد ما تشحن، ولما تشحن بيرجع يشتغل لوحده."); },
  },
  {
    get q() { return tr("أقدر أوقف الاشتراك؟"); },
    get a() { return tr("اقفل التجديد التلقائي في أي وقت. الاشتراك هيفضل شغال لآخر يوم إنت دافعه، ورصيدك بيفضل محفوظ."); },
  },
];

export default async function ChangePlanRoute() {
  await loadDashboardLocale();
  const userId = await requireUserId();

  const store = await prisma.store.findFirst({
    where: { userId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      balance: true,
      monthlyPrice: true,
      billingCycle: true,
      planId: true,
      autoRenew: true,
      subscriptionStatus: true,
      subscriptionEndsAt: true,
      gracePeriodEndsAt: true,
      trialStartDate: true,
      trialEndDate: true,
      plan: { select: { name: true, key: true } },
    },
  });

  if (!store) {
    return (
      <EmptyState
        icon={Store}
        title={tr("لسه معندكش متجر")}
        description={tr("أنشئ متجرك الأول عشان تختار باقتك.")}
        className="rounded-xl border border-dashed border-border"
      />
    );
  }

  const now = new Date();
  const [allPlans, snapshot, history] = await Promise.all([
    getAllActivePlans(),
    getEntitlementsSnapshot(store.id),
    prisma.planAuditLog.findMany({
      where: { storeId: store.id, action: { startsWith: "subscription_" } },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: { id: true, action: true, before: true, after: true, createdAt: true, plan: { select: { name: true } } },
    }),
  ]);

  const plans: PlanForUI[] = allPlans.map((plan) => ({
    id: plan.id,
    key: plan.key,
    slug: plan.slug,
    // Plan/feature names live in the DB in Arabic; shown in the dashboard language.
    name: trv(plan.name),
    description: trv(plan.description),
    monthlyPrice: plan.monthlyPrice,
    yearlyPrice: plan.yearlyPrice,
    originalMonthlyPrice: plan.originalMonthlyPrice,
    originalYearlyPrice: plan.originalYearlyPrice,
    sortOrder: plan.sortOrder,
    features: plan.planFeatures
      .filter((pf) => pf.feature.isActive)
      .sort((a, b) => a.feature.sortOrder - b.feature.sortOrder)
      .map((pf) => ({
        key: pf.feature.key,
        name: trv(pf.feature.name),
        unit: trv(pf.feature.unit),
        enabled: pf.enabled,
        isUnlimited: pf.isUnlimited,
        limitValue: pf.limitValue,
      })),
  }));
  const planById = new Map(plans.map((p) => [p.id, p]));
  const currentPlan = store.planId ? (planById.get(store.planId) ?? null) : null;
  const inTrial = isInTrial(store, now);
  const covered = inTrial || hasRunningPaidPeriod(store, now);

  // ── Usage of counted resources (only features shown to merchants) ──
  const featureMeta = new Map(plans[0]?.features.map((f) => [f.key, f]) ?? []);
  const usage = Object.entries(snapshot.usage)
    .filter(([key]) => featureMeta.has(key))
    .map(([key, u]) => ({ key, name: featureMeta.get(key)!.name, unit: featureMeta.get(key)!.unit, ...u }));

  // ── Recommendation: the cheapest higher plan that fixes a resource near its limit ──
  let recommendedPlanId: string | null = null;
  let recommendReason: string | null = null;
  const tight = usage
    .filter((u) => !u.isUnlimited && u.limit !== null && u.limit > 0 && u.used / u.limit >= 0.8)
    .sort((a, b) => b.used / b.limit! - a.used / a.limit!)[0];
  if (tight && currentPlan) {
    const better = plans.find((p) => {
      if (p.sortOrder <= currentPlan.sortOrder) return false;
      const f = p.features.find((x) => x.key === tight.key);
      return f?.enabled && (f.isUnlimited || (f.limitValue ?? 0) > tight.used);
    });
    if (better) {
      recommendedPlanId = better.id;
      const f = better.features.find((x) => x.key === tight.key)!;
      recommendReason = tr("إنت مستخدم {0} من {1} {2} — {3} فيها {4}.", nf.format(tight.used), nf.format(tight.limit!), tight.unit ?? "", better.name, f.isUnlimited ? tr("عدد غير محدود") : nf.format(f.limitValue!));
    }
  }
  if (!recommendedPlanId) {
    const gold = plans.find((p) => p.key === PLAN_KEYS.GOLD);
    if (gold && (inTrial || !currentPlan || currentPlan.sortOrder < gold.sortOrder)) recommendedPlanId = gold.id;
  }

  return (
    <div className="space-y-8" dir={tdir()}>
      <PageHeader
        title={tr("الباقة والاشتراك")}
        description={tr("باقتك، تجديدك، واستخدامك في مكان واحد — وأي تغيير بتشوف تمنه بالظبط قبل ما تأكد.")}
        actions={
          <>
            <Button asChild variant="outline" size="sm" className="gap-1.5">
              <Link href="/balance/history">
                <History className="size-4" />
                {tr("سجل الرصيد")}
              </Link>
            </Button>
            <Button asChild size="sm" className="gap-1.5">
              <Link href="/balance/topup">
                <Wallet className="size-4" />
                {tr("شحن رصيد")}
              </Link>
            </Button>
          </>
        }
      />

      <SubscriptionHero store={store} plan={store.plan} inTrial={inTrial} now={now} />

      {usage.length > 0 && (
        <section aria-labelledby="usage-title" className="space-y-3">
          <h2 id="usage-title" className="text-base font-semibold">
            {tr("استخدامك من الباقة")}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {usage.map((u) => {
              const pct = u.isUnlimited || !u.limit ? 0 : Math.min(100, Math.round((u.used / u.limit) * 100));
              const full = !u.isUnlimited && u.limit !== null && u.used >= u.limit;
              const near = !full && pct >= 80;
              return (
                <div key={u.key} className="rounded-xl border border-border bg-card p-4">
                  <p className="text-sm text-muted-foreground">{trv(u.name)}</p>
                  <p className="mt-1 text-lg font-semibold tabular-nums">
                    {nf.format(u.used)}
                    <span className="text-sm font-normal text-muted-foreground">
                      {" "}
                      / {u.isUnlimited ? tr("غير محدود") : u.limit === null || u.limit === 0 ? tr("مش متاح") : nf.format(u.limit)}
                    </span>
                  </p>
                  {!u.isUnlimited && !!u.limit && (
                    <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn("h-full rounded-full", full ? "bg-destructive" : near ? "bg-amber-500" : "bg-primary")}
                        style={{ width: `${Math.max(2, pct)}%` }}
                      />
                    </div>
                  )}
                  {(full || near) && (
                    <p className={cn("mt-2 text-xs", full ? "text-destructive" : "text-amber-700 dark:text-amber-400")}>
                      {full ? tr("وصلت للحد — رقّي عشان تضيف أكتر.") : tr("مستخدم {0}٪ من الحد.", nf.format(pct))}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      <PlanPicker
        plans={plans}
        currentPlanId={store.planId}
        currentCycle={store.billingCycle}
        recommendedPlanId={recommendedPlanId}
        recommendReason={recommendReason}
        inTrial={inTrial}
        covered={covered}
      />

      {plans.length > 0 && (
        <section aria-labelledby="compare-title" className="space-y-3">
          <h2 id="compare-title" className="text-base font-semibold">
            {tr("قارن كل المميزات")}
          </h2>
          <div className="overflow-x-auto rounded-xl border border-border bg-card">
            <Table className="min-w-[560px]">
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="h-10 ps-4 text-xs font-medium text-muted-foreground">{tr("الميزة")}</TableHead>
                  {plans.map((p) => (
                    <TableHead
                      key={p.id}
                      className={cn("h-10 text-center text-xs font-medium last:pe-4", p.id === store.planId ? "text-primary" : "text-muted-foreground")}
                    >
                      {p.name}
                      {p.id === store.planId && <span className="block text-[10px] font-normal">{tr("باقتك")}</span>}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans[0].features.map((f) => (
                  <TableRow key={f.key}>
                    <TableCell className="py-3 ps-4 text-sm">{f.name}</TableCell>
                    {plans.map((p) => {
                      const pf = p.features.find((x) => x.key === f.key);
                      const value = pf ? featureValueLabel(pf) : null;
                      return (
                        <TableCell key={p.id} className={cn("py-3 text-center text-sm last:pe-4", p.id === store.planId && "bg-primary/[0.03]")}>
                          {!pf?.enabled ? (
                            <Minus className="mx-auto size-4 text-muted-foreground/50" aria-label={tr("مش متاح")} />
                          ) : value ? (
                            <span className="tabular-nums">{value}</span>
                          ) : (
                            <Check className="mx-auto size-4 text-primary" aria-label={tr("متاح")} />
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
                <TableRow className="hover:bg-transparent">
                  <TableCell className="py-3 ps-4 text-sm font-medium">{tr("السعر الشهري")}</TableCell>
                  {plans.map((p) => (
                    <TableCell key={p.id} className={cn("py-3 text-center text-sm font-medium tabular-nums last:pe-4", p.id === store.planId && "bg-primary/[0.03]")}>
                      {formatMoney(p.monthlyPrice)}
                    </TableCell>
                  ))}
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="history-title" className="space-y-3">
          <h2 id="history-title" className="text-base font-semibold">
            {tr("تغييرات الباقة")}
          </h2>
          <div className="rounded-xl border border-border bg-card">
            {history.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">{tr("لسه ما غيّرتش باقتك.")}</p>
            ) : (
              <ul className="divide-y divide-border">
                {history.map((h) => {
                  const meta = HISTORY_LABEL[h.action] ?? { label: tr("تحديث"), icon: Repeat };
                  const before = (h.before ?? {}) as { planId?: string | null; billingCycle?: string };
                  const after = (h.after ?? {}) as { billingCycle?: string; charge?: number };
                  const fromName = before.planId ? planById.get(before.planId)?.name : null;
                  const Icon = meta.icon;
                  return (
                    <li key={h.id} className="flex items-center gap-3 px-4 py-3">
                      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
                        <Icon className="size-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {meta.label}
                          {h.plan?.name && (
                            <span className="font-normal text-muted-foreground">
                              {" "}
                              · {fromName && fromName !== h.plan.name ? `${trv(fromName)} ← ` : ""}
                              {trv(h.plan.name)}
                              {after.billingCycle && ` (${after.billingCycle === "YEARLY" ? tr("سنوي") : tr("شهري")})`}
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">{dtf.format(h.createdAt)}</p>
                      </div>
                      {typeof after.charge === "number" && after.charge !== 0 && (
                        <span
                          className={cn(
                            "shrink-0 text-sm font-medium tabular-nums",
                            after.charge < 0 ? "text-emerald-700 dark:text-emerald-400" : "text-foreground",
                          )}
                        >
                          {after.charge < 0 ? "+" : "−"}
                          {formatMoney(Math.abs(after.charge))}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>

        <section aria-labelledby="faq-title" className="space-y-3">
          <h2 id="faq-title" className="text-base font-semibold">
            {tr("إزاي الفلوس بتتحسب؟")}
          </h2>
          <div className="divide-y divide-border rounded-xl border border-border bg-card">
            {FAQ.map((item) => (
              <details key={item.q} className="group px-4 py-3 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-medium">
                  {item.q}
                  <span className="text-muted-foreground transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.a}</p>
              </details>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

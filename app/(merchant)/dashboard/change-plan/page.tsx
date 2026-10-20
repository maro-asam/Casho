import Link from "next/link";
import type { Metadata } from "next";
import { ArrowDown, ArrowUp, Check, ChevronDown, History, Repeat, Store, Wallet } from "lucide-react";

import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { Card, LargeTitle, Unavailable, appleButton } from "@/components/saas-page";
import { hasRunningPaidPeriod, isInTrial } from "@/lib/billing/plan-quote";
import { formatMoney } from "@/lib/balance-ui/meta";
import { getAllActivePlans, getEntitlementsSnapshot, PLAN_KEYS } from "@/lib/entitlements";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";
import { PlanPicker } from "./_components/plan-picker";
import { featureValueLabel, nf, type PlanForUI } from "./_components/plan-types";
import { SubscriptionHero } from "./_components/subscription-hero";
import { TierGlyph } from "./_components/tier-glyph";
import { lazyIntl, tdir, tr, trv } from "@/lib/i18n/dashboard";
import { loadDashboardLocale } from "@/lib/i18n/dashboard/server";

export async function generateMetadata(): Promise<Metadata> {
  await loadDashboardLocale();
  return {
  title: tr("الباقة والاشتراك"),
};
}

const dtf = lazyIntl.date({ timeZone: "Africa/Cairo", day: "numeric", month: "short", year: "numeric" });

const HISTORY_LABEL: Record<string, { label: string; icon: typeof ArrowUp; tint: string }> = {
  subscription_upgraded: { get label() { return tr("ترقية"); }, icon: ArrowUp, tint: "bg-(--sys-green)" },
  subscription_downgraded: { get label() { return tr("نزول"); }, icon: ArrowDown, tint: "bg-(--sys-orange)" },
  subscription_cycle_changed: { get label() { return tr("تغيير دورة الدفع"); }, icon: Repeat, tint: "bg-(--sys-indigo)" },
  subscription_selected: { get label() { return tr("اختيار باقة"); }, icon: Check, tint: "bg-primary" },
  subscription_activated: { get label() { return tr("تفعيل الاشتراك"); }, icon: Check, tint: "bg-(--sys-green)" },
  subscription_plan_selected: { get label() { return tr("اختيار باقة"); }, icon: Check, tint: "bg-primary" },
  subscription_plan_changed: { get label() { return tr("تغيير الباقة"); }, icon: Repeat, tint: "bg-(--sys-indigo)" },
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
      <div className="apple-card">
        <Unavailable icon={Store} title={tr("لسه معندكش متجر")} description={tr("أنشئ متجرك الأول عشان تختار باقتك.")} />
      </div>
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

  const cols = { gridTemplateColumns: `minmax(10rem,1.4fr) repeat(${plans.length}, minmax(6.5rem,1fr))` };

  return (
    <div className="space-y-10" dir={tdir()}>
      <div className="space-y-6">
        <LargeTitle
          title={tr("الباقة والاشتراك")}
          subtitle={tr("باقتك، تجديدك، واستخدامك في مكان واحد — وأي تغيير بتشوف تمنه بالظبط قبل ما تأكد.")}
          actions={
            <>
              <Link href="/balance/history" className={appleButton.gray}>
                <History className="size-4" />
                {tr("سجل الرصيد")}
              </Link>
              <Link href="/balance/topup" className={appleButton.filled}>
                <Wallet className="size-4" />
                {tr("شحن رصيد")}
              </Link>
            </>
          }
        />

        <SubscriptionHero store={store} plan={store.plan} inTrial={inTrial} now={now} />

        {/* ── Usage, iPhone-Storage style ─────────────────────── */}
        {usage.length > 0 && (
          <Card title={tr("استخدامك من الباقة")} id="usage">
            <div className="grid gap-x-10 px-5 pb-5 sm:grid-cols-2 lg:grid-cols-4">
              {usage.map((u) => {
                const pct = u.isUnlimited || !u.limit ? 0 : Math.min(100, Math.round((u.used / u.limit) * 100));
                const full = !u.isUnlimited && u.limit !== null && u.used >= u.limit;
                const near = !full && pct >= 80;
                return (
                  <div key={u.key} className="space-y-2 py-3">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="truncate text-[15px]">{trv(u.name)}</p>
                      <p className="shrink-0 text-[13px] text-muted-foreground tabular-nums">
                        <span className="font-semibold text-foreground">{nf.format(u.used)}</span>
                        {" / "}
                        {u.isUnlimited ? "∞" : u.limit === null || u.limit === 0 ? tr("مش متاح") : nf.format(u.limit)}
                      </p>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-(--fill-3)">
                      {!u.isUnlimited && !!u.limit && (
                        <div
                          className={cn("h-full rounded-full", full ? "bg-(--sys-red)" : near ? "bg-(--sys-orange)" : "bg-primary")}
                          style={{ width: `${Math.max(2, pct)}%` }}
                        />
                      )}
                      {u.isUnlimited && <div className="h-full w-full rounded-full bg-(--sys-green)/35" />}
                    </div>
                    <p className={cn("h-4 text-[12px]", full ? "text-(--sys-red)" : near ? "text-(--sys-orange)" : "text-muted-foreground")}>
                      {full ? tr("وصلت للحد — رقّي عشان تضيف أكتر.") : near ? tr("مستخدم {0}٪ من الحد.", nf.format(pct)) : u.isUnlimited ? tr("غير محدود") : ""}
                    </p>
                  </div>
                );
              })}
            </div>
          </Card>
        )}
      </div>

      <PlanPicker
        plans={plans}
        currentPlanId={store.planId}
        currentCycle={store.billingCycle}
        recommendedPlanId={recommendedPlanId}
        recommendReason={recommendReason}
        inTrial={inTrial}
        covered={covered}
      />

      {/* ── Compare, apple.com style ─────────────────────────── */}
      {plans.length > 0 && (
        <section aria-labelledby="compare-title" className="space-y-6">
          <h2 id="compare-title" className="text-center text-[28px] leading-[34px] font-bold ltr:tracking-[-0.015em]">
            {tr("قارن كل المميزات")}
          </h2>
          <div className="apple-card overflow-x-auto">
            <div className="min-w-[560px]" role="table" aria-labelledby="compare-title">
              <div role="row" className="sticky top-0 grid items-end bg-card px-5 pt-6 pb-4" style={cols}>
                <span role="columnheader" className="sr-only">
                  {tr("الميزة")}
                </span>
                {plans.map((p) => (
                  <div role="columnheader" key={p.id} className="flex flex-col items-center gap-2 text-center">
                    <TierGlyph tier={p.key} size="sm" />
                    <span className="text-[15px] font-semibold">{p.name}</span>
                    <span className="text-[13px] text-muted-foreground tabular-nums">
                      {formatMoney(p.monthlyPrice)} / {tr("شهر")}
                    </span>
                    <span className={cn("h-4 text-[12px] font-semibold", p.id === store.planId ? "text-primary" : "")}>
                      {p.id === store.planId ? tr("باقتك") : ""}
                    </span>
                  </div>
                ))}
              </div>
              <div className="apple-rows border-t-[0.5px] border-border pb-2 [--row-inset:20px]">
                {plans[0].features.map((f) => (
                  <div role="row" key={f.key} className="grid min-h-12 items-center px-5 py-2.5" style={cols}>
                    <span role="rowheader" className="text-[15px]">
                      {f.name}
                    </span>
                    {plans.map((p) => {
                      const pf = p.features.find((x) => x.key === f.key);
                      const value = pf ? featureValueLabel(pf) : null;
                      return (
                        <span role="cell" key={p.id} className="text-center text-[15px]">
                          {!pf?.enabled ? (
                            <span className="text-(--label-3)" aria-label={tr("مش متاح")}>
                              —
                            </span>
                          ) : value ? (
                            <span className="tabular-nums">{value}</span>
                          ) : (
                            <Check className="mx-auto size-[18px] text-primary" strokeWidth={2.6} aria-label={tr("متاح")} />
                          )}
                        </span>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title={tr("تغييرات الباقة")} id="history">
          {history.length === 0 ? (
            <Unavailable icon={Repeat} title={tr("لسه ما غيّرتش باقتك.")} className="py-10" />
          ) : (
            <ul className="apple-rows pb-2 [--row-inset:64px]">
              {history.map((h) => {
                const meta = HISTORY_LABEL[h.action] ?? { label: tr("تحديث"), icon: Repeat, tint: "bg-(--sys-gray)" };
                const before = (h.before ?? {}) as { planId?: string | null; billingCycle?: string };
                const after = (h.after ?? {}) as { billingCycle?: string; charge?: number };
                const fromName = before.planId ? planById.get(before.planId)?.name : null;
                const Icon = meta.icon;
                return (
                  <li key={h.id} className="flex items-center gap-3 px-5 py-3">
                    <span className={cn("grid size-8 shrink-0 place-items-center rounded-full text-white", meta.tint)}>
                      <Icon className="size-4" strokeWidth={2.4} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-medium">
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
                      <p className="text-[13px] text-muted-foreground">{dtf.format(h.createdAt)}</p>
                    </div>
                    {typeof after.charge === "number" && after.charge !== 0 && (
                      <span dir="ltr" className={cn("shrink-0 text-[15px] font-semibold tabular-nums", after.charge < 0 && "text-(--sys-green)")}>
                        {after.charge < 0 ? "+" : "−"}
                        {formatMoney(Math.abs(after.charge))}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card title={tr("إزاي الفلوس بتتحسب؟")} id="faq">
          <div className="apple-rows pb-2 [--row-inset:20px]">
            {FAQ.map((item) => (
              <details key={item.q} className="group [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-5 py-3 text-[15px] font-medium">
                  {item.q}
                  <ChevronDown className="size-[18px] shrink-0 text-(--label-3) transition-transform duration-300 ease-(--ease-apple) group-open:rotate-180" strokeWidth={2.4} />
                </summary>
                <p className="-mt-1 px-5 pb-4 text-[15px] leading-6 text-muted-foreground">{item.a}</p>
              </details>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

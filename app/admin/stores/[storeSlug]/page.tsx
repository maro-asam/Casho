import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, ExternalLink, Mail, MessageCircle, RefreshCcw, RotateCw } from "lucide-react";

import { prisma } from "@/lib/prisma";
import {
  adminActivateStoreSubscriptionAction,
  adminCancelStoreSubscriptionAction,
  adminRefreshStoreSubscriptionStatusAction,
  adminRenewStoreSubscriptionAction,
  adminResumeStoreSubscriptionAutoRenewAction,
  adminSetPoweredByRemovalAction,
} from "@/actions/admin/admin-store.actions";
import { StatusText } from "@/components/saas-page";
import { Button } from "@/components/ui/button";
import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { cn } from "@/lib/utils";
import { ActionButton } from "../../_components/action-button";
import { BackLink, Fields, KpiStrip, Panel, PanelEmpty, th, theadRow } from "../../_components/admin-ui";
import {
  ROLE_META,
  SERVICE_STATUS_META,
  SUBSCRIPTION_META,
  SUPPORT_STATUS_META,
  TOPUP_METHOD_LABELS,
  TOPUP_STATUS_META,
  TX_TYPE_META,
  fmtDate,
  fmtDateTime,
  fmtMoney,
  fmtNum,
  fmtRelative,
} from "../../_lib/format";
import { AssignPlanDialog, BalanceForm, ExtendSubscriptionDialog } from "./_components/store-manage";
import { adminDeleteStoreAction } from "@/actions/admin/admin-delete.actions";
import { getStoreDeletionBlockers } from "@/lib/admin/deletion";
import { DangerDelete } from "../../_components/danger-delete";

type PageProps = { params: Promise<{ storeSlug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { storeSlug } = await params;
  const store = await prisma.store.findUnique({ where: { slug: storeSlug }, select: { name: true } });
  return { title: store?.name ?? "متجر" };
}

const AUDIT_LABELS: Record<string, string> = {
  admin_subscription_extended: "مد مجاني للاشتراك",
  admin_plan_assigned: "الأدمن غيّر الباقة",
  subscription_upgraded: "ترقية الباقة",
  subscription_downgraded: "تخفيض الباقة",
  subscription_selected: "اختيار باقة",
  subscription_activated: "تفعيل الاشتراك",
  subscription_cycle_changed: "تغيير دورة الدفع",
  subscription_canceled: "إلغاء الاشتراك",
};

export default async function AdminStoreDetailsPage({ params }: PageProps) {
  const { storeSlug } = await params;

  const store = await prisma.store.findUnique({
    where: { slug: storeSlug },
    select: {
      id: true,
      name: true,
      slug: true,
      balance: true,
      monthlyPrice: true,
      billingCycle: true,
      autoRenew: true,
      subscriptionStatus: true,
      subscriptionEndsAt: true,
      gracePeriodEndsAt: true,
      trialEndDate: true,
      onboardingCompleted: true,
      businessCategory: true,
      customDomain: true,
      customDomainStatus: true,
      showPoweredByCasho: true,
      poweredByRemovalEnabled: true,
      createdAt: true,
      planId: true,
      plan: { select: { name: true } },
      user: { select: { id: true, name: true, email: true, phone_number: true, role: true, createdAt: true, emailVerified: true } },
      _count: { select: { products: true, orders: true, customers: true, members: true } },
      balanceTransactions: { orderBy: { createdAt: "desc" }, take: 12 },
      topupRequests: { orderBy: { createdAt: "desc" }, take: 5 },
      serviceRequests: { orderBy: { createdAt: "desc" }, take: 5, select: { id: true, serviceTitle: true, status: true, createdAt: true } },
      supportRequests: { orderBy: { createdAt: "desc" }, take: 5, select: { id: true, title: true, status: true, createdAt: true } },
    },
  });

  if (!store) notFound();

  const [gmv, plans, audit, deleteBlockers] = await Promise.all([
    prisma.order.aggregate({ where: { storeId: store.id, status: { not: "CANCELED" } }, _sum: { total: true } }),
    prisma.plan.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true, monthlyPrice: true, yearlyPrice: true, isActive: true } }),
    prisma.planAuditLog.findMany({
      where: { storeId: store.id },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: { id: true, action: true, note: true, createdAt: true, actor: { select: { name: true, email: true } } },
    }),
    getStoreDeletionBlockers(store.id),
  ]);

  const now = new Date();
  const meta = SUBSCRIPTION_META[store.subscriptionStatus];
  const enoughForRenewal = store.balance >= store.monthlyPrice;
  const hasSubscription = !!store.subscriptionEndsAt;
  const storeUrl = buildStoreUrl(store.slug);
  const whatsapp = store.user.phone_number?.replace(/[^\d]/g, "");
  const cycleWord = store.billingCycle === "YEARLY" ? "سنوي" : "شهري";

  return (
    <div className="space-y-6">
      <BackLink href="/admin/stores">كل المتاجر</BackLink>

      {/* Header */}
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">{store.name}</h1>
            <StatusText tone={meta.tone}>{meta.label}</StatusText>
            {store.plan && <StatusText tone="neutral">{store.plan.name} · {cycleWord}</StatusText>}
          </div>
          <p className="text-sm text-muted-foreground">
            <a href={storeUrl} target="_blank" rel="noreferrer" className="font-mono hover:text-foreground hover:underline" dir="ltr">
              {storeUrl.replace(/^https?:\/\//, "")}
            </a>
            {" · "}اتعمل {fmtDate(store.createdAt)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <a href={`mailto:${store.user.email}`}>
              <Mail className="size-3.5" />
              راسل المالك
            </a>
          </Button>
          {whatsapp && (
            <Button asChild variant="outline" size="sm">
              <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer">
                <MessageCircle className="size-3.5" />
                واتساب
              </a>
            </Button>
          )}
          <Button asChild size="sm">
            <a href={storeUrl} target="_blank" rel="noreferrer">
              <ExternalLink className="size-3.5" />
              زيارة المتجر
            </a>
          </Button>
        </div>
      </header>

      <KpiStrip
        items={[
          { label: "الرصيد", value: fmtMoney(store.balance), hint: enoughForRenewal ? "يكفي التجديد الجاي" : `ناقص ${fmtMoney(store.monthlyPrice - store.balance)} للتجديد` },
          {
            label: store.subscriptionEndsAt && store.subscriptionEndsAt < now ? "انتهى الاشتراك" : "ينتهي الاشتراك",
            value: fmtDate(store.subscriptionEndsAt),
            hint: store.subscriptionEndsAt ? fmtRelative(store.subscriptionEndsAt, now) : "لسه ماتفعلش",
          },
          { label: "سعر التجديد", value: fmtMoney(store.monthlyPrice), hint: `${cycleWord} · التجديد التلقائي ${store.autoRenew ? "شغال" : "متوقف"}` },
          { label: "مبيعات المتجر", value: fmtMoney(gmv._sum.total ?? 0), hint: `${fmtNum(store._count.orders)} طلب · ${fmtNum(store._count.products)} منتج` },
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main column */}
        <div className="space-y-6 lg:col-span-2">
          <Panel
            title="الاشتراك"
            description={
              store.subscriptionStatus === "GRACE_PERIOD" && store.gracePeriodEndsAt
                ? `في فترة السماح لحد ${fmtDateTime(store.gracePeriodEndsAt)}.`
                : "التجديد بيخصم سعر الفترة من رصيد المتجر. المد المجاني مش بيخصم حاجة."
            }
          >
            <div className="flex flex-wrap gap-2">
              {hasSubscription ? (
                <ActionButton
                  action={adminRenewStoreSubscriptionAction.bind(null, store.id)}
                  variant="default"
                  disabled={!enoughForRenewal}
                  confirm={{
                    title: "تجديد الاشتراك من الرصيد؟",
                    description: `هيتخصم ${fmtMoney(store.monthlyPrice)} من رصيد المتجر (${fmtMoney(store.balance)}) وتتمد الفترة ${cycleWord === "سنوي" ? "سنة" : "شهر"}.`,
                    confirmLabel: "جدّد",
                  }}
                >
                  <RotateCw className="size-3.5" />
                  جدّد من الرصيد
                </ActionButton>
              ) : (
                <ActionButton
                  action={adminActivateStoreSubscriptionAction.bind(null, store.id)}
                  variant="default"
                  disabled={!enoughForRenewal}
                  confirm={{
                    title: "تفعيل أول اشتراك؟",
                    description: `هيتخصم ${fmtMoney(store.monthlyPrice)} من رصيد المتجر ويبدأ اشتراك ${cycleWord}.`,
                    confirmLabel: "فعّل",
                  }}
                >
                  <RotateCw className="size-3.5" />
                  فعّل من الرصيد
                </ActionButton>
              )}
              <ExtendSubscriptionDialog storeId={store.id} />
              <AssignPlanDialog
                storeId={store.id}
                plans={plans}
                currentPlanId={store.planId}
                currentCycle={store.billingCycle}
              />
              <ActionButton action={adminRefreshStoreSubscriptionStatusAction.bind(null, store.id)} variant="ghost">
                <RefreshCcw className="size-3.5" />
                راجع الحالة
              </ActionButton>
              {store.autoRenew ? (
                <ActionButton
                  action={adminCancelStoreSubscriptionAction.bind(null, store.id)}
                  variant="destructive"
                  className="ms-auto"
                  confirm={{
                    title: "إلغاء اشتراك المتجر؟",
                    description: "الاشتراك هيتلغي والتجديد التلقائي هيقف فورًا، والمتجر هيوقف عن العملاء. التاجر يقدر يرجعه بعدين.",
                    confirmLabel: "ألغِ الاشتراك",
                    destructive: true,
                  }}
                >
                  إلغاء الاشتراك
                </ActionButton>
              ) : (
                <ActionButton action={adminResumeStoreSubscriptionAutoRenewAction.bind(null, store.id)} className="ms-auto">
                  شغّل التجديد التلقائي
                </ActionButton>
              )}
            </div>
            {!enoughForRenewal && (
              <p className="mt-3 text-xs text-muted-foreground">التجديد من الرصيد مقفول لأن الرصيد أقل من سعر التجديد. اشحن الأول أو استخدم المد المجاني.</p>
            )}
          </Panel>

          <Panel title="الرصيد" description="كل عملية بتتسجل في دفتر المتجر وبتظهر للتاجر.">
            <BalanceForm storeId={store.id} balance={store.balance} />
          </Panel>

          <Panel
            title="الحركات المالية"
            flush
            actions={
              <Link href={`/admin/transactions?q=${encodeURIComponent(store.slug)}`} className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                كل الحركات <ArrowUpRight className="size-3" />
              </Link>
            }
          >
            {store.balanceTransactions.length === 0 ? (
              <PanelEmpty>مفيش حركات على الرصيد لسه.</PanelEmpty>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className={theadRow}>
                      <th className={cn(th, "ps-4")}>النوع</th>
                      <th className={cn(th, "hidden sm:table-cell")}>ملاحظة</th>
                      <th className={cn(th, "text-left")}>المبلغ</th>
                      <th className={cn(th, "hidden text-left md:table-cell")}>بعد العملية</th>
                      <th className={cn(th, "pe-4 text-left")}>التاريخ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {store.balanceTransactions.map((tx) => (
                      <tr key={tx.id}>
                        <td className="py-3 ps-4">
                          <StatusText tone={TX_TYPE_META[tx.type].tone}>{TX_TYPE_META[tx.type].label}</StatusText>
                        </td>
                        <td className="hidden max-w-64 truncate py-3 text-muted-foreground sm:table-cell" title={tx.note ?? undefined}>
                          {tx.note ?? "—"}
                        </td>
                        <td className={cn("py-3 text-left font-medium tabular-nums", tx.amount > 0 && "text-emerald-700 dark:text-emerald-400")} dir="ltr">
                          {tx.amount > 0 ? "+" : ""}
                          {fmtMoney(tx.amount)}
                        </td>
                        <td className="hidden py-3 text-left tabular-nums text-muted-foreground md:table-cell">{fmtMoney(tx.balanceAfter)}</td>
                        <td className="py-3 pe-4 text-left text-xs text-muted-foreground">{fmtDateTime(tx.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>

          <Panel
            title="طلبات الشحن"
            flush
            actions={
              <Link href={`/admin/topup-requests?q=${encodeURIComponent(store.slug)}`} className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                كل الطلبات <ArrowUpRight className="size-3" />
              </Link>
            }
          >
            {store.topupRequests.length === 0 ? (
              <PanelEmpty>المتجر مبعتش طلبات شحن.</PanelEmpty>
            ) : (
              <ul className="divide-y divide-border">
                {store.topupRequests.map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                    <div className="flex items-center gap-2">
                      <StatusText tone={TOPUP_STATUS_META[r.status].tone}>{TOPUP_STATUS_META[r.status].label}</StatusText>
                      <span className="text-muted-foreground">{TOPUP_METHOD_LABELS[r.method]}</span>
                    </div>
                    <div className="text-left">
                      <p className="font-medium tabular-nums">{fmtMoney(r.amount)}</p>
                      <p className="text-xs text-muted-foreground">{fmtRelative(r.createdAt, now)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        {/* Side column */}
        <div className="space-y-6">
          <Panel
            title="المالك"
            actions={
              <Link href={`/admin/users/${store.user.id}`} className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                صفحة المستخدم <ArrowUpRight className="size-3" />
              </Link>
            }
          >
            <Fields
              rows={[
                { label: "الاسم", value: store.user.name ?? "—" },
                { label: "البريد", value: store.user.email, ltr: true },
                { label: "الموبايل", value: store.user.phone_number ?? "—", ltr: true },
                { label: "الدور", value: <StatusText tone={ROLE_META[store.user.role].tone}>{ROLE_META[store.user.role].label}</StatusText> },
                { label: "البريد متأكد", value: store.user.emailVerified ? "أيوه" : "لأ" },
                { label: "سجّل", value: fmtDate(store.user.createdAt) },
              ]}
            />
          </Panel>

          <Panel title="تفاصيل المتجر">
            <Fields
              rows={[
                { label: "الرابط", value: store.slug, ltr: true },
                { label: "دومين مخصص", value: store.customDomain ? `${store.customDomain} (${store.customDomainStatus})` : "—", ltr: !!store.customDomain },
                { label: "النشاط", value: store.businessCategory ?? "—" },
                { label: "الإعداد الأولي", value: store.onboardingCompleted ? "خلص" : "لسه" },
                { label: "نهاية التجربة", value: fmtDate(store.trialEndDate) },
                { label: "العملاء", value: fmtNum(store._count.customers) },
                { label: "أعضاء الفريق", value: fmtNum(store._count.members) },
              ]}
            />
            <div className="mt-4 flex items-center justify-between gap-3 rounded-[12px] bg-(--fill-3) p-3">
              <div>
                <p className="text-sm font-medium">علامة Powered by Casho</p>
                <p className="text-xs text-muted-foreground">{store.poweredByRemovalEnabled ? "مسموح للتاجر يخفيها" : "ظاهرة في فوتر المتجر"}</p>
              </div>
              <ActionButton
                action={adminSetPoweredByRemovalAction.bind(null, store.id, !store.poweredByRemovalEnabled)}
                confirm={{
                  title: store.poweredByRemovalEnabled ? "ترجّع العلامة؟" : "تشيل العلامة؟",
                  description: store.poweredByRemovalEnabled
                    ? "العلامة هترجع تظهر في فوتر المتجر والتاجر مش هيقدر يخفيها."
                    : "العلامة هتختفي من فوتر المتجر فورًا.",
                }}
              >
                {store.poweredByRemovalEnabled ? "رجّعها" : "شيلها"}
              </ActionButton>
            </div>
          </Panel>

          <Panel title="طلبات الخدمات والدعم" flush>
            {store.serviceRequests.length + store.supportRequests.length === 0 ? (
              <PanelEmpty>مفيش طلبات من المتجر ده.</PanelEmpty>
            ) : (
              <ul className="divide-y divide-border text-sm">
                {store.serviceRequests.map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                    <Link href={`/admin/service-requests?q=${encodeURIComponent(store.slug)}`} className="min-w-0 truncate hover:underline">
                      خدمة: {r.serviceTitle}
                    </Link>
                    <StatusText tone={SERVICE_STATUS_META[r.status].tone}>{SERVICE_STATUS_META[r.status].label}</StatusText>
                  </li>
                ))}
                {store.supportRequests.map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                    <Link href={`/admin/support-requests?q=${encodeURIComponent(store.slug)}`} className="min-w-0 truncate hover:underline">
                      دعم: {r.title}
                    </Link>
                    <StatusText tone={SUPPORT_STATUS_META[r.status].tone}>{SUPPORT_STATUS_META[r.status].label}</StatusText>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="سجل الباقة والاشتراك" flush>
            {audit.length === 0 ? (
              <PanelEmpty>مفيش تغييرات مسجلة.</PanelEmpty>
            ) : (
              <ol className="divide-y divide-border text-sm">
                {audit.map((a) => (
                  <li key={a.id} className="px-4 py-2.5">
                    <p className="font-medium">{AUDIT_LABELS[a.action] ?? a.action}</p>
                    <p className="text-xs text-muted-foreground">
                      {a.actor ? (a.actor.name ?? a.actor.email) : "النظام"} · {fmtRelative(a.createdAt, now)}
                    </p>
                    {a.note && <p className="mt-0.5 text-xs">{a.note}</p>}
                  </li>
                ))}
              </ol>
            )}
          </Panel>

          <DangerDelete
            noun="المتجر"
            confirmValue={store.slug}
            confirmLabel="رابط المتجر"
            blockers={deleteBlockers}
            alternative="بدل الحذف: ألغِ الاشتراك من فوق — المتجر بيقف عن العملاء وسجله المالي بيفضل."
            consequences={[
              `${fmtNum(store._count.products)} منتج و${fmtNum(store._count.orders)} طلب و${fmtNum(store._count.customers)} عميل`,
              "الفروع والمخزون ونقطة البيع والكوبونات والبانرات",
              "ربط إنستجرام والدومين المخصص",
              "حساب المالك بيفضل موجود",
            ]}
            action={adminDeleteStoreAction.bind(null, store.id)}
            redirectTo="/admin/stores"
          />
        </div>
      </div>
    </div>
  );
}

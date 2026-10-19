import Link from "next/link";
import type { Metadata } from "next";
import { SearchX, ShoppingCart, Store } from "lucide-react";

import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { UpgradeRequiredCard } from "@/components/entitlements/UpgradeRequiredCard";
import {
  DataCard,
  EmptyState,
  FilterTabs,
  PageHeader,
  Pagination,
  SearchInput,
  SelectFilter,
  hrefWith,
  readPage,
  readParam,
  type SearchParamsRecord,
} from "@/components/saas-page";
import { Button } from "@/components/ui/button";
import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { loadAbandonedCarts, type RecoveryStatus } from "@/lib/cart-recovery/abandoned";
import { couponStatusWhere, formatCouponValue } from "@/lib/coupons/coupon-status";
import { checkLimit, FEATURE_KEYS, hasFeature } from "@/lib/entitlements";
import { prisma } from "@/lib/prisma";
import { CartsTable } from "./_components/carts-table";
import { RecoverDialog } from "./_components/recover-dialog";
import { RECOVERY_STATUSES } from "./_components/recovery-meta";
import { lazyIntl, tdir, tr } from "@/lib/i18n/dashboard";
import { loadDashboardLocale } from "@/lib/i18n/dashboard/server";

export async function generateMetadata(): Promise<Metadata> {
  await loadDashboardLocale();
  return {
  title: tr("عربات التسوق المهجورة"),
};
}

const PAGE_SIZE = 20;
const BASE_PATH = "/abandoned-carts";
const PERIODS = [
  { value: "1", get label() { return tr("آخر ٢٤ ساعة"); } },
  { value: "7", get label() { return tr("آخر ٧ أيام"); } },
  { value: "90", get label() { return tr("آخر ٩٠ يوم"); } },
];
const money = lazyIntl.number({ style: "currency", currency: "EGP", maximumFractionDigits: 0 });
const nf = lazyIntl.number();
const description = () => tr("عملاء حطّوا منتجات في السلة ومكمّلوش — ابعتلهم رسالة بلينك يرجّع سلتهم زي ما هي.");

type AbandonedCartsRouteProps = {
  searchParams?: Promise<SearchParamsRecord>;
};

export default async function AbandonedCartsRoute({ searchParams }: AbandonedCartsRouteProps) {
  await loadDashboardLocale();
  const userId = await requireUserId();
  const params = await searchParams;

  const store = await prisma.store.findFirst({
    where: { userId },
    select: { id: true, slug: true, name: true, customDomain: true, customDomainStatus: true },
  });

  if (!store) {
    return (
      <EmptyState
        icon={Store}
        title={tr("لسه معندكش متجر")}
        description={tr("أنشئ متجرك الأول عشان تتابع السلات المتروكة.")}
        className="rounded-xl border border-dashed border-border"
      />
    );
  }

  if (!(await hasFeature(store.id, FEATURE_KEYS.ABANDONED_CART))) {
    const { requiredPlan } = await checkLimit(store.id, FEATURE_KEYS.ABANDONED_CART);
    return (
      <div className="space-y-6" dir={tdir()}>
        <PageHeader title={tr("عربات التسوق المهجورة")} description={description()} />
        <UpgradeRequiredCard title={tr("السلات المتروكة")} description={tr("متابعة واسترجاع السلات المتروكة مش متاحة في باقتك الحالية.")} requiredPlanSlug={requiredPlan} />
      </div>
    );
  }

  // ── Filters (all in the URL so every view is shareable) ──────────────
  const q = readParam(params, "q")?.toLowerCase();
  const statusParam = readParam(params, "status");
  const status = RECOVERY_STATUSES.some((s) => s.value === statusParam) ? (statusParam as RecoveryStatus) : undefined;
  const periodParam = readParam(params, "days");
  const days = PERIODS.some((p) => p.value === periodParam) ? Number(periodParam) : 30;
  const openKey = readParam(params, "cart");

  const now = new Date();
  const [all, coupons] = await Promise.all([
    loadAbandonedCarts(store.id, days),
    prisma.coupon.findMany({
      where: { AND: [{ storeId: store.id }, couponStatusWhere("active", now, prisma.coupon.fields.usageLimit)] },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { code: true, type: true, value: true },
    }),
  ]);

  const searched = q
    ? all.filter(
        (c) =>
          c.fullName?.toLowerCase().includes(q) ||
          c.phone?.includes(q) ||
          c.items.some((i) => i.name.toLowerCase().includes(q)),
      )
    : all;

  // Tab counts share search + period with the list, so each number matches its tab.
  const countFor = (s: RecoveryStatus) => searched.filter((c) => c.status === s).length;
  const filtered = status ? searched.filter((c) => c.status === status) : searched;
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(readPage(params), totalPages);
  const rows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const open = all.filter((c) => c.status !== "recovered");
  const recovered = all.filter((c) => c.status === "recovered");
  const openValue = open.reduce((s, c) => s + c.value, 0);
  const recoveredValue = recovered.reduce((s, c) => s + c.value, 0);
  const openCart = openKey ? (all.find((c) => c.key === openKey && c.status !== "recovered") ?? all.find((c) => c.key === openKey) ?? null) : null;

  const storeBaseUrl =
    store.customDomain && store.customDomainStatus === "ACTIVE" ? `https://${store.customDomain}` : buildStoreUrl(store.slug);
  const currentPage = readParam(params, "page");
  const openHref = (key: string) => hrefWith(BASE_PATH, params, { cart: key, page: currentPage });
  const hasFilters = Boolean(q || status || periodParam);
  const periodLabel = PERIODS.find((p) => Number(p.value) === days)?.label ?? tr("آخر ٣٠ يوم");

  return (
    <div className="space-y-6" dir={tdir()}>
      <PageHeader
        title={tr("السلات المتروكة")}
        description={
          all.length ? (
            <>
              {periodLabel}:{" "}
              <span className="font-medium text-foreground">
                {tr("{0} سلة بـ {1}", nf.format(open.length), money.format(openValue / 100))}
              </span>{" "}{tr("مستنية")}
              {recovered.length > 0 && (
                <>
                  {" "}{tr("· رجّعت")}{" "}
                  <span className="font-medium text-emerald-700 dark:text-emerald-400">
                    {tr("{0} بـ {1}", nf.format(recovered.length), money.format(recoveredValue / 100))}
                  </span>
                </>
              )}
            </>
          ) : (
            description()
          )
        }
      />

      {all.length === 0 && !hasFilters ? (
        <div className="rounded-xl border border-dashed border-border">
          <EmptyState
            icon={ShoppingCart}
            title={tr("مفيش سلات متروكة")}
            description={tr("أول ما عميل يسيب منتجات في السلة أكتر من ساعة من غير ما يطلب، هتظهر هنا — ولو كتب رقمه في صفحة الدفع هتقدر تبعتله على الواتساب بضغطة.")}
          />
        </div>
      ) : (
        <div className="space-y-4">
          <FilterTabs
            label={tr("حالة السلة")}
            param="status"
            basePath={BASE_PATH}
            searchParams={params}
            tabs={[
              { label: tr("الكل"), count: searched.length },
              ...RECOVERY_STATUSES.map((s) => ({ label: s.label, value: s.value, count: countFor(s.value) })),
            ]}
          />

          <DataCard
            toolbar={
              <>
                <SearchInput placeholder={tr("ابحث بالاسم أو الموبايل أو المنتج")} />
                <SelectFilter label={tr("الفترة")} param="days" allLabel={tr("آخر ٣٠ يوم")} options={PERIODS} />
              </>
            }
            footer={
              total > 0 ? (
                <Pagination page={page} pageSize={PAGE_SIZE} total={total} basePath={BASE_PATH} searchParams={params} noun={tr("سلة")} />
              ) : undefined
            }
          >
            {rows.length > 0 ? (
              <CartsTable carts={rows} openHref={openHref} now={now.getTime()} />
            ) : (
              <EmptyState
                icon={SearchX}
                title={tr("مفيش سلات بالفلاتر دي")}
                description={q ? tr("مفيش نتايج لـ \"{0}\".", q) : tr("جرّب حالة أو فترة تانية.")}
                action={
                  hasFilters && (
                    <Button asChild variant="outline" size="sm">
                      <Link href={BASE_PATH}>{tr("مسح الفلاتر")}</Link>
                    </Button>
                  )
                }
              />
            )}
          </DataCard>
        </div>
      )}

      <RecoverDialog
        cart={openCart}
        storeName={store.name}
        storeBaseUrl={storeBaseUrl}
        coupons={coupons.map((c) => ({ code: c.code, label: formatCouponValue(c.type, c.value) }))}
      />
    </div>
  );
}

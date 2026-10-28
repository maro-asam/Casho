import { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, Inbox, SearchX } from "lucide-react";
import { SuggestedOrderStatus } from "@prisma/client";

import { LargeTitle, Pager, Segmented, StatusText, Tag, Unavailable, appleButton, initialOf, readPage, readParam, type PillTone, type SearchParamsRecord } from "@/components/saas-page";
import { GetInstagramStatsAction, GetSuggestedOrdersAction } from "@/actions/instagram/instagram.actions";
import { cn } from "@/lib/utils";
import { intlLocale, tr } from "@/lib/i18n/dashboard";
import { loadDashboardLocale } from "@/lib/i18n/dashboard/server";
import { INSTAGRAM_ORDERS_ENABLED } from "@/lib/instagram/feature";
import { ConfidenceBadge } from "./_components/ConfidenceBadge";
import { ConnectButton } from "./_components/ConnectButton";
import { ConnectionStatus, InstagramGlyph } from "./_components/ConnectionStatus";
import { RejectDialog } from "./_components/RejectDialog";

export async function generateMetadata(): Promise<Metadata> {
  await loadDashboardLocale();
  return { title: tr("انستجرام") };
}

const BASE_PATH = "/instagram";
/** Matches GetSuggestedOrdersAction's page size. */
const PAGE_SIZE = 10;

const STATUS_META: Record<SuggestedOrderStatus, { label: string; tone: PillTone }> = {
  PENDING: { get label() { return tr("قيد المراجعة"); }, tone: "warning" },
  APPROVED: { get label() { return tr("معتمد"); }, tone: "success" },
  REJECTED: { get label() { return tr("مرفوض"); }, tone: "neutral" },
  EXPIRED: { get label() { return tr("منتهي الصلاحية"); }, tone: "neutral" },
};

const HOW_IT_WORKS = [
  { get title() { return tr("اربط حساب انستجرام"); }, get desc() { return tr("اتصل بحسابك التجاري على انستجرام بنقرة واحدة"); } },
  { get title() { return tr("الذكاء الاصطناعي يحلل محادثاتك"); }, get desc() { return tr("يقرأ النظام رسائلك ويكتشف المحادثات التي تحتوي على طلبات شراء"); } },
  { get title() { return tr("راجع الطلبات المقترحة"); }, get desc() { return tr("ستصلك إشعارات بالطلبات المكتشفة وتقدر تراجعها وتعتمدها"); } },
  { get title() { return tr("تحويل إلى طلب حقيقي"); }, get desc() { return tr("بعد موافقتك ينشأ الطلب تلقائياً في لوحة الطلبات"); } },
];

/** Result of the OAuth round-trip (`?success=` / `?error=` from /api/instagram/oauth/callback). */
function oauthNotice(params: SearchParamsRecord | undefined): { tone: "success" | "danger"; text: string } | null {
  if (readParam(params, "success") === "connected") return { tone: "success", text: tr("تم ربط حساب انستجرام. الطلبات اللي هتتكتشف من الرسايل هتظهر هنا.") };
  switch (readParam(params, "error")) {
    case undefined:
      return null;
    case "denied":
      return { tone: "danger", text: tr("الربط اتلغى من انستجرام. جرّب تاني ووافق على الصلاحيات المطلوبة.") };
    case "no_store":
      return { tone: "danger", text: tr("لازم يكون عندك متجر قبل ما تربط انستجرام.") };
    default:
      return { tone: "danger", text: tr("الربط ما كملش. جرّب تاني بعد شوية.") };
  }
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat(intlLocale(), { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(date));
}

export default async function InstagramPage({ searchParams }: { searchParams?: Promise<SearchParamsRecord> }) {
  await loadDashboardLocale();

  if (!INSTAGRAM_ORDERS_ENABLED) {
    return (
      <div className="space-y-6">
        <LargeTitle title={tr("انستجرام")} subtitle={tr("الذكاء الاصطناعي بيقرا رسايل الـ DM ويطلّعلك منها طلبات جاهزة تراجعها وتعتمدها.")} />
        <ConnectHero comingSoon />
      </div>
    );
  }

  const params = await searchParams;
  const rawStatus = readParam(params, "status");
  const status = rawStatus && rawStatus in SuggestedOrderStatus ? (rawStatus as SuggestedOrderStatus) : undefined;
  const page = readPage(params);

  const [stats, list] = await Promise.all([GetInstagramStatsAction(), GetSuggestedOrdersAction({ page, status })]);
  const connection = stats?.connection ?? null;
  const notice = oauthNotice(params);
  // Orders found before a disconnect stay reviewable.
  const showOrders = !!connection || list.total > 0 || !!status;

  return (
    <div className="space-y-6">
      <LargeTitle
        title={tr("انستجرام")}
        subtitle={tr("الذكاء الاصطناعي بيقرا رسايل الـ DM ويطلّعلك منها طلبات جاهزة تراجعها وتعتمدها.")}
      />

      {notice && (
        <p role="status" className={cn("flex items-center gap-2.5 rounded-[22px] px-5 py-4 text-[15px]", notice.tone === "success" ? "bg-(--sys-green)/12" : "bg-(--sys-red)/10")}>
          <span aria-hidden className={cn("size-2 shrink-0 rounded-full", notice.tone === "success" ? "bg-(--sys-green)" : "bg-(--sys-red)")} />
          {notice.text}
        </p>
      )}

      {connection ? (
        <ConnectionStatus
          connection={connection}
          stats={{ conversations: stats?.totalConversations ?? 0, pending: stats?.pendingCount ?? 0, approved: stats?.approvedCount ?? 0 }}
        />
      ) : (
        <ConnectHero />
      )}

      {showOrders && (
        <section aria-labelledby="ig-orders-title" className="space-y-4">
          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-end sm:justify-between">
            <h2 id="ig-orders-title" className="text-[22px] leading-7 font-bold">
              {tr("الطلبات المقترحة")}
            </h2>
            <Segmented
              label={tr("حالة الطلب")}
              param="status"
              basePath={BASE_PATH}
              searchParams={params}
              segments={[
                { label: tr("الكل") },
                { label: STATUS_META.PENDING.label, value: "PENDING", count: stats?.pendingCount ?? undefined },
                { label: STATUS_META.APPROVED.label, value: "APPROVED" },
                { label: STATUS_META.REJECTED.label, value: "REJECTED" },
              ]}
            />
          </div>

          <div className="apple-card overflow-hidden">
            {list.orders.length === 0 ? (
              status ? (
                <Unavailable
                  icon={SearchX}
                  title={tr("لا توجد طلبات بهذه الحالة حالياً")}
                  action={
                    <Link href={BASE_PATH} className={appleButton.tinted}>
                      {tr("عرض الكل")}
                    </Link>
                  }
                />
              ) : (
                <Unavailable icon={Inbox} title={tr("لا توجد طلبات مقترحة")} description={tr("لما يكتشف الذكاء الاصطناعي طلبات من محادثاتك ستظهر هنا للمراجعة")} />
              )
            ) : (
              <ul className="apple-rows py-1 [--row-inset:72px]">
                {list.orders.map((order) => {
                  const meta = STATUS_META[order.status];
                  const name = order.customerName ?? tr("عميل من انستجرام");
                  return (
                    <li key={order.id} className="relative flex items-center gap-3 px-5 py-3 transition-colors hover:bg-muted/60">
                      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-linear-to-b from-[#a1a1a6] to-[#8e8e93] text-[15px] font-semibold text-white">
                        {initialOf(name)}
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <Link href={`${BASE_PATH}/${order.id}`} className="truncate text-[15px] font-medium after:absolute after:inset-0">
                            {name}
                          </Link>
                          <ConfidenceBadge confidence={order.confidence} className="hidden sm:inline-flex" />
                        </div>
                        <p className="truncate text-[13px] text-muted-foreground">
                          {order.firstProductName ? (
                            <>
                              {order.firstProductName}
                              {order.itemCount > 1 && ` +${order.itemCount - 1}`}
                            </>
                          ) : (
                            tr("منتج غير محدد")
                          )}
                          {order.customerPhone && (
                            <>
                              {" · "}
                              <span dir="ltr">{order.customerPhone}</span>
                            </>
                          )}
                          <span className="lg:hidden"> · {formatDate(order.createdAt)}</span>
                        </p>
                      </div>

                      <span className="hidden w-32 shrink-0 text-[13px] text-muted-foreground lg:block">{formatDate(order.createdAt)}</span>
                      <StatusText tone={meta.tone} className="hidden w-28 shrink-0 md:inline-flex">
                        {meta.label}
                      </StatusText>
                      {order.status === "PENDING" && (
                        <span className="hidden sm:block">
                          <RejectDialog suggestedOrderId={order.id} />
                        </span>
                      )}
                      <ChevronLeft className="size-4 shrink-0 text-(--label-3) ltr:-scale-x-100" strokeWidth={2.2} />
                    </li>
                  );
                })}
              </ul>
            )}

            {list.total > 0 && (
              <div className="border-t-[0.5px] border-border">
                <Pager page={page} pageSize={PAGE_SIZE} total={list.total} basePath={BASE_PATH} searchParams={params} noun={tr("طلب")} />
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

/** Not connected: one idea — connect — with the how-it-works steps as a grouped list. `comingSoon` swaps the button for a label. */
function ConnectHero({ comingSoon = false }: { comingSoon?: boolean }) {
  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <section className="apple-card flex flex-col items-center justify-center px-6 py-12 text-center lg:col-span-3">
        <InstagramGlyph className="mb-5 size-16 rounded-[18px]" />
        {comingSoon && (
          <Tag tone="accent" className="mb-3">
            {tr("قريباً")}
          </Tag>
        )}
        <h2 className="text-[28px] leading-[34px] font-bold">{tr("حوّل رسايل انستجرام لطلبات")}</h2>
        <p className="mt-2 max-w-md text-[15px] leading-[22px] text-muted-foreground">
          {tr("وصّل حسابك التجاري على انستجرام واترك الذكاء الاصطناعي يكتشف طلبات الشراء من محادثاتك تلقائياً")}
        </p>
        {comingSoon ? (
          <p className="mt-6 max-w-sm text-[13px] leading-[18px] text-muted-foreground">
            {tr("بنجهّز الميزة دي ومش متاحة للربط دلوقتي. هنبلّغك أول ما تبقى جاهزة.")}
          </p>
        ) : (
          <>
            <div className="mt-6">
              <ConnectButton />
            </div>
            <p className="mt-4 max-w-sm text-[13px] leading-[18px] text-muted-foreground">
              {tr("محتاج حساب Business أو Creator على انستجرام، مربوط بصفحة Facebook.")}
            </p>
          </>
        )}
      </section>

      <section aria-labelledby="ig-how-title" className="apple-card overflow-hidden lg:col-span-2">
        <h2 id="ig-how-title" className="px-5 pt-5 pb-2 text-[17px] leading-[22px] font-semibold">
          {tr("كيف يعمل؟")}
        </h2>
        <ol className="apple-rows pb-2 [--row-inset:61px]">
          {HOW_IT_WORKS.map((step, i) => (
            <li key={step.title} className="flex items-start gap-3 px-5 py-3">
              <span className="grid size-[29px] shrink-0 place-items-center rounded-full bg-muted text-[13px] font-semibold text-foreground tabular-nums">
                {i + 1}
              </span>
              <div className="min-w-0">
                <p className="text-[15px] leading-5">{step.title}</p>
                <p className="mt-0.5 text-[13px] leading-[18px] text-muted-foreground">{step.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

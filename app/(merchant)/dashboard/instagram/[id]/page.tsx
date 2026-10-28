import { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronRight, MessageSquare, ShoppingBag, Sparkles } from "lucide-react";

import { Card, Row, Rows, StatusText, appleButton, type PillTone } from "@/components/saas-page";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { GetSuggestedOrderDetailAction } from "@/actions/instagram/instagram.actions";
import { ConfidenceBadge } from "../_components/ConfidenceBadge";
import { RejectDialog } from "../_components/RejectDialog";
import { ConversationViewer } from "./_components/ConversationViewer";
import { ApproveForm } from "./_components/ApproveForm";
import { intlLocale, tr } from "@/lib/i18n/dashboard";
import { loadDashboardLocale } from "@/lib/i18n/dashboard/server";
import { INSTAGRAM_ORDERS_ENABLED } from "@/lib/instagram/feature";

export async function generateMetadata(): Promise<Metadata> {
  await loadDashboardLocale();
  return {
  title: tr("مراجعة الطلب المقترح"),
};
}

type Props = {
  params: Promise<{ id: string }>;
};

const STATUS_META: Record<string, { label: string; tone: PillTone }> = {
  PENDING: { get label() { return tr("قيد المراجعة"); }, tone: "warning" },
  APPROVED: { get label() { return tr("معتمد"); }, tone: "success" },
  REJECTED: { get label() { return tr("مرفوض"); }, tone: "neutral" },
  EXPIRED: { get label() { return tr("منتهي الصلاحية"); }, tone: "neutral" },
};

export default async function SuggestedOrderDetailPage({ params }: Props) {
  await loadDashboardLocale();
  if (!INSTAGRAM_ORDERS_ENABLED) redirect("/instagram");
  const { id } = await params;

  const [order, userId] = await Promise.all([
    GetSuggestedOrderDetailAction(id),
    requireUserId(),
  ]);

  if (!order) notFound();

  // Get store products for the approve form
  const store = await prisma.store.findFirst({
    where: { userId },
    select: { id: true },
  });

  const storeProducts = store
    ? await prisma.product.findMany({
        where: { storeId: store.id, isActive: true },
        select: { id: true, name: true, price: true },
        orderBy: { name: "asc" },
      })
    : [];

  const isPending = order.status === "PENDING";

  const meta = STATUS_META[order.status];

  return (
    <div className="space-y-6">
      <header className="space-y-3 pt-2">
        <Link
          href="/instagram"
          className="apple-press -ms-1.5 inline-flex h-9 items-center gap-0.5 rounded-full ps-1 pe-3 text-[15px] text-primary hover:bg-primary/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ChevronRight className="size-5 ltr:-scale-x-100" strokeWidth={2.2} />
          {tr("انستجرام")}
        </Link>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0 space-y-1.5">
            <h1 className="text-[34px] leading-[41px] font-bold">{tr("طلب مقترح")}</h1>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[13px] text-muted-foreground">
              <StatusText tone={meta.tone}>{meta.label}</StatusText>
              <ConfidenceBadge confidence={order.confidence} />
              <span>
                #{order.id.slice(0, 8)} ·{" "}
                {new Intl.DateTimeFormat(intlLocale(), { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }).format(new Date(order.createdAt))}
              </span>
            </div>
          </div>
          {isPending && <RejectDialog suggestedOrderId={order.id} />}
        </div>
      </header>

      {order.status === "APPROVED" && order.orderId && (
        <div className="flex flex-col gap-3 rounded-[22px] bg-(--sys-green)/12 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[15px]">{tr("تم اعتماد هذا الطلب وتحويله لطلب حقيقي")}</p>
          <Link href={`/dashboard/orders/${order.orderId}`} className={appleButton.tinted}>
            <ShoppingBag className="size-4" />
            {tr("عرض الطلب")}
          </Link>
        </div>
      )}

      {order.status === "REJECTED" && (
        <p className="rounded-[22px] bg-muted px-5 py-4 text-[15px]">{tr("تم رفض هذا الطلب المقترح")}</p>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <Card title={tr("المحادثة الأصلية")} subtitle={tr("{0} رسالة", order.conversation.messages.length)} icon={MessageSquare}>
            <div className="px-5 pb-5">
              <ConversationViewer
                messages={order.conversation.messages}
                customerName={order.conversation.customerIgName ?? order.conversation.customerIgUsername ?? order.customerName}
              />
            </div>
          </Card>

          {/* Human-readable notes, not internal reasoning. */}
          {order.aiNotes && (
            <Card title={tr("ملاحظات الذكاء الاصطناعي")} icon={Sparkles}>
              <p className="px-5 pb-5 text-[15px] leading-[22px] text-muted-foreground">{order.aiNotes}</p>
            </Card>
          )}
        </div>

        <div>{isPending ? <ApproveForm order={order} storeProducts={storeProducts} /> : <ReadOnlySummary order={order} />}</div>
      </div>
    </div>
  );
}

function ReadOnlySummary({ order }: { order: Awaited<ReturnType<typeof GetSuggestedOrderDetailAction>> }) {
  if (!order) return null;

  function formatPrice(piasters: number | null) {
    if (piasters == null) return "—";
    return new Intl.NumberFormat(intlLocale(), { style: "currency", currency: "EGP", maximumFractionDigits: 0 }).format(piasters / 100);
  }

  return (
    <Card title={tr("ملخص الطلب المقترح")}>
      <Rows>
        {order.customerName && <Row label={tr("الاسم")}>{order.customerName}</Row>}
        {order.customerPhone && (
          <Row label={tr("الهاتف")}>
            <span dir="ltr">{order.customerPhone}</span>
          </Row>
        )}
        {order.customerAddress && <Row label={tr("العنوان")}>{order.customerAddress}</Row>}
      </Rows>

      <ul className="apple-rows mt-1 border-t-[0.5px] border-border pb-2 [--row-inset:20px]">
        {order.items.map((item) => (
          <li key={item.id} className="flex items-start justify-between gap-3 px-5 py-3 text-[15px]">
            <div className="min-w-0">
              <p>{item.matchedProduct?.name ?? item.aiProductName}</p>
              {item.aiVariant && <p className="text-[13px] text-muted-foreground">{item.aiVariant}</p>}
            </div>
            <div className="shrink-0 text-end tabular-nums">
              <p>{formatPrice(item.unitPrice)}</p>
              <p className="text-[13px] text-muted-foreground">× {item.aiQuantity}</p>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}

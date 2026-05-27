import { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowRight,
  MessageSquare,
  CheckCircle2,
  XCircle,
  ShoppingBag,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/actions/auth/require-user-id.actions";
import {
  GetSuggestedOrderDetailAction,
} from "@/actions/instagram/get-suggested-orders.actions";
import { ConfidenceBadge } from "../_components/ConfidenceBadge";
import { RejectDialog } from "../_components/RejectDialog";
import { ConversationViewer } from "./_components/ConversationViewer";
import { ApproveForm } from "./_components/ApproveForm";

export const metadata: Metadata = {
  title: "مراجعة الطلب المقترح",
};

type Props = {
  params: Promise<{ id: string }>;
};

const STATUS_LABELS = {
  PENDING: "قيد المراجعة",
  APPROVED: "معتمد",
  REJECTED: "مرفوض",
  EXPIRED: "منتهي الصلاحية",
};

const STATUS_CLASSES = {
  PENDING: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  APPROVED: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  REJECTED: "bg-rose-500/10 text-rose-700 dark:text-rose-400",
  EXPIRED: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400",
};

export default async function SuggestedOrderDetailPage({ params }: Props) {
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

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon" className="rounded-xl">
            <Link href="/dashboard/suggested-orders">
              <ArrowRight className="size-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold">طلب مقترح</h1>
              <Badge
                className={cn(
                  "rounded-full border-0 text-xs",
                  STATUS_CLASSES[order.status],
                )}
              >
                {STATUS_LABELS[order.status]}
              </Badge>
              <ConfidenceBadge confidence={order.confidence} />
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">
              #{order.id.slice(0, 8)} •{" "}
              {new Intl.DateTimeFormat("ar-EG", {
                day: "numeric",
                month: "long",
                hour: "2-digit",
                minute: "2-digit",
              }).format(new Date(order.createdAt))}
            </p>
          </div>
        </div>

        {isPending && (
          <RejectDialog suggestedOrderId={order.id} />
        )}
      </div>

      {/* Already approved — show link to order */}
      {order.status === "APPROVED" && order.orderId && (
        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="size-5 text-emerald-600" />
              <p className="text-sm font-medium">تم اعتماد هذا الطلب وتحويله لطلب حقيقي</p>
            </div>
            <Button asChild variant="outline" size="sm" className="rounded-xl">
              <Link href={`/dashboard/orders/${order.orderId}`}>
                <ShoppingBag className="mr-1.5 size-4" />
                عرض الطلب
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {order.status === "REJECTED" && (
        <Card className="border-rose-500/30 bg-rose-500/5">
          <CardContent className="flex items-center gap-3 p-4">
            <XCircle className="size-5 text-rose-600" />
            <p className="text-sm font-medium">تم رفض هذا الطلب المقترح</p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left column: Conversation */}
        <div className="space-y-4">
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <MessageSquare className="size-4 text-muted-foreground" />
                المحادثة الأصلية
                <Badge variant="outline" className="rounded-full text-xs">
                  {order.conversation.messages.length} رسالة
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ConversationViewer
                messages={order.conversation.messages}
                customerName={
                  order.conversation.customerIgName ??
                  order.conversation.customerIgUsername ??
                  order.customerName
                }
              />
            </CardContent>
          </Card>

          {/* AI Notes (human-readable, not internal reasoning) */}
          {order.aiNotes && (
            <Card className="border-border shadow-sm">
              <CardContent className="p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60 mb-2">
                  ملاحظات الذكاء الاصطناعي
                </p>
                <p className="text-sm leading-6 text-muted-foreground">{order.aiNotes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right column: Approve form or read-only summary */}
        <div>
          {isPending ? (
            <ApproveForm order={order} storeProducts={storeProducts} />
          ) : (
            <ReadOnlySummary order={order} />
          )}
        </div>
      </div>
    </div>
  );
}

function ReadOnlySummary({ order }: { order: Awaited<ReturnType<typeof GetSuggestedOrderDetailAction>> }) {
  if (!order) return null;

  function formatPrice(piasters: number | null) {
    if (piasters == null) return "—";
    return new Intl.NumberFormat("ar-EG", {
      style: "currency",
      currency: "EGP",
      maximumFractionDigits: 0,
    }).format(piasters / 100);
  }

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">ملخص الطلب المقترح</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 text-sm">
          {order.customerName && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">الاسم</span>
              <span className="font-medium">{order.customerName}</span>
            </div>
          )}
          {order.customerPhone && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">الهاتف</span>
              <span className="font-medium" dir="ltr">{order.customerPhone}</span>
            </div>
          )}
          {order.customerAddress && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">العنوان</span>
              <span className="max-w-44 text-right font-medium">{order.customerAddress}</span>
            </div>
          )}
        </div>

        <Separator />

        <div className="space-y-2">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-start justify-between gap-2 text-sm">
              <div>
                <p className="font-medium">
                  {item.matchedProduct?.name ?? item.aiProductName}
                </p>
                {item.aiVariant && (
                  <p className="text-xs text-muted-foreground">{item.aiVariant}</p>
                )}
              </div>
              <div className="text-right">
                <p className="font-medium">{formatPrice(item.unitPrice)}</p>
                <p className="text-xs text-muted-foreground">× {item.aiQuantity}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

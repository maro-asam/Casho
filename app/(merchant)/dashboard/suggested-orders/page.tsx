import { Metadata } from "next";
import Link from "next/link";
import {
  Sparkles,
  FolderOpen,
  Eye,
  ChevronRight,
  ChevronLeft,
  User,
  Phone,
  Package,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import DashboardSectionHeader from "@/app/(merchant)/_components/main/DashboardSectionHeader";
import { GetSuggestedOrdersAction } from "@/actions/instagram/instagram.actions";
import { ConfidenceBadge } from "./_components/ConfidenceBadge";
import { RejectDialog } from "./_components/RejectDialog";
import { SuggestedOrderStatus } from "@prisma/client";

export const metadata: Metadata = {
  title: "الطلبات المقترحة",
};

const PAGE_SIZE = 10;

const STATUS_LABELS: Record<SuggestedOrderStatus, string> = {
  PENDING: "قيد المراجعة",
  APPROVED: "معتمد",
  REJECTED: "مرفوض",
  EXPIRED: "منتهي الصلاحية",
};

const STATUS_CLASSES: Record<SuggestedOrderStatus, string> = {
  PENDING: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  APPROVED: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  REJECTED: "bg-rose-500/10 text-rose-700 dark:text-rose-400",
  EXPIRED: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400",
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("ar-EG", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

type Props = {
  searchParams?: Promise<{ page?: string; status?: string }>;
};

export default async function SuggestedOrdersPage({ searchParams }: Props) {
  const resolved = await searchParams;
  const currentPage = Math.max(1, Number(resolved?.page) || 1);
  const statusFilter = resolved?.status as SuggestedOrderStatus | undefined;

  const { orders, total, totalPages } = await GetSuggestedOrdersAction({
    page: currentPage,
    status: statusFilter,
  });

  const tabs: Array<{ label: string; value?: SuggestedOrderStatus }> = [
    { label: "الكل" },
    { label: "قيد المراجعة", value: "PENDING" },
    { label: "معتمد", value: "APPROVED" },
    { label: "مرفوض", value: "REJECTED" },
  ];

  return (
    <div className="space-y-6" dir="rtl">
      <DashboardSectionHeader
        icon={Sparkles}
        badge={total}
        title="الطلبات المقترحة من انستجرام"
        description="طلبات اكتشفها الذكاء الاصطناعي من محادثاتك — راجعها واعتمدها"
        actionLabel="إعدادات الربط"
        actionHref="/instagram"
      />

      {/* Status filter tabs */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const isActive =
            statusFilter === tab.value || (!statusFilter && !tab.value);
          const href = tab.value
            ? `/dashboard/suggested-orders?status=${tab.value}`
            : "/suggested-orders";

          return (
            <Link key={tab.label} href={href}>
              <Badge
                variant={isActive ? "default" : "outline"}
                className={cn(
                  "cursor-pointer rounded-full px-3 py-1 text-xs transition-colors",
                  !isActive && "hover:bg-muted",
                )}
              >
                {tab.label}
              </Badge>
            </Link>
          );
        })}
      </div>

      {orders.length === 0 ? (
        <Card className="border-dashed border-border/40">
          <CardContent className="flex min-h-72 flex-col items-center justify-center text-center">
            <div className="mb-4 grid size-16 place-items-center rounded-2xl bg-muted text-muted-foreground">
              <FolderOpen className="size-7" />
            </div>
            <h2 className="text-xl font-bold">لا توجد طلبات مقترحة</h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              {statusFilter
                ? "لا توجد طلبات بهذه الحالة حالياً"
                : "لما يكتشف الذكاء الاصطناعي طلبات من محادثاتك ستظهر هنا للمراجعة"}
            </p>
            {!statusFilter && (
              <Button asChild variant="outline" className="mt-4 rounded-xl">
                <Link href="/instagram">ربط انستجرام</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="border-border shadow-sm">
            <CardContent className="divide-y divide-border/30 p-0">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="flex flex-col gap-3 p-4 transition-colors hover:bg-muted/20 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl bg-muted">
                      <Sparkles className="size-4 text-amber-500" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <ConfidenceBadge confidence={order.confidence} size="sm" />
                        <Badge
                          className={cn(
                            "rounded-full border-0 text-xs",
                            STATUS_CLASSES[order.status],
                          )}
                        >
                          {STATUS_LABELS[order.status]}
                        </Badge>
                      </div>

                      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                        {order.customerName && (
                          <span className="flex items-center gap-1 font-medium">
                            <User className="size-3.5 text-muted-foreground" />
                            {order.customerName}
                          </span>
                        )}
                        {order.customerPhone && (
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Phone className="size-3.5" />
                            {order.customerPhone}
                          </span>
                        )}
                        {order.firstProductName && (
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Package className="size-3.5" />
                            {order.firstProductName}
                            {order.itemCount > 1 && ` +${order.itemCount - 1}`}
                          </span>
                        )}
                      </div>

                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatDate(order.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2 sm:ps-4">
                    {order.status === "PENDING" && (
                      <RejectDialog suggestedOrderId={order.id} />
                    )}
                    <Button
                      asChild
                      variant={order.status === "PENDING" ? "default" : "outline"}
                      size="sm"
                      className="rounded-xl"
                    >
                      <Link href={`/dashboard/suggested-orders/${order.id}`}>
                        <Eye className="mr-1.5 size-4" />
                        {order.status === "PENDING" ? "مراجعة" : "عرض"}
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-border/30 bg-background px-5 py-4 sm:flex-row">
              <p className="text-sm text-muted-foreground">
                الصفحة{" "}
                <span className="font-bold text-foreground">{currentPage}</span>{" "}
                من{" "}
                <span className="font-bold text-foreground">{totalPages}</span>
              </p>
              <div className="flex items-center gap-2">
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  disabled={currentPage <= 1}
                  className="rounded-xl"
                >
                  <Link
                    href={
                      currentPage > 1
                        ? `/dashboard/suggested-orders?page=${currentPage - 1}${statusFilter ? `&status=${statusFilter}` : ""}`
                        : "#"
                    }
                  >
                    <ChevronRight className="ml-1 size-4" />
                    السابق
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= totalPages}
                  className="rounded-xl"
                >
                  <Link
                    href={
                      currentPage < totalPages
                        ? `/dashboard/suggested-orders?page=${currentPage + 1}${statusFilter ? `&status=${statusFilter}` : ""}`
                        : "#"
                    }
                  >
                    التالي
                    <ChevronLeft className="mr-1 size-4" />
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

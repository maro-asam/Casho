"use client";

import { useMemo, useState, useTransition, type ComponentType } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  CheckCheck,
  CircleDollarSign,
  Inbox,
  MessageCircle,
  PackageCheck,
  ShoppingCart,
  Sparkles,
  Trash2,
  Wrench,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { NotificationDTO } from "@/actions/notifications/notifications.actions";
import {
  DeleteNotificationAction,
  DeleteReadNotificationsAction,
  MarkAllNotificationsAsReadAction,
  MarkNotificationAsReadAction,
} from "@/actions/notifications/notifications.actions";
import DashboardSectionHeader from "@/app/(merchant)/_components/main/DashboardSectionHeader";

type NotificationsPageClientProps = {
  initialNotifications: NotificationDTO[];
};

type Filter = "all" | "unread" | "read";

const notificationIcons: Partial<
  Record<NotificationDTO["type"], ComponentType<{ className?: string }>>
> = {
  NEW_ORDER: ShoppingCart,
  ORDER_STATUS_CHANGED: PackageCheck,
  TOPUP_REQUEST_CREATED: CircleDollarSign,
  TOPUP_APPROVED: CircleDollarSign,
  TOPUP_REJECTED: CircleDollarSign,
  SERVICE_REQUEST_CREATED: Wrench,
  SERVICE_REQUEST_UPDATED: Wrench,
  SUPPORT_REQUEST_CREATED: MessageCircle,
  POWERED_BY_APPROVED: Sparkles,
  POWERED_BY_REJECTED: Sparkles,
  SUBSCRIPTION_EXPIRING: Bell,
  SUBSCRIPTION_EXPIRED: Bell,
  STORE_ACTIVATED: Sparkles,
  STORE_PAST_DUE: Bell,
  SYSTEM: Bell,
};

const notificationIconColors: Partial<Record<NotificationDTO["type"], string>> = {
  NEW_ORDER: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  ORDER_STATUS_CHANGED: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  TOPUP_APPROVED: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  TOPUP_REJECTED: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  TOPUP_REQUEST_CREATED: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  SERVICE_REQUEST_CREATED: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
  SERVICE_REQUEST_UPDATED: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
  SUPPORT_REQUEST_CREATED: "bg-teal-500/10 text-teal-600 dark:text-teal-400",
  STORE_ACTIVATED: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  STORE_PAST_DUE: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  SUBSCRIPTION_EXPIRING: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  SUBSCRIPTION_EXPIRED: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  POWERED_BY_APPROVED: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  POWERED_BY_REJECTED: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  SYSTEM: "bg-muted text-muted-foreground",
};

function formatDate(dateIso: string) {
  return new Intl.DateTimeFormat("ar-EG", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(dateIso));
}

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "الكل" },
  { key: "unread", label: "غير مقروء" },
  { key: "read", label: "مقروء" },
];

export default function NotificationsPageClient({
  initialNotifications,
}: NotificationsPageClientProps) {
  const router = useRouter();
  const [notifications, setNotifications] = useState(initialNotifications);
  const [filter, setFilter] = useState<Filter>("all");
  const [isPending, startTransition] = useTransition();

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.readAt).length,
    [notifications],
  );

  const visibleNotifications = useMemo(() => {
    if (filter === "unread") return notifications.filter((n) => !n.readAt);
    if (filter === "read") return notifications.filter((n) => n.readAt);
    return notifications;
  }, [filter, notifications]);

  function markOneAsRead(id: string) {
    const now = new Date().toISOString();
    setNotifications((cur) =>
      cur.map((n) => (n.id === id && !n.readAt ? { ...n, readAt: now } : n)),
    );
    startTransition(() => { void MarkNotificationAsReadAction(id); });
  }

  function openNotification(notification: NotificationDTO) {
    if (!notification.readAt) markOneAsRead(notification.id);
    if (notification.href) router.push(notification.href);
  }

  function markAllAsRead() {
    const now = new Date().toISOString();
    setNotifications((cur) =>
      cur.map((n) => ({ ...n, readAt: n.readAt ?? now })),
    );
    startTransition(() => { void MarkAllNotificationsAsReadAction(); });
  }

  function deleteNotification(id: string) {
    setNotifications((cur) => cur.filter((n) => n.id !== id));
    startTransition(() => { void DeleteNotificationAction(id); });
  }

  function deleteReadNotifications() {
    setNotifications((cur) => cur.filter((n) => !n.readAt));
    startTransition(() => { void DeleteReadNotificationsAction(); });
  }

  return (
    <div className="space-y-6" dir="rtl">
      <DashboardSectionHeader
        icon={Bell}
        title="الإشعارات"
        description="متابعة الطلبات الجديدة، تحديثات الرصيد، وكل ما يخص متجرك."
        badge={unreadCount > 0 ? unreadCount : undefined}
      />

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1 rounded-xl border border-border/60 bg-muted/30 p-1 w-fit">
          {FILTERS.map(({ key, label }) => {
            const count =
              key === "all"
                ? notifications.length
                : key === "unread"
                  ? unreadCount
                  : notifications.length - unreadCount;

            return (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                  filter === key
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {label}
                <span
                  className={cn(
                    "min-w-5 rounded-full px-1.5 py-0.5 text-center text-[11px] font-bold leading-none",
                    filter === key
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2 rounded-xl"
            disabled={unreadCount === 0 || isPending}
            onClick={markAllAsRead}
          >
            <CheckCheck className="size-3.5" />
            تعليم الكل كمقروء
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="gap-2 rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive"
            disabled={notifications.every((n) => !n.readAt) || isPending}
            onClick={deleteReadNotifications}
          >
            <Trash2 className="size-3.5" />
            حذف المقروء
          </Button>
        </div>
      </div>

      {/* List */}
      {visibleNotifications.length === 0 ? (
        <Card className="... border-dashed border-border/60">
          <CardContent className="flex min-h-72 flex-col items-center justify-center gap-4 text-center">
            <div className="grid size-14 place-items-center rounded-2xl bg-muted text-muted-foreground">
              <Inbox className="size-7" />
            </div>
            <div>
              <p className="font-bold">مفيش إشعارات هنا</p>
              <p className="mt-1 max-w-xs text-sm leading-7 text-muted-foreground">
                لما يحصل نشاط جديد في المتجر، الإشعارات هتظهر هنا تلقائيًا.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="... border-border bg-background shadow-sm">
          <div className="divide-y divide-border/50">
            {visibleNotifications.map((notification) => {
              const Icon = notificationIcons[notification.type] ?? Bell;
              const iconColor =
                notificationIconColors[notification.type] ??
                "bg-muted text-muted-foreground";
              const unread = !notification.readAt;

              return (
                <div
                  key={notification.id}
                  className={cn(
                    "flex items-start gap-4 px-5 py-4 transition-colors first:rounded-t-[2rem] last:rounded-b-[2rem]",
                    unread ? "bg-primary/5 hover:bg-primary/8" : "hover:bg-muted/30",
                  )}
                >
                  {/* Icon */}
                  <div
                    className={cn(
                      "mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl",
                      unread ? "bg-primary/10 text-primary" : iconColor,
                    )}
                  >
                    <Icon className="size-4" />
                  </div>

                  {/* Content */}
                  <button
                    type="button"
                    className="min-w-0 flex-1 text-right"
                    onClick={() => openNotification(notification)}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold">{notification.title}</span>
                      {unread && (
                        <Badge className="h-4 rounded-full border-0 bg-primary/10 px-1.5 text-[10px] font-bold text-primary hover:bg-primary/10">
                          جديد
                        </Badge>
                      )}
                    </div>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      {notification.message}
                    </p>
                    <p className="mt-1.5 text-xs text-muted-foreground/60">
                      {formatDate(notification.createdAt)}
                    </p>
                  </button>

                  {/* Actions */}
                  <div className="flex shrink-0 items-center gap-1 pt-0.5">
                    {unread && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 rounded-lg px-2 text-xs text-muted-foreground hover:text-foreground"
                        onClick={() => markOneAsRead(notification.id)}
                      >
                        مقروء
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-7 rounded-lg text-muted-foreground/50 hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => deleteNotification(notification.id)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}

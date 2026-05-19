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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { NotificationDTO } from "@/actions/notifications/notifications.actions";
import {
  DeleteNotificationAction,
  DeleteReadNotificationsAction,
  MarkAllNotificationsAsReadAction,
  MarkNotificationAsReadAction,
} from "@/actions/notifications/notifications.actions";

type NotificationsPageClientProps = {
  initialNotifications: NotificationDTO[];
  initialUnreadCount: number;
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

function formatDate(dateIso: string) {
  return new Intl.DateTimeFormat("ar-EG", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(dateIso));
}

export default function NotificationsPageClient({
  initialNotifications,
  initialUnreadCount,
}: NotificationsPageClientProps) {
  const router = useRouter();
  const [notifications, setNotifications] = useState(initialNotifications);
  const [filter, setFilter] = useState<Filter>("all");
  const [isPending, startTransition] = useTransition();

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.readAt).length,
    [notifications],
  );

  const visibleNotifications = useMemo(() => {
    if (filter === "unread") {
      return notifications.filter((notification) => !notification.readAt);
    }

    if (filter === "read") {
      return notifications.filter((notification) => notification.readAt);
    }

    return notifications;
  }, [filter, notifications]);

  function markOneAsRead(notificationId: string) {
    const now = new Date().toISOString();

    setNotifications((current) =>
      current.map((notification) =>
        notification.id === notificationId && !notification.readAt
          ? { ...notification, readAt: now }
          : notification,
      ),
    );

    startTransition(() => {
      void MarkNotificationAsReadAction(notificationId);
    });
  }

  function openNotification(notification: NotificationDTO) {
    if (!notification.readAt) {
      markOneAsRead(notification.id);
    }

    if (notification.href) {
      router.push(notification.href);
    }
  }

  function markAllAsRead() {
    const now = new Date().toISOString();

    setNotifications((current) =>
      current.map((notification) => ({ ...notification, readAt: notification.readAt ?? now })),
    );

    startTransition(() => {
      void MarkAllNotificationsAsReadAction();
    });
  }

  function deleteNotification(notificationId: string) {
    setNotifications((current) =>
      current.filter((notification) => notification.id !== notificationId),
    );

    startTransition(() => {
      void DeleteNotificationAction(notificationId);
    });
  }

  function deleteReadNotifications() {
    setNotifications((current) => current.filter((notification) => !notification.readAt));

    startTransition(() => {
      void DeleteReadNotificationsAction();
    });
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <Badge variant="outline" className="w-fit">
            Notifications
          </Badge>
          <h1 className="text-2xl font-black tracking-tight md:text-3xl">الإشعارات</h1>
          <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
            هنا هتلاقي الأوردرات الجديدة، تحديثات الرصيد، طلبات الدعم، وأي حاجة مهمة تخص متجرك.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="gap-2"
            disabled={unreadCount === 0 || isPending}
            onClick={markAllAsRead}
          >
            <CheckCheck className="h-4 w-4" />
            تعليم الكل كمقروء
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="gap-2 text-destructive hover:text-destructive"
            disabled={notifications.every((notification) => !notification.readAt) || isPending}
            onClick={deleteReadNotifications}
          >
            <Trash2 className="h-4 w-4" />
            حذف المقروء
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={cn(
            "rounded-2xl border bg-card p-4 text-start transition hover:bg-muted/40",
            filter === "all" && "border-primary bg-primary/5",
          )}
        >
          <p className="text-sm text-muted-foreground">كل الإشعارات</p>
          <p className="mt-1 text-2xl font-black">{notifications.length}</p>
        </button>
        <button
          type="button"
          onClick={() => setFilter("unread")}
          className={cn(
            "rounded-2xl border bg-card p-4 text-start transition hover:bg-muted/40",
            filter === "unread" && "border-primary bg-primary/5",
          )}
        >
          <p className="text-sm text-muted-foreground">غير مقروء</p>
          <p className="mt-1 text-2xl font-black">{unreadCount}</p>
        </button>
        <button
          type="button"
          onClick={() => setFilter("read")}
          className={cn(
            "rounded-2xl border bg-card p-4 text-start transition hover:bg-muted/40",
            filter === "read" && "border-primary bg-primary/5",
          )}
        >
          <p className="text-sm text-muted-foreground">مقروء</p>
          <p className="mt-1 text-2xl font-black">
            {notifications.length - unreadCount}
          </p>
        </button>
      </div>

      {visibleNotifications.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex min-h-72 flex-col items-center justify-center gap-3 text-center">
            <div className="rounded-full bg-muted p-4">
              <Inbox className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <h2 className="font-bold">مفيش إشعارات هنا</h2>
              <p className="mt-1 max-w-md text-sm leading-7 text-muted-foreground">
                لما يحصل نشاط جديد في المتجر، الإشعارات هتظهر هنا تلقائيًا.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {visibleNotifications.map((notification) => {
            const Icon = notificationIcons[notification.type] ?? Bell;
            const unread = !notification.readAt;

            return (
              <Card
                key={notification.id}
                className={cn(
                  "overflow-hidden transition hover:shadow-sm",
                  unread && "border-primary/40 bg-primary/5",
                )}
              >
                <CardContent className="flex gap-4 p-4">
                  <button
                    type="button"
                    className="flex min-w-0 flex-1 gap-4 text-start"
                    onClick={() => openNotification(notification)}
                  >
                    <span
                      className={cn(
                        "flex h-11 w-11 shrink-0 items-center justify-center rounded-full border bg-background",
                        unread && "border-primary/40 bg-primary/10 text-primary",
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </span>

                    <span className="min-w-0 flex-1 space-y-2">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="font-bold">{notification.title}</span>
                        {unread && <Badge>جديد</Badge>}
                      </span>
                      <span className="block text-sm leading-7 text-muted-foreground">
                        {notification.message}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {formatDate(notification.createdAt)}
                      </span>
                    </span>
                  </button>

                  <div className="flex shrink-0 flex-col gap-2">
                    {unread && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8"
                        onClick={() => markOneAsRead(notification.id)}
                      >
                        مقروء
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => deleteNotification(notification.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {initialUnreadCount !== unreadCount && (
        <p className="text-xs text-muted-foreground">
          تم تحديث الحالة محليًا. لو عملت refresh هتشوف آخر حالة من السيرفر.
        </p>
      )}
    </div>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useState, useTransition, type ComponentType } from "react";
import { useRouter } from "next/navigation";
import { useSseNotifications } from "@/hooks/use-sse-notifications";
import {
  Bell,
  CheckCheck,
  CircleDollarSign,
  Inbox,
  Loader2,
  MessageCircle,
  PackageCheck,
  ShoppingCart,
  Sparkles,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { NotificationDTO } from "@/actions/notifications/notifications.actions";
import {
  GetNotificationsAction,
  MarkAllNotificationsAsReadAction,
  MarkNotificationAsReadAction,
} from "@/actions/notifications/notifications.actions";

type NotificationsBellProps = {
  initialNotifications: NotificationDTO[];
  initialUnreadCount: number;
  pollEveryMs?: number;
};

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

function formatRelativeTime(dateIso: string) {
  const diffInSeconds = Math.max(
    1,
    Math.floor((Date.now() - new Date(dateIso).getTime()) / 1000),
  );

  if (diffInSeconds < 60) return "الآن";

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `منذ ${diffInMinutes} دقيقة`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `منذ ${diffInHours} ساعة`;

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `منذ ${diffInDays} يوم`;

  return new Intl.DateTimeFormat("ar-EG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(dateIso));
}

export default function NotificationsBell({
  initialNotifications,
  initialUnreadCount,
  pollEveryMs = 30000,
}: NotificationsBellProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState(initialNotifications);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [isPending, startTransition] = useTransition();
  const hasUnread = unreadCount > 0;

  const unreadLabel = useMemo(() => {
    if (unreadCount > 99) return "+99";
    return String(unreadCount);
  }, [unreadCount]);

  const refresh = useCallback(async () => {
    try {
      const result = await GetNotificationsAction(10);

      setNotifications(result.notifications);

      setUnreadCount(result.unreadCount);
    } catch (error) {
      console.error("GetNotificationsAction Error:", error);
    }
  }, []);

  // ── SSE: instant push from the server ──────────────────────────────────────
  useSseNotifications({
    onNotification: (incoming) => {
      // Project to NotificationDTO shape (extra SSE fields like storeId/userId are not needed here)
      const dto: NotificationDTO = {
        id: incoming.id,
        type: incoming.type,
        title: incoming.title,
        message: incoming.message,
        href: incoming.href,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: incoming.data as any,
        createdAt: incoming.createdAt,
        readAt: incoming.readAt,
      };
      setNotifications((current) => {
        // Deduplicate in case polling already synced this notification
        if (current.some((n) => n.id === dto.id)) return current;
        return [dto, ...current].slice(0, 10);
      });
      if (!dto.readAt) {
        setUnreadCount((c) => c + 1);
      }
    },
  });
  // ──────────────────────────────────────────────────────────────────────────

  // ── Polling (fallback while SSE is active; disabled once SSE is proven stable)
  useEffect(() => {
    void refresh();

    const id = window.setInterval(() => {
      void refresh();
    }, pollEveryMs);

    const handleFocus = () => {
      void refresh();
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        void refresh();
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(id);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [pollEveryMs, refresh]);

  function optimisticMarkAsRead(notificationId: string) {
    const now = new Date().toISOString();

    setNotifications((current) =>
      current.map((notification) =>
        notification.id === notificationId && !notification.readAt
          ? { ...notification, readAt: now }
          : notification,
      ),
    );
    setUnreadCount((current) => Math.max(0, current - 1));
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);

    if (nextOpen) {
      startTransition(() => {
        void refresh();
      });
    }
  }

  function handleNotificationClick(notification: NotificationDTO) {
    if (!notification.readAt) {
      optimisticMarkAsRead(notification.id);
      startTransition(() => {
        void MarkNotificationAsReadAction(notification.id);
      });
    }

    setOpen(false);

    if (notification.href) {
      router.push(notification.href);
    }
  }

  function handleMarkAllAsRead() {
    const now = new Date().toISOString();

    setNotifications((current) =>
      current.map((notification) => ({ ...notification, readAt: notification.readAt ?? now })),
    );
    setUnreadCount(0);

    startTransition(() => {
      void MarkAllNotificationsAsReadAction();
    });
  }

  return (
    <DropdownMenu dir="rtl" open={open} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="relative h-10 w-10 "
          aria-label="الإشعارات"
        >
          <Bell className="h-4 w-4" />
          {hasUnread && (
            <span className="absolute -end-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-none text-destructive-foreground">
              {unreadLabel}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={10}
        className="z-50 w-[420px] max-w-[calc(100vw-2rem)] overflow-hidden p-0"
      >
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <div>
            <p className="text-sm font-bold">الإشعارات</p>
            <p className="text-xs text-muted-foreground">
              {hasUnread ? `${unreadCount} غير مقروء` : "كله تمام يا باشا"}
            </p>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 gap-2 text-xs"
            onClick={handleMarkAllAsRead}
            disabled={!hasUnread || isPending}
          >
            {isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <CheckCheck className="h-3.5 w-3.5" />
            )}
            تعليم الكل كمقروء
          </Button>
        </div>

        <Separator />

        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 px-6 py-10 text-center">
            <div className="rounded-full bg-muted p-3">
              <Inbox className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-semibold">مفيش إشعارات حاليًا</p>
            <p className="max-w-xs text-xs leading-6 text-muted-foreground">
              أول ما يوصلك أوردر جديد أو تحديث مهم، هيظهر هنا فورًا.
            </p>
          </div>
        ) : (
          <div className="max-h-[420px] overflow-y-auto py-1">
            {notifications.map((notification) => {
              const Icon = notificationIcons[notification.type] ?? Bell;
              const unread = !notification.readAt;

              return (
                <button
                  key={notification.id}
                  type="button"
                  className={cn(
                    "flex w-full gap-3 px-4 py-3 text-start transition-colors hover:bg-muted/70",
                    unread && "bg-primary/5",
                  )}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <span
                    className={cn(
                      "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border bg-background",
                      unread && "border-primary/40 bg-primary/10 text-primary",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </span>

                  <span className="min-w-0 flex-1 space-y-1">
                    <span className="flex items-start justify-between gap-2">
                      <span className="line-clamp-1 text-sm font-semibold">
                        {notification.title}
                      </span>
                      {unread && (
                        <Badge variant="default" className="h-5 shrink-0 px-1.5 text-[10px]">
                          جديد
                        </Badge>
                      )}
                    </span>
                    <span className="line-clamp-2 text-xs leading-5 text-muted-foreground">
                      {notification.message}
                    </span>
                    <span className="block text-[11px] text-muted-foreground">
                      {formatRelativeTime(notification.createdAt)}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        )}

        <Separator />

        <div className="p-2">
          <Button
            type="button"
            variant="ghost"
            className="w-full justify-center text-sm"
            onClick={() => {
              setOpen(false);
              router.push("/notifications");
            }}
          >
            عرض كل الإشعارات
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

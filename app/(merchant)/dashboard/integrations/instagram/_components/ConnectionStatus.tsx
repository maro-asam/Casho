"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Clock,
  RefreshCw,
  Unlink,
  Camera,
  Wifi,
  WifiOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { DisconnectInstagramAction } from "@/actions/instagram/disconnect.actions";
import { SyncInstagramConversationsAction } from "@/actions/instagram/sync-conversations.actions";
import { toast } from "sonner";

type Props = {
  connection: {
    igUsername: string;
    igPageName: string | null;
    status: string;
    webhookVerified: boolean;
    lastSyncAt: Date | null;
    tokenExpiresAt: Date | null;
  };
};

export function ConnectionStatus({ connection }: Props) {
  const router = useRouter();
  const [isSyncing, startSync] = useTransition();
  const [isDisconnecting, startDisconnect] = useTransition();

  const isExpired = connection.status === "EXPIRED";
  const isActive  = connection.status === "ACTIVE";

  function handleSync() {
    startSync(async () => {
      const result = await SyncInstagramConversationsAction();
      if (result.success) {
        toast.success(`تم مزامنة ${result.synced} محادثة`);
        router.refresh();
      } else {
        toast.error(result.error ?? "فشلت المزامنة");
      }
    });
  }

  function handleDisconnect() {
    startDisconnect(async () => {
      const result = await DisconnectInstagramAction();
      if (result.success) {
        toast.success("تم قطع الاتصال بانستجرام");
        router.refresh();
      } else {
        toast.error(result.error ?? "فشل قطع الاتصال");
      }
    });
  }

  function formatLastSync(date: Date | null) {
    if (!date) return "لم تتم مزامنة بعد";
    const diff    = Date.now() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours   = Math.floor(diff / 3600000);
    const days    = Math.floor(diff / 86400000);
    if (minutes < 1)  return "منذ لحظات";
    if (minutes < 60) return `منذ ${minutes} دقيقة`;
    if (hours < 24)   return `منذ ${hours} ساعة`;
    return `منذ ${days} يوم`;
  }

  return (
    <Card
      className={cn(
        "border",
        isExpired
          ? "border-rose-500/30 bg-rose-500/5"
          : "border-emerald-500/30 bg-emerald-500/5",
      )}
    >
      <CardContent className="p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "grid size-10 shrink-0 place-items-center rounded-xl",
                isActive
                  ? "bg-emerald-500/10 text-emerald-600"
                  : "bg-rose-500/10 text-rose-600",
              )}
            >
              <Camera className="size-5" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold">@{connection.igUsername}</p>
                <Badge
                  className={cn(
                    "rounded-full border-0 text-xs",
                    isActive
                      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                      : "bg-rose-500/10 text-rose-700 dark:text-rose-400",
                  )}
                >
                  {isActive ? "متصل" : "انتهت الصلاحية"}
                </Badge>
              </div>

              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                {connection.igPageName && (
                  <span>صفحة: {connection.igPageName}</span>
                )}
                <span className="flex items-center gap-1">
                  {connection.webhookVerified ? (
                    <Wifi className="size-3 text-emerald-500" />
                  ) : (
                    <WifiOff className="size-3 text-amber-500" />
                  )}
                  {connection.webhookVerified ? "Webhook مفعّل" : "Webhook غير مفعّل"}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="size-3" />
                  آخر مزامنة: {formatLastSync(connection.lastSyncAt)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isActive && (
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl"
                onClick={handleSync}
                disabled={isSyncing}
              >
                <RefreshCw className={cn("mr-1.5 size-4", isSyncing && "animate-spin")} />
                {isSyncing ? "جاري المزامنة..." : "مزامنة الآن"}
              </Button>
            )}

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-xl text-rose-500 hover:bg-rose-500/10 hover:text-rose-600"
                  disabled={isDisconnecting}
                >
                  <Unlink className="mr-1.5 size-4" />
                  قطع الاتصال
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent dir="rtl">
                <AlertDialogHeader>
                  <AlertDialogTitle>قطع الاتصال بانستجرام؟</AlertDialogTitle>
                  <AlertDialogDescription>
                    سيتم حذف جميع المحادثات المحفوظة. الطلبات المقترحة ستبقى في سجلك.
                    لا يمكن التراجع عن هذا الإجراء.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>إلغاء</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-rose-600 hover:bg-rose-700"
                    onClick={handleDisconnect}
                  >
                    قطع الاتصال
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {isExpired && (
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-rose-500/10 px-3 py-2.5 text-sm text-rose-700 dark:text-rose-400">
            <AlertCircle className="size-4 shrink-0" />
            انتهت صلاحية الربط مع انستجرام — يرجى قطع الاتصال وإعادة الربط
          </div>
        )}
      </CardContent>
    </Card>
  );
}

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Camera, Ellipsis, RefreshCw, Unlink } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { StatusText, Tag, appleButton, appleMenu } from "@/components/saas-page";
import { cn } from "@/lib/utils";
import { DisconnectInstagramAction, SyncInstagramConversationsAction } from "@/actions/instagram/instagram.actions";
import { lazyIntl, tdir, tr } from "@/lib/i18n/dashboard";

const nf = lazyIntl.number();

type Props = {
  connection: {
    igUsername: string;
    igPageName: string | null;
    status: string;
    webhookVerified: boolean;
    lastSyncAt: Date | null;
  };
  stats: { conversations: number; pending: number; approved: number };
};

/** Instagram's own app-icon gradient — the only brand color on the page. */
export function InstagramGlyph({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "grid shrink-0 place-items-center bg-[linear-gradient(45deg,#feda75_0%,#fa7e1e_25%,#d62976_55%,#962fbf_80%,#4f5bd5_100%)] text-white shadow-[inset_0_1px_0_rgba(255,255,255,.35)]",
        className,
      )}
    >
      <Camera className="size-1/2" strokeWidth={2} />
    </span>
  );
}

function formatLastSync(date: Date | null) {
  if (!date) return tr("لم تتم مزامنة بعد");
  const diff = Date.now() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 1) return tr("منذ لحظات");
  if (minutes < 60) return tr("منذ {0} دقيقة", minutes);
  if (hours < 24) return tr("منذ {0} ساعة", hours);
  return tr("منذ {0} يوم", days);
}

export function ConnectionStatus({ connection, stats }: Props) {
  const router = useRouter();
  const [isSyncing, startSync] = useTransition();
  const [isDisconnecting, startDisconnect] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const isExpired = connection.status === "EXPIRED";
  const isActive = connection.status === "ACTIVE";

  function handleSync() {
    startSync(async () => {
      const result = await SyncInstagramConversationsAction();
      if (result.success) {
        toast.success(tr("تم مزامنة {0} محادثة", result.synced));
        router.refresh();
      } else {
        toast.error(result.error ?? tr("فشلت المزامنة"));
      }
    });
  }

  function handleDisconnect() {
    startDisconnect(async () => {
      const result = await DisconnectInstagramAction();
      if (result.success) {
        toast.success(tr("تم قطع الاتصال بانستجرام"));
        setConfirmOpen(false);
        router.refresh();
      } else {
        toast.error(result.error ?? tr("فشل قطع الاتصال"));
      }
    });
  }

  const figures = [
    { label: tr("المحادثات"), value: stats.conversations },
    { label: tr("قيد المراجعة"), value: stats.pending },
    { label: tr("طلبات معتمدة"), value: stats.approved },
  ];

  return (
    <section aria-label={tr("حساب انستجرام")} className="apple-card overflow-hidden">
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3.5">
          <InstagramGlyph className="size-13 rounded-[14px]" />
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <p className="truncate text-[17px] leading-[22px] font-semibold" dir="ltr">
                @{connection.igUsername}
              </p>
              <StatusText tone={isActive ? "success" : "danger"}>{isActive ? tr("متصل") : tr("انتهت الصلاحية")}</StatusText>
            </div>
            <p className="truncate text-[13px] text-muted-foreground">
              {connection.igPageName && <>{tr("صفحة: {0}", connection.igPageName)} · </>}
              {tr("آخر مزامنة: {0}", formatLastSync(connection.lastSyncAt))}
            </p>
            {!connection.webhookVerified && isActive && (
              <Tag tone="warning" className="mt-1">
                {tr("Webhook غير مفعّل")}
              </Tag>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {isActive && (
            <button type="button" onClick={handleSync} disabled={isSyncing} className={appleButton.tinted}>
              <RefreshCw className={cn("size-4", isSyncing && "animate-spin")} />
              {isSyncing ? tr("جاري المزامنة...") : tr("مزامنة الآن")}
            </button>
          )}
          {isExpired && (
            <a href="/api/instagram/oauth/initiate" className={cn(appleButton.filled, "h-9 px-4 text-sm")}>
              {tr("أعد الربط")}
            </a>
          )}
          <DropdownMenu dir={tdir()} modal={false}>
            <DropdownMenuTrigger aria-label={tr("خيارات الحساب")} className={appleButton.more}>
              <Ellipsis className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className={appleMenu}>
              <DropdownMenuItem variant="destructive" disabled={isDisconnecting} onSelect={() => setConfirmOpen(true)}>
                <Unlink />
                {tr("قطع الاتصال")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {isExpired && (
        <p className="mx-5 mb-4 rounded-[12px] bg-(--sys-red)/10 px-4 py-3 text-[13px] leading-[18px]">
          {tr("انتهت صلاحية الربط مع انستجرام، فالرسايل الجديدة مش بتوصل. أعد الربط عشان تكمّل.")}
        </p>
      )}

      <dl className="mx-5 grid grid-cols-3 border-t-[0.5px] border-border py-3 text-center [&>*+*]:border-s-[0.5px] [&>*+*]:border-border">
        {figures.map((f) => (
          <div key={f.label} className="px-2">
            <dt className="text-[12px] text-muted-foreground">{f.label}</dt>
            <dd className="mt-0.5 text-[22px] leading-7 font-bold tabular-nums">{nf.format(f.value)}</dd>
          </div>
        ))}
      </dl>

      <AlertDialog open={confirmOpen} onOpenChange={(o) => !isDisconnecting && setConfirmOpen(o)}>
        <AlertDialogContent dir={tdir()}>
          <AlertDialogHeader>
            <AlertDialogTitle>{tr("قطع الاتصال بانستجرام؟")}</AlertDialogTitle>
            <AlertDialogDescription>
              {tr("سيتم حذف جميع المحادثات المحفوظة. الطلبات المقترحة ستبقى في سجلك. لا يمكن التراجع عن هذا الإجراء.")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDisconnecting}>{tr("إلغاء")}</AlertDialogCancel>
            <button type="button" onClick={handleDisconnect} disabled={isDisconnecting} className={appleButton.destructiveFilled}>
              {isDisconnecting ? tr("جاري قطع الاتصال...") : tr("قطع الاتصال")}
            </button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Loader2, MoreHorizontal, RefreshCw, ShieldOff } from "lucide-react";
import { toast } from "sonner";

import { revokeApiKey, rotateApiKey } from "@/actions/api-keys/manage.actions";
import { appleButton, appleMenu } from "@/components/saas-page";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { scopeSummary } from "../_lib/scopes";
import { KeyReveal } from "./key-reveal";
import { lazyIntl, tdir, tr } from "@/lib/i18n/dashboard";

export type ApiKeyRow = {
  id: string;
  name: string;
  keyHint: string;
  scopes: string[];
  ipWhitelist: string[];
  lastUsedAt: Date | null;
  createdAt: Date;
  revokedAt: Date | null;
};

const nf = lazyIntl.number();
const rtf = lazyIntl.relative({ numeric: "auto" });
const df = lazyIntl.date({ timeZone: "Africa/Cairo", day: "numeric", month: "short", year: "numeric" });

function ago(date: Date) {
  const minutes = Math.round((date.getTime() - Date.now()) / 60000);
  if (minutes > -60) return rtf.format(minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (hours > -24) return rtf.format(hours, "hour");
  const days = Math.round(hours / 24);
  if (days > -30) return rtf.format(days, "day");
  return df.format(date);
}

type Confirm = { kind: "rotate" | "revoke"; key: ApiKeyRow } | null;

/** Mail-style list of keys; rotate/revoke behind iOS alerts, a rotated key revealed once in a sheet. */
export function ApiKeysList({ keys, revoked, storeId, baseUrl }: { keys: ApiKeyRow[]; revoked?: boolean; storeId: string; baseUrl: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirm, setConfirm] = useState<Confirm>(null);
  const [fresh, setFresh] = useState<{ key: string; name: string } | null>(null);

  function run() {
    if (!confirm) return;
    const { kind, key } = confirm;
    startTransition(async () => {
      try {
        if (kind === "revoke") {
          await revokeApiKey(key.id, storeId);
          toast.success(tr("اتلغى {0}", key.name));
        } else {
          const { key: rawKey } = await rotateApiKey(key.id, storeId);
          setFresh({ key: rawKey, name: key.name });
        }
        setConfirm(null);
        router.refresh();
      } catch {
        toast.error(tr("حدث خطأ، يرجى المحاولة مرة أخرى"));
      }
    });
  }

  return (
    <>
      <ul className={cn("apple-rows [--row-inset:68px]", revoked && "opacity-60")}>
        {keys.map((k) => (
          <li key={k.id} className="flex items-center gap-3 px-5 py-3">
            <span
              className={cn(
                "grid size-10 shrink-0 place-items-center rounded-[10px]",
                revoked ? "bg-(--fill-3) text-muted-foreground" : "bg-linear-to-b from-[#636366] to-[#48484a] text-white",
              )}
            >
              {revoked ? <ShieldOff className="size-[18px]" /> : <KeyRound className="size-[18px]" />}
            </span>
            <div className="min-w-0 flex-1 space-y-0.5">
              <div className="flex items-baseline justify-between gap-3">
                <p className="truncate text-[15px] font-semibold">{k.name}</p>
                <span className="shrink-0 text-[13px] text-muted-foreground">
                  {revoked
                    ? k.revokedAt && tr("اتلغى {0}", ago(k.revokedAt))
                    : k.lastUsedAt
                      ? tr("استُخدم {0}", ago(k.lastUsedAt))
                      : tr("لسه ما اتستخدمش")}
                </span>
              </div>
              <p dir="ltr" className="truncate font-mono text-[13px] text-muted-foreground rtl:text-right">
                csk_live_••••{k.keyHint}
              </p>
              <p className="truncate text-[13px] text-muted-foreground">
                {scopeSummary(k.scopes)}
                {k.ipWhitelist.length > 0 && (
                  <>
                    <span className="text-(--label-3)"> · </span>
                    {tr("{0} IP مسموح", nf.format(k.ipWhitelist.length))}
                  </>
                )}
              </p>
            </div>
            {!revoked && (
              <DropdownMenu dir={tdir()} modal={false}>
                <DropdownMenuTrigger asChild>
                  <button type="button" disabled={pending} aria-label={tr("إجراءات {0}", k.name)} className={cn(appleButton.more, "size-8")}>
                    {pending && confirm?.key.id === k.id ? <Loader2 className="size-4 animate-spin" /> : <MoreHorizontal className="size-4" />}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className={appleMenu}>
                  <DropdownMenuItem onSelect={() => setConfirm({ kind: "rotate", key: k })}>
                    <RefreshCw />
                    {tr("تجديد المفتاح")}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" onSelect={() => setConfirm({ kind: "revoke", key: k })}>
                    <ShieldOff />
                    {tr("إلغاء المفتاح")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </li>
        ))}
      </ul>

      <AlertDialog open={Boolean(confirm)} onOpenChange={(o) => !o && !pending && setConfirm(null)}>
        <AlertDialogContent dir={tdir()} className="max-w-[20rem] gap-0 p-0 text-center">
          <AlertDialogHeader className="items-center gap-1 px-5 pt-6 pb-5 text-center sm:text-center">
            <AlertDialogTitle className="text-[17px] font-semibold">
              {confirm?.kind === "rotate" ? tr("تجدد {0}؟", confirm.key.name) : tr("تلغي {0}؟", confirm?.key.name ?? "")}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[13px] leading-[18px]">
              {confirm?.kind === "rotate"
                ? tr("هنعمل مفتاح جديد بنفس الصلاحيات، والقديم هيقف فورًا — حدّث أنظمتك بالمفتاح الجديد.")
                : tr("أي نظام بيستخدم المفتاح ده هيقف فورًا، ومينفعش ترجّعه.")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="grid grid-cols-2 gap-0 border-t border-border/60 sm:space-x-0">
            <AlertDialogCancel
              disabled={pending}
              className="m-0 h-11 rounded-none border-0 bg-transparent text-[17px] text-primary shadow-none hover:bg-(--fill-3)/60"
            >
              {tr("رجوع")}
            </AlertDialogCancel>
            <button
              type="button"
              onClick={run}
              disabled={pending}
              className={cn(
                "inline-flex h-11 items-center justify-center gap-1.5 border-s border-border/60 text-[17px] font-semibold hover:bg-(--fill-3)/60 disabled:opacity-50",
                confirm?.kind === "rotate" ? "text-primary" : "text-(--sys-red)",
              )}
            >
              {pending && <Loader2 className="size-4 animate-spin" />}
              {confirm?.kind === "rotate" ? tr("تجديد") : tr("إلغاء المفتاح")}
            </button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* The raw key can't travel in a URL, so a rotated key is shown here once. */}
      <Dialog open={Boolean(fresh)} onOpenChange={(o) => !o && setFresh(null)}>
        <DialogContent dir={tdir()} className="apple-ui gap-0 bg-background p-6 text-foreground sm:max-w-lg">
          <DialogTitle className="sr-only">{tr("المفتاح الجديد")}</DialogTitle>
          {fresh && <KeyReveal rawKey={fresh.key} name={fresh.name} baseUrl={baseUrl} />}
          <button type="button" onClick={() => setFresh(null)} className={cn(appleButton.filled, "mt-6 h-[50px] w-full text-[17px]")}>
            {tr("نسخته، تمام")}
          </button>
        </DialogContent>
      </Dialog>
    </>
  );
}

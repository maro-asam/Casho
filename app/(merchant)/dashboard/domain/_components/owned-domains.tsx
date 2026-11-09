"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { connectRegisteredDomainAction, setDomainAutoRenewAction } from "@/actions/store/domain-purchase.actions";
import { StatusText, appleButton } from "@/components/saas-page";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { formatDomainPrice } from "@/lib/domains/format";
import { cn } from "@/lib/utils";
import { lazyIntl, tdir, tr, trv } from "@/lib/i18n/dashboard";

export type OwnedDomain = {
  id: string;
  domain: string;
  expiresAt: string | null;
  autoRenew: boolean;
  /** Today's renewal price for a year (piasters). */
  renewalPrice: number;
  /** It's the store's current custom domain. */
  connected: boolean;
  /** A renewal is being processed right now. */
  renewing: boolean;
};

const df = lazyIntl.date({ timeZone: "Africa/Cairo", day: "numeric", month: "long", year: "numeric" });

function AutoRenewSwitch({ item }: { item: OwnedDomain }) {
  const router = useRouter();
  const [on, setOn] = useState(item.autoRenew);
  const [pending, start] = useTransition();

  function toggle(next: boolean) {
    setOn(next);
    start(async () => {
      const res = await setDomainAutoRenewAction(item.id, next).catch(() => null);
      if (!res?.ok) {
        setOn(!next);
        toast.error(res ? trv(res.message) : tr("مقدرناش نحفظ دلوقتي."));
        return;
      }
      toast.success(trv(res.message));
      router.refresh();
    });
  }

  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 px-4 py-2.5">
      <span className="text-[15px]">{tr("تجديد تلقائي من الرصيد")}</span>
      <Switch checked={on} onCheckedChange={toggle} disabled={pending} aria-label={tr("تجديد تلقائي من الرصيد")} className="apple-switch shrink-0" />
    </label>
  );
}

/** Domains the store bought through Casho: expiry, renewal, and connecting one to the store. */
export function OwnedDomains({ items, currentDomain }: { items: OwnedDomain[]; currentDomain: string | null }) {
  const router = useRouter();
  const [confirm, setConfirm] = useState<OwnedDomain | null>(null);
  const [connecting, start] = useTransition();

  function connect(item: OwnedDomain) {
    start(async () => {
      const res = await connectRegisteredDomainAction(item.id).catch(() => null);
      setConfirm(null);
      if (!res?.ok) {
        toast.error(res ? trv(res.message) : tr("حصل خطأ، جرّب تاني."));
        return;
      }
      toast.success(trv(res.message));
      router.refresh();
    });
  }

  return (
    <section className="space-y-2" aria-labelledby="owned-domains-title">
      <h2 id="owned-domains-title" className="px-4 text-[13px] font-semibold text-muted-foreground">
        {tr("دومينات اشتريتها من كاشو")}
      </h2>
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.id} className="apple-card apple-rows overflow-hidden rounded-[14px] [--row-inset:16px]">
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-[17px] font-semibold rtl:text-right" dir="ltr">
                  {item.domain}
                </p>
                <p className="text-[13px] leading-[18px] text-muted-foreground">
                  {item.renewing
                    ? tr("بنجدده دلوقتي…")
                    : item.expiresAt
                      ? item.autoRenew
                        ? tr("بيتجدد قبل {0} بـ {1}", df.format(new Date(item.expiresAt)), formatDomainPrice(item.renewalPrice))
                        : tr("بيخلص {0} — التجديد مقفول", df.format(new Date(item.expiresAt)))
                      : null}
                </p>
              </div>
              {item.connected ? (
                <StatusText tone="success">{tr("متصل بمتجرك")}</StatusText>
              ) : (
                <button
                  type="button"
                  disabled={connecting}
                  onClick={() => (currentDomain ? setConfirm(item) : connect(item))}
                  className={cn(appleButton.tinted, "text-primary")}
                >
                  {connecting && !confirm && <Loader2 className="size-4 animate-spin" />}
                  {tr("اربطه بمتجرك")}
                </button>
              )}
            </div>
            <AutoRenewSwitch item={item} />
          </li>
        ))}
      </ul>
      <p className="px-4 text-[13px] leading-[18px] text-muted-foreground">
        {tr("التجديد بيتخصم من رصيدك قبل ما الدومين يخلص بشهر، ولو الرصيد مش مكفي هنفكّرك. عايز تنقل الدومين لشركة تانية؟ كلّم الدعم وهنبعتلك كود النقل.")}
      </p>

      <AlertDialog open={Boolean(confirm)} onOpenChange={(o) => !connecting && !o && setConfirm(null)}>
        <AlertDialogContent dir={tdir()} className="max-w-[20rem] gap-0 p-0 text-center">
          {confirm && (
            <>
              <AlertDialogHeader className="items-center gap-1 px-5 pt-6 pb-5 text-center sm:text-center">
                <AlertDialogTitle className="text-[17px] font-semibold">{tr("تربط {0}؟", confirm.domain)}</AlertDialogTitle>
                <AlertDialogDescription className="text-[13px] leading-[18px]">
                  {tr("متجرك هيتنقل من {0} للدومين ده. الدومين القديم مش هيفتح المتجر بعد كده.", currentDomain ?? "")}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="grid grid-cols-2 gap-0 border-t border-border/60 sm:space-x-0">
                <AlertDialogCancel
                  disabled={connecting}
                  className="m-0 h-11 rounded-none border-0 bg-transparent text-[17px] font-semibold text-primary shadow-none hover:bg-(--fill-3)/60"
                >
                  {tr("رجوع")}
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={(e) => {
                    e.preventDefault();
                    connect(confirm);
                  }}
                  disabled={connecting}
                  className="m-0 h-11 gap-1.5 rounded-none border-0 border-s border-border/60 bg-transparent text-[17px] text-primary shadow-none hover:bg-(--fill-3)/60"
                >
                  {connecting && <Loader2 className="size-4 animate-spin" />}
                  {tr("اربطه")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

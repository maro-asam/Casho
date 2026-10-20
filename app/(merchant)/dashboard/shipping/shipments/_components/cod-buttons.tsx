"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Banknote, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { MarkCodCollectedAction } from "@/actions/store/shipments.actions";
import { appleButton } from "@/components/saas-page";
import { cn } from "@/lib/utils";
import { tr, trv } from "@/lib/i18n/dashboard";

function useCollect() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  function collect(ids: string[], collected = true) {
    startTransition(async () => {
      const res = await MarkCodCollectedAction(ids, collected);
      if (!res.success) {
        toast.error(trv(res.message));
        return;
      }
      toast.success(trv(res.message));
      router.refresh();
    });
  }
  return { isPending, collect };
}

/** Row action: the merchant got this shipment's cash from the carrier. */
export function CollectButton({ id, className }: { id: string; className?: string }) {
  const { isPending, collect } = useCollect();
  return (
    <button
      type="button"
      className={cn("apple-press relative z-10 inline-flex h-7 items-center gap-1 rounded-full bg-(--sys-green)/14 px-2.5 text-[12px] font-semibold text-foreground/85 hover:bg-(--sys-green)/20 disabled:opacity-50", className)}
      disabled={isPending}
      onClick={() => collect([id])}
    >
      {isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Banknote className="size-3.5 text-(--sys-green)" />}
      {tr("استلمتها")}
    </button>
  );
}

/** Settles every shipment on the current "due" page at once (one carrier payout). */
export function CollectAllButton({ ids, label }: { ids: string[]; label: string }) {
  const { isPending, collect } = useCollect();
  return (
    <button
      type="button"
      className={appleButton.filled}
      disabled={isPending || ids.length === 0}
      onClick={() => {
        if (confirm(tr("تسجّل إنك استلمت فلوس {0} شحنة؟", ids.length))) collect(ids);
      }}
    >
      {isPending ? <Loader2 className="size-4 animate-spin" /> : <Banknote className="size-4" />}
      {label}
    </button>
  );
}

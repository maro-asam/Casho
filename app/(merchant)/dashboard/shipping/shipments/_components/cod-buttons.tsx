"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Banknote, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { MarkCodCollectedAction } from "@/actions/store/shipments.actions";
import { Button } from "@/components/ui/button";
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
    <Button
      variant="outline"
      size="sm"
      className={cn("relative z-10 h-7 gap-1 px-2 text-xs", className)}
      disabled={isPending}
      onClick={() => collect([id])}
    >
      {isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Banknote className="size-3.5" />}
      {tr("استلمتها")}
    </Button>
  );
}

/** Settles every shipment on the current "due" page at once (one carrier payout). */
export function CollectAllButton({ ids, label }: { ids: string[]; label: string }) {
  const { isPending, collect } = useCollect();
  return (
    <Button
      size="sm"
      className="h-9 gap-1.5"
      disabled={isPending || ids.length === 0}
      onClick={() => {
        if (confirm(tr("تسجّل إنك استلمت فلوس {0} شحنة؟", ids.length))) collect(ids);
      }}
    >
      {isPending ? <Loader2 className="size-4 animate-spin" /> : <Banknote className="size-4" />}
      {label}
    </Button>
  );
}

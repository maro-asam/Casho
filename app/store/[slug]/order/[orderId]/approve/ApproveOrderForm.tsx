"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { RespondToOrderAction } from "@/actions/store/order-confirmation.actions";
import { Button } from "@/components/ui/button";

export function ApproveOrderForm({
  storeSlug,
  orderId,
  token,
  confirmed,
}: {
  storeSlug: string;
  orderId: string;
  token: string;
  confirmed: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState<"confirm" | "cancel" | null>(null);
  const [askCancel, setAskCancel] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function respond(answer: "confirm" | "cancel") {
    setBusy(answer);
    setError(null);
    startTransition(async () => {
      const result = await RespondToOrderAction(storeSlug, orderId, token, answer);
      if (!result.ok) setError(result.message);
      router.refresh();
    });
  }

  if (askCancel) {
    return (
      <div className="space-y-3 rounded-2xl border bg-card p-4 text-center">
        <p className="font-semibold">متأكد إنك عايز تلغي الطلب؟</p>
        <p className="text-sm text-muted-foreground">مش هتقدر ترجّعه، ولو غيّرت رأيك هتحتاج تطلب من جديد.</p>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="lg" className="rounded-xl" disabled={pending} onClick={() => setAskCancel(false)}>
            رجوع
          </Button>
          <Button variant="destructive" size="lg" className="rounded-xl" disabled={pending} onClick={() => respond("cancel")}>
            {pending && busy === "cancel" && <Loader2 className="size-4 animate-spin" />}
            ألغي الطلب
          </Button>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {!confirmed && (
        <Button size="lg" className="h-12 w-full rounded-xl text-base" disabled={pending} onClick={() => respond("confirm")}>
          {pending && busy === "confirm" && <Loader2 className="size-4 animate-spin" />}
          تأكيد الطلب
        </Button>
      )}
      <Button
        variant="ghost"
        size="lg"
        className="w-full rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive"
        disabled={pending}
        onClick={() => setAskCancel(true)}
      >
        {confirmed ? "محتاج تلغي الطلب؟" : "إلغاء الطلب"}
      </Button>
      {error && <p className="text-center text-sm text-destructive">{error}</p>}
    </div>
  );
}

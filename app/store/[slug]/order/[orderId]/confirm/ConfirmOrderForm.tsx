"use client";

import { useEffect, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";

import { ConfirmOrderCodeAction, ResendOrderCodeAction } from "@/actions/store/order-confirmation.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const COOLDOWN_S = 60;

function secondsLeft(lastSentAt: string | null) {
  if (!lastSentAt) return 0;
  return Math.max(0, COOLDOWN_S - Math.floor((Date.now() - new Date(lastSentAt).getTime()) / 1000));
}

export function ConfirmOrderForm({ storeSlug, orderId, lastSentAt }: { storeSlug: string; orderId: string; lastSentAt: string | null }) {
  const [code, setCode] = useState("");
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [wait, setWait] = useState(() => secondsLeft(lastSentAt));
  const [confirming, startConfirm] = useTransition();
  const [resending, startResend] = useTransition();

  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  function confirm(e: React.FormEvent) {
    e.preventDefault();
    startConfirm(async () => {
      // On success the action redirects to the order page.
      const result = await ConfirmOrderCodeAction(storeSlug, orderId, code);
      if (result && !result.ok) setMessage({ ok: false, text: result.message });
    });
  }

  function resend() {
    startResend(async () => {
      const result = await ResendOrderCodeAction(storeSlug, orderId);
      setMessage({ ok: result.ok, text: result.message });
      if (result.ok) setWait(COOLDOWN_S);
    });
  }

  return (
    <form onSubmit={confirm} className="space-y-4">
      <Input
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 10))}
        inputMode="numeric"
        autoComplete="one-time-code"
        autoFocus
        dir="ltr"
        placeholder="••••••"
        aria-label="كود التأكيد"
        className="h-14 text-center font-mono text-2xl tracking-[0.5em]"
      />
      {message && <p className={message.ok ? "text-sm text-emerald-600" : "text-sm text-destructive"}>{message.text}</p>}
      <Button type="submit" className="h-12 w-full" disabled={code.length < 4 || confirming}>
        {confirming && <Loader2 className="size-4 animate-spin" />}
        أكّد الطلب
      </Button>
      <Button type="button" variant="ghost" className="w-full" onClick={resend} disabled={wait > 0 || resending}>
        {resending && <Loader2 className="size-4 animate-spin" />}
        {wait > 0 ? `ابعت كود جديد بعد ${wait} ثانية` : "مجاليش كود — ابعت تاني"}
      </Button>
    </form>
  );
}

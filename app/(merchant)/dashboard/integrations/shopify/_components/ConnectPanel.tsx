"use client";

import { useState } from "react";
import { KeyRound, Loader2, Lock, ShieldCheck, ShoppingBag, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const TRUST = [
  { icon: KeyRound, text: "مش هنطلب منك كلمة سر Shopify — الربط بيتم من صفحة Shopify الرسمية" },
  { icon: Lock, text: "صلاحيات قراءة فقط: مش هنعدّل أو نمسح أي حاجة في متجرك على Shopify" },
  { icon: Undo2, text: "تقدر تلغي الربط في أي وقت" },
];

type Props = {
  configured: boolean;
  /** Prefilled when reconnecting an expired connection. */
  shopDomain?: string;
  reconnect?: boolean;
  connecting: boolean;
  onConnecting: () => void;
};

export function ConnectPanel({ configured, shopDomain, reconnect, connecting, onConnecting }: Props) {
  const [shop, setShop] = useState(shopDomain ?? "");

  return (
    <section className="rounded-xl border border-border bg-card p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
          <ShoppingBag className="size-5" />
        </span>
        <div className="min-w-0 space-y-1">
          <h2 className="text-base font-semibold">{reconnect ? "أعد ربط متجر Shopify" : "اربط متجرك على Shopify"}</h2>
          <p className="text-sm leading-6 text-muted-foreground">
            {reconnect
              ? "صلاحية الربط انتهت أو اتلغت من Shopify. أعد الربط وكمّل الاستيراد من مكانه — مفيش حاجة هتتكرر."
              : "انقل منتجاتك وعملائك وطلباتك من Shopify لـ Kasho في خطوات بسيطة."}
          </p>
        </div>
      </div>

      {!configured ? (
        <p className="mt-5 rounded-lg bg-amber-500/10 px-3 py-2.5 text-sm text-amber-800 dark:text-amber-300">
          الربط مع Shopify لسه مش متفعّل على المنصة. تواصل مع الدعم وهنفعّله لك.
        </p>
      ) : (
        <form
          action="/api/integrations/shopify/oauth/initiate"
          method="post"
          onSubmit={onConnecting}
          className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-end"
        >
          <div className="min-w-0 flex-1 space-y-1.5">
            <Label htmlFor="shop" className="text-sm font-medium">
              رابط متجر Shopify
            </Label>
            <Input
              id="shop"
              name="shop"
              dir="ltr"
              required
              autoComplete="off"
              placeholder="my-store.myshopify.com"
              value={shop}
              onChange={(e) => setShop(e.target.value)}
              disabled={connecting}
              className="text-left"
            />
          </div>
          <Button type="submit" disabled={connecting || !shop.trim()} className="sm:w-auto">
            {connecting ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
            {connecting ? "بنحوّلك لـ Shopify…" : reconnect ? "أعد الربط" : "اربط مع Shopify"}
          </Button>
        </form>
      )}

      <ul className={cn("mt-5 grid gap-2 sm:grid-cols-3", !configured && "opacity-70")}>
        {TRUST.map(({ icon: Icon, text }) => (
          <li key={text} className="flex items-start gap-2 text-xs leading-5 text-muted-foreground">
            <Icon className="mt-0.5 size-3.5 shrink-0 text-emerald-600" />
            {text}
          </li>
        ))}
      </ul>
    </section>
  );
}

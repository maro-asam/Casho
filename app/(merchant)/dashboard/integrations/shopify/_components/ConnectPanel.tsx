"use client";

import { useState } from "react";
import { KeyRound, Loader2, Lock, Undo2 } from "lucide-react";
import { appleButton } from "@/components/saas-page";
import { cn } from "@/lib/utils";
import { tr } from "@/lib/i18n/dashboard";
import { Group, IconTile } from "../../../settings/_components/settings-ui";
import { MigrationGlyph } from "./import-ui";

function trust() {
  return [
    { icon: KeyRound, tint: "bg-(--sys-gray)", text: tr("مش هنطلب منك كلمة سر Shopify — الربط بيتم من صفحة Shopify الرسمية") },
    { icon: Lock, tint: "bg-(--sys-green)", text: tr("صلاحيات قراءة فقط: مش هنعدّل أو نمسح أي حاجة في متجرك على Shopify") },
    { icon: Undo2, tint: "bg-primary", text: tr("تقدر تلغي الربط في أي وقت") },
  ];
}

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
    <div className="space-y-6">
      <section className="apple-card flex flex-col items-center px-6 pt-10 pb-8 text-center sm:px-10">
        <MigrationGlyph />
        <h2 className="mt-6 text-[28px] leading-[34px] font-bold ltr:tracking-[-0.015em]">
          {reconnect ? tr("أعد ربط متجر Shopify") : tr("اربط متجرك على Shopify")}
        </h2>
        <p className="mt-2 max-w-md text-[15px] leading-[22px] text-muted-foreground">
          {reconnect
            ? tr("صلاحية الربط انتهت أو اتلغت من Shopify. أعد الربط وكمّل الاستيراد من مكانه — مفيش حاجة هتتكرر.")
            : tr("انقل منتجاتك وعملائك وطلباتك من Shopify لـ Kasho في خطوات بسيطة.")}
        </p>

        {!configured ? (
          <p className="mt-6 w-full max-w-md rounded-[14px] bg-(--sys-orange)/12 px-4 py-3 text-[15px] leading-[21px]">
            {tr("الربط مع Shopify لسه مش متفعّل على المنصة. تواصل مع الدعم وهنفعّله لك.")}
          </p>
        ) : (
          <form action="/api/integrations/shopify/oauth/initiate" method="post" onSubmit={onConnecting} className="mt-7 w-full max-w-md space-y-3">
            <label htmlFor="shop" className="sr-only">
              {tr("رابط متجر Shopify")}
            </label>
            <div className="flex h-[50px] items-center gap-2 rounded-[12px] bg-(--fill-3) px-4 focus-within:ring-2 focus-within:ring-ring" dir="ltr">
              <input
                id="shop"
                name="shop"
                required
                autoComplete="off"
                spellCheck={false}
                placeholder="my-store.myshopify.com"
                value={shop}
                onChange={(e) => setShop(e.target.value)}
                disabled={connecting}
                className="min-w-0 flex-1 bg-transparent text-[17px] outline-none placeholder:text-(--label-3)"
              />
            </div>
            <button type="submit" disabled={connecting || !shop.trim()} className={cn(appleButton.filled, "h-[50px] w-full text-[17px]")}>
              {connecting && <Loader2 className="size-4 animate-spin" />}
              {connecting ? tr("بنحوّلك لـ Shopify…") : reconnect ? tr("أعد الربط") : tr("اربط مع Shopify")}
            </button>
          </form>
        )}
      </section>

      <Group title={tr("الربط آمن")} inset={58} className={cn(!configured && "opacity-70")}>
        {trust().map(({ icon, tint, text }) => (
          <div key={text} className="flex min-h-12 items-center gap-3.5 px-4 py-2.5 text-[15px] leading-[21px]">
            <IconTile icon={icon} tint={tint} />
            {text}
          </div>
        ))}
      </Group>
    </div>
  );
}

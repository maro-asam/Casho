"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import type { ImportProvider } from "@prisma/client";
import { appleButton } from "@/components/saas-page";
import { cn } from "@/lib/utils";
import { tr } from "@/lib/i18n/dashboard";
import { Group, IconTile } from "../../settings/_components/settings-ui";
import { MigrationGlyph } from "./import-ui";
import { providerCopy } from "./provider-ui";

type Props = {
  provider: ImportProvider;
  configured: boolean;
  /** Prefilled when reconnecting an expired connection. */
  shopDomain?: string;
  reconnect?: boolean;
  connecting: boolean;
  onConnecting: () => void;
};

export function ConnectPanel({ provider, configured, shopDomain, reconnect, connecting, onConnecting }: Props) {
  const [shop, setShop] = useState(shopDomain ?? "");
  const copy = providerCopy(provider);
  const { connect } = copy;

  return (
    <div className="space-y-6">
      <section className="apple-card flex flex-col items-center px-6 pt-10 pb-8 text-center sm:px-10">
        <MigrationGlyph provider={provider} />
        <h2 className="mt-6 text-[28px] leading-[34px] font-bold ltr:tracking-[-0.015em]">{reconnect ? connect.reconnectTitle : connect.title}</h2>
        <p className="mt-2 max-w-md text-[15px] leading-[22px] text-muted-foreground">{reconnect ? connect.reconnectSubtitle : connect.subtitle}</p>

        {!configured ? (
          <p className="mt-6 w-full max-w-md rounded-[14px] bg-(--sys-orange)/12 px-4 py-3 text-[15px] leading-[21px]">{connect.notConfigured}</p>
        ) : (
          <form action={connect.action} method="post" onSubmit={onConnecting} className="mt-7 w-full max-w-md space-y-3">
            <label htmlFor="import-source" className="sr-only">
              {connect.inputLabel}
            </label>
            <div className="flex h-[50px] items-center gap-2 rounded-[12px] bg-(--fill-3) px-4 focus-within:ring-2 focus-within:ring-ring" dir="ltr">
              <input
                id="import-source"
                name={connect.field}
                required
                autoComplete="off"
                autoCapitalize="off"
                spellCheck={false}
                inputMode="url"
                placeholder={connect.placeholder}
                value={shop}
                onChange={(e) => setShop(e.target.value)}
                // readOnly, not disabled: onConnecting re-renders before the browser
                // builds the form data, and a disabled field isn't submitted.
                readOnly={connecting}
                className="min-w-0 flex-1 bg-transparent text-[17px] outline-none placeholder:text-(--label-3) read-only:opacity-60"
              />
            </div>
            <button type="submit" disabled={connecting || !shop.trim()} className={cn(appleButton.filled, "h-[50px] w-full text-[17px]")}>
              {connecting && <Loader2 className="size-4 animate-spin" />}
              {connecting ? connect.redirecting : reconnect ? connect.reconnectButton : connect.button}
            </button>
            {connect.hint && <p className="px-2 text-[13px] leading-[18px] text-muted-foreground">{connect.hint}</p>}
          </form>
        )}
      </section>

      <Group title={tr("الربط آمن")} inset={58} className={cn(!configured && "opacity-70")}>
        {connect.trust.map(({ icon, tint, text }) => (
          <div key={text} className="flex min-h-12 items-center gap-3.5 px-4 py-2.5 text-[15px] leading-[21px]">
            <IconTile icon={icon} tint={tint} />
            {text}
          </div>
        ))}
      </Group>
    </div>
  );
}

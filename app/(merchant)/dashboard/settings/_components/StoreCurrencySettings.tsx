"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { UpdateStoreCurrencyAction } from "@/actions/settings/store-currency.actions";
import { currentLocale, intlLocale, tr, trv } from "@/lib/i18n/dashboard";
import { STORE_CURRENCIES, STORE_CURRENCY_NAMES, type StoreCurrency } from "@/lib/store/currency";
import { Group } from "./settings-ui";

/**
 * The currency shoppers see prices in (storefront, order tracking, order
 * emails). Prices keep their numbers; Paymob only charges in EGP, so it's
 * hidden from checkout in any other currency.
 */
export default function StoreCurrencySettings({ storeId, initial }: { storeId: string; initial: StoreCurrency }) {
  const [currency, setCurrency] = useState<StoreCurrency>(initial);
  const [pending, startTransition] = useTransition();

  function pick(next: StoreCurrency) {
    if (next === currency || pending) return;
    const previous = currency;
    setCurrency(next);
    startTransition(async () => {
      const result = await UpdateStoreCurrencyAction({ storeId, currency: next });
      if (!result.success) {
        setCurrency(previous);
        toast.error(trv(result.message));
        return;
      }
      toast.success(trv(result.message));
    });
  }

  const sample = new Intl.NumberFormat(intlLocale(), { style: "currency", currency, maximumFractionDigits: 0 }).format(1250);

  return (
    <Group
      id="store-currency"
      title={tr("عملة المتجر")}
      footer={tr("العملة اللي أسعارك بتظهر بيها للعملاء في المتجر وفي إيميلات الطلبات. الأرقام نفسها مش بتتغير. الدفع الأونلاين (Paymob) بيشتغل بالجنيه المصري بس، فمش هيظهر في صفحة الدفع مع أي عملة تانية.")}
    >
      <label className="flex min-h-11 items-center justify-between gap-3 px-4 py-2.5">
        <span>
          <span className="block text-[15px]">{tr("العملة")}</span>
          <span className="block text-[13px] text-muted-foreground tabular-nums">{sample}</span>
        </span>
        <span className="flex items-center gap-2">
          {pending && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
          <select
            value={currency}
            disabled={pending}
            onChange={(event) => pick(event.target.value as StoreCurrency)}
            aria-label={tr("عملة المتجر")}
            className="h-9 rounded-lg border border-border bg-background px-2.5 text-[15px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
          >
            {STORE_CURRENCIES.map((code) => (
              <option key={code} value={code}>
                {currentLocale() === "en" ? STORE_CURRENCY_NAMES[code].en : STORE_CURRENCY_NAMES[code].ar} ({code})
              </option>
            ))}
          </select>
        </span>
      </label>
    </Group>
  );
}

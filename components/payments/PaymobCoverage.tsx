import Image from "next/image";
import { CreditCard, Smartphone } from "lucide-react";

import { cn } from "@/lib/utils";
import { tr } from "@/lib/i18n/dashboard";

/** Everything a Paymob checkout takes, spelled out so nobody has to guess. */
export function paymobCoverage() {
  return [
    {
      icon: Smartphone,
      tint: "bg-(--sys-red)",
      title: tr("محافظ إلكترونية"),
      items: [tr("فودافون كاش"), tr("أورنج كاش"), tr("اتصالات كاش (e& cash)"), "WE Pay", tr("محافظ البنوك")],
    },
    {
      icon: CreditCard,
      tint: "bg-primary",
      title: tr("كروت بنكية"),
      items: ["Visa", "Mastercard", tr("ميزة")],
    },
  ];
}

/** The wallets and cards Paymob covers, as small labelled groups of chips. */
export function PaymobCoverage({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <div className={cn("space-y-3", className)}>
      {paymobCoverage().map(({ icon: Icon, tint, title, items }) => (
        <div key={title} className="flex items-start gap-3">
          <span className={cn("grid size-7 shrink-0 place-items-center rounded-[8px] text-white", tint)}>
            <Icon className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            {!compact && <p className="text-[13px] font-semibold text-muted-foreground">{title}</p>}
            <ul className={cn("flex flex-wrap gap-1.5", !compact && "mt-1.5")} aria-label={title}>
              {items.map((item) => (
                <li key={item} className="rounded-full bg-(--fill-3) px-2.5 py-1 text-[13px] leading-4">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ))}
    </div>
  );
}

/** Paymob's wordmark on a white squircle. */
export function PaymobMark() {
  return (
    <span className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-[11px] bg-white p-0.5 ring-[0.5px] ring-black/10 ring-inset dark:ring-white/15">
      <Image src="/payment-logos/paymob.svg" alt="Paymob" width={36} height={36} />
    </span>
  );
}

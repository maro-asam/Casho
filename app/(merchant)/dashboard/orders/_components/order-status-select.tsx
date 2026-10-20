"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { OrderStatus } from "@prisma/client";

import { UpdateOrderStatusAction } from "@/actions/store/orders.actions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { ORDER_STATUSES, ORDER_STATUS_META } from "./order-meta";
import { Dot } from "@/components/saas-page";
import { tdir, tr } from "@/lib/i18n/dashboard";

interface OrderStatusSelectProps {
  orderId: string;
  storeId: string;
  currentStatus: OrderStatus;
  className?: string;
}

/** Status shown as a pop-up button (gray capsule) that opens a menu to change it (optimistic, rolls back on error). */
export function OrderStatusSelect({ orderId, storeId, currentStatus, className }: OrderStatusSelectProps) {
  const [value, setValue] = React.useState<OrderStatus>(currentStatus);
  const [pending, startTransition] = React.useTransition();
  const current = ORDER_STATUS_META[value];

  const handleSelect = (next: OrderStatus) => {
    if (next === value) return;
    const previous = value;
    setValue(next);

    startTransition(async () => {
      try {
        await UpdateOrderStatusAction(orderId, storeId, next);
        toast.success(tr("الطلب بقى \"{0}\"", ORDER_STATUS_META[next].label));
      } catch {
        setValue(previous);
        toast.error(tr("مقدرناش نغيّر حالة الطلب، جرّب تاني."));
      }
    });
  };

  return (
    <DropdownMenu dir={tdir()} modal={false}>
      <DropdownMenuTrigger
        disabled={pending}
        aria-label={tr("حالة الطلب: {0}. تغيير الحالة", current.label)}
        className={cn(
          "apple-press relative z-10 inline-flex h-8 items-center gap-1.5 rounded-full bg-muted ps-2.5 pe-2 text-[13px] text-foreground hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60 data-[state=open]:bg-muted/70",
          className,
        )}
      >
        {pending ? (
          <Loader2 className="size-3 animate-spin" />
        ) : (
          <Dot tone={current.tone} />
        )}
        {current.label}
        <ChevronsUpDown className="size-3.5 text-muted-foreground" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-48 rounded-xl p-1.5">
        {ORDER_STATUSES.map((status) => (
          <DropdownMenuItem key={status.value} onSelect={() => handleSelect(status.value)} className="h-9 gap-2.5 rounded-lg text-[15px]">
            <Check className={cn("size-4 text-primary", status.value !== value && "invisible")} strokeWidth={2.4} />
            <span className="flex-1">{status.label}</span>
            <Dot tone={status.tone} />
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

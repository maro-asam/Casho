"use client";

import * as React from "react";
import { Check, ChevronDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { OrderStatus } from "@prisma/client";

import { UpdateOrderStatusAction } from "@/actions/store/orders.actions";
import { toneDot } from "@/components/saas-page";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { ORDER_STATUSES, ORDER_STATUS_META } from "./order-meta";

interface OrderStatusSelectProps {
  orderId: string;
  storeId: string;
  currentStatus: OrderStatus;
  className?: string;
}

/** Status shown as a pill that opens a menu to change it (optimistic, rolls back on error). */
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
        toast.success(`الطلب بقى "${ORDER_STATUS_META[next].label}"`);
      } catch {
        setValue(previous);
        toast.error("مقدرناش نغيّر حالة الطلب، جرّب تاني.");
      }
    });
  };

  return (
    <DropdownMenu dir="rtl" modal={false}>
      <DropdownMenuTrigger
        disabled={pending}
        aria-label={`حالة الطلب: ${current.label}. تغيير الحالة`}
        className={cn(
          "relative z-10 inline-flex h-7 items-center gap-1.5 rounded-md border border-border bg-background px-2 text-xs font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60 data-[state=open]:bg-muted",
          className,
        )}
      >
        {pending ? (
          <Loader2 className="size-3 animate-spin" />
        ) : (
          <span aria-hidden className={cn("size-1.5 rounded-full", toneDot(current.tone))} />
        )}
        {current.label}
        <ChevronDown className="size-3 opacity-50" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-44">
        {ORDER_STATUSES.map((status) => (
          <DropdownMenuItem key={status.value} onSelect={() => handleSelect(status.value)} className="gap-2">
            <span aria-hidden className={cn("size-1.5 rounded-full", toneDot(status.tone))} />
            <span className="flex-1">{status.label}</span>
            {status.value === value && <Check className="size-3.5 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

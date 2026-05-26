"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { UpdateOrderStatusAction } from "@/actions/store/orders.actions";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandEmpty,
} from "@/components/ui/command";
import { OrderStatus } from "@prisma/client";

const orderStatuses: {
  value: OrderStatus;
  label: string;
  dotClass: string;
}[] = [
  { value: "PENDING", label: "معلق", dotClass: "bg-amber-500" },
  { value: "PAID", label: "مدفوع", dotClass: "bg-sky-500" },
  { value: "SHIPPED", label: "تم الشحن", dotClass: "bg-violet-500" },
  { value: "DELIVERED", label: "وصل", dotClass: "bg-emerald-500" },
  { value: "CANCELED", label: "ملغي", dotClass: "bg-rose-500" },
];

function getStatus(status: OrderStatus) {
  return orderStatuses.find((s) => s.value === status);
}

interface OrderStatusSelectProps {
  orderId: string;
  storeId: string;
  currentStatus: OrderStatus;
}

export function OrderStatusSelect({
  orderId,
  storeId,
  currentStatus,
}: OrderStatusSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState<OrderStatus>(currentStatus);
  const [pending, startTransition] = React.useTransition();

  const handleSelect = (newStatus: OrderStatus) => {
    if (newStatus === value) {
      setOpen(false);
      return;
    }

    const oldValue = value;
    setValue(newStatus);
    setOpen(false);

    startTransition(async () => {
      try {
        await UpdateOrderStatusAction(orderId, storeId, newStatus);
        toast.success("تم تحديث حالة الطلب");
      } catch {
        setValue(oldValue);
        toast.error("حصل خطأ أثناء تحديث الحالة");
      }
    });
  };

  const current = getStatus(value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="w-36 justify-between rounded-xl border-border text-xs"
          disabled={pending}
        >
          {pending ? (
            <span className="flex items-center gap-2">
              <Loader2 className="size-3 animate-spin" />
              جاري...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <span
                className={cn("size-2 shrink-0 rounded-full", current?.dotClass)}
              />
              {current?.label}
            </span>
          )}
          <ChevronsUpDown className="size-3 shrink-0 opacity-40" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-40 p-1" align="end">
        <Command>
          <CommandList>
            <CommandEmpty>لا توجد حالات</CommandEmpty>
            <CommandGroup>
              {orderStatuses.map((status) => (
                <CommandItem
                  key={status.value}
                  value={status.label}
                  onSelect={() => handleSelect(status.value)}
                  className="cursor-pointer rounded-lg px-2 py-1.5 text-sm"
                >
                  <span className="flex flex-1 items-center gap-2">
                    <span
                      className={cn(
                        "size-2 shrink-0 rounded-full",
                        status.dotClass,
                      )}
                    />
                    {status.label}
                  </span>
                  <Check
                    className={cn(
                      "size-3.5 text-primary",
                      value === status.value ? "opacity-100" : "opacity-0",
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

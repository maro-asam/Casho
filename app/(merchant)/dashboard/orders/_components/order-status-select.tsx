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

const orderStatuses: { value: OrderStatus; label: string }[] = [
  { value: "PENDING", label: "معلق" },
  { value: "PAID", label: "مدفوع" },
  { value: "SHIPPED", label: "تم الشحن" },
  { value: "DELIVERED", label: "وصل" },
  { value: "CANCELED", label: "ملغي" },
];

function getStatusLabel(status: OrderStatus) {
  return orderStatuses.find((item) => item.value === status)?.label || status;
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

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-[170px] justify-between"
          disabled={pending}
          size={`default`}
        >
          {pending ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              جاري التحديث...
            </span>
          ) : (
            getStatusLabel(value)
          )}
          <ChevronsUpDown className="ms-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[170px] p-0" align="end">
        <Command>
          <CommandList>
            <CommandEmpty>لا توجد حالات</CommandEmpty>
            <CommandGroup>
              {orderStatuses.map((status) => (
                <CommandItem
                  key={status.value}
                  value={status.label}
                  onSelect={() => handleSelect(status.value)}
                  className="my-1 cursor-pointer"
                >
                  <Check
                    className={cn(
                      "me-2 h-4 w-4",
                      value === status.value ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {status.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

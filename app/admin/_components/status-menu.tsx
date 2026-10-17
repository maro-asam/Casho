"use client";

import { useOptimistic, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { toneDot, type PillTone } from "@/components/saas-page";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type Option = { value: string; label: string; tone: PillTone };

/** Editable status (saas-page rule 8): outlined trigger + dot, optimistic with rollback. */
export function StatusMenu({
  value,
  options,
  action,
  label = "تغيير الحالة",
}: {
  value: string;
  options: Option[];
  /** Server action pre-bound to the record: `setXStatus.bind(null, id)`. */
  action: (next: string) => Promise<{ success: boolean; message: string }>;
  label?: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [optimistic, setOptimistic] = useOptimistic(value);
  const current = options.find((o) => o.value === optimistic) ?? options[0];

  const choose = (next: string) => {
    if (next === optimistic) return;
    start(async () => {
      setOptimistic(next);
      try {
        const result = await action(next);
        if (result.success) {
          toast.success(result.message);
          router.refresh();
        } else toast.error(result.message);
      } catch {
        toast.error("محصلش التحديث، جرّب تاني");
      }
    });
  };

  return (
    <DropdownMenu dir="rtl" modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" aria-label={label} className="relative z-10 h-8 gap-1.5 px-2.5 text-xs font-medium" disabled={pending}>
          {pending ? <Loader2 className="size-3 animate-spin" /> : <span aria-hidden className={cn("size-1.5 rounded-full", toneDot(current.tone))} />}
          {current.label}
          <ChevronDown className="size-3 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-44">
        {options.map((o) => (
          <DropdownMenuItem key={o.value} onSelect={() => choose(o.value)}>
            <span aria-hidden className={cn("size-1.5 rounded-full", toneDot(o.tone))} />
            <span className="flex-1">{o.label}</span>
            {o.value === optimistic && <Check className="size-3.5" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

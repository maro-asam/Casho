"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Building2 } from "lucide-react";
import { SwitchStoreAction } from "@/actions/store/workspace.actions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { tr } from "@/lib/i18n/dashboard";

/** For people who own a store and also work in others (or work in several). Hidden otherwise. */
export function StoreSwitcher({
  stores,
  value,
  className,
}: {
  stores: { id: string; name: string; isOwner: boolean }[];
  value: string;
  className?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (stores.length <= 1) return null;

  const onChange = (next: string) => {
    if (next === value) return;
    startTransition(async () => {
      try {
        await SwitchStoreAction(next);
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : tr("تعذر تغيير المتجر"));
      }
    });
  };

  return (
    <Select value={value} onValueChange={onChange} disabled={pending}>
      <SelectTrigger aria-label={tr("المتجر")} className={cn("h-9 w-auto min-w-36 gap-1.5 text-xs font-medium", className)}>
        <Building2 className="size-3.5 shrink-0 text-muted-foreground" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {stores.map((s) => (
          <SelectItem key={s.id} value={s.id}>
            {s.name}
            {s.isOwner ? tr(" (متجرك)") : ""}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

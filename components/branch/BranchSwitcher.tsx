"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Lock, Store } from "lucide-react";
import { SwitchBranchAction } from "@/actions/inventory/branches.actions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { tr } from "@/lib/i18n/dashboard";

const ALL = "all";

type Props = {
  branches: { id: string; name: string }[];
  /** Branch id, or "all". */
  value: string;
  /** Offer "all branches" (reports, lists) — never on screens that need one branch. */
  allowAll?: boolean;
  /** Shown read-only with this reason (e.g. a shift is open in this branch). */
  lockedReason?: string;
  /** Which store context to validate against (POS follows the picked store). */
  surface?: "pos" | "dashboard";
  className?: string;
};

/**
 * Picks the branch the user works in / looks at. Hidden for single-branch stores,
 * so they see the app exactly as before branches existed.
 */
export function BranchSwitcher({ branches, value, allowAll = false, lockedReason, surface = "dashboard", className }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (branches.length <= 1) return null;

  const current = branches.find((b) => b.id === value);

  if (lockedReason) {
    return (
      <div
        title={lockedReason}
        className={cn("flex h-9 items-center gap-1.5 rounded-lg border border-border px-2.5 text-xs font-medium", className)}
      >
        <Lock className="size-3.5 text-muted-foreground" />
        <span className="truncate">{current?.name ?? "—"}</span>
      </div>
    );
  }

  const onChange = (next: string) => {
    if (next === value) return;
    startTransition(async () => {
      try {
        await SwitchBranchAction(next, surface);
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : tr("تعذر تغيير الفرع"));
      }
    });
  };

  return (
    <Select value={allowAll || value !== ALL ? value : branches[0].id} onValueChange={onChange} disabled={pending}>
      <SelectTrigger
        aria-label={tr("الفرع")}
        className={cn("h-9 w-auto min-w-36 gap-1.5 text-xs font-medium", pending && "opacity-60", className)}
      >
        <Store className="size-3.5 shrink-0 text-muted-foreground" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {allowAll && <SelectItem value={ALL}>{tr("كل الفروع")}</SelectItem>}
        {branches.map((b) => (
          <SelectItem key={b.id} value={b.id}>
            {b.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

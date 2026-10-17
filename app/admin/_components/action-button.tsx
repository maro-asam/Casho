"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export type ActionResult = { success: boolean; message: string } | void;

type Props = {
  /** A server action, usually pre-bound: `someAction.bind(null, id)`. */
  action: () => Promise<ActionResult>;
  children: ReactNode;
  variant?: React.ComponentProps<typeof Button>["variant"];
  size?: React.ComponentProps<typeof Button>["size"];
  className?: string;
  /** Ask before running; destructive/irreversible actions should always confirm. */
  confirm?: { title: string; description: ReactNode; confirmLabel?: string; destructive?: boolean };
  /** Shown when the action returns nothing. */
  successMessage?: string;
  disabled?: boolean;
  /** Controlled confirm (e.g. opened from a menu item); hides the trigger button. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

/** Runs an admin server action with a pending state, toast feedback and a refresh. */
export function ActionButton({
  action,
  children,
  variant = "outline",
  size = "sm",
  className,
  confirm,
  successMessage = "تم",
  disabled,
  open: controlledOpen,
  onOpenChange,
}: Props) {
  const router = useRouter();
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const controlled = controlledOpen !== undefined;
  const open = controlled ? controlledOpen : uncontrolledOpen;
  const setOpen = (next: boolean) => (controlled ? onOpenChange?.(next) : setUncontrolledOpen(next));
  const [pending, startTransition] = useTransition();

  const run = () =>
    startTransition(async () => {
      try {
        const result = await action();
        if (result && !result.success) {
          toast.error(result.message);
        } else {
          toast.success(result?.message ?? successMessage);
          setOpen(false);
          router.refresh();
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "حصل خطأ، جرّب تاني");
      }
    });

  const button = (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={className}
      disabled={pending || disabled}
      onClick={() => (confirm ? setOpen(true) : run())}
    >
      {pending && !confirm && <Loader2 className="size-3.5 animate-spin" />}
      {children}
    </Button>
  );

  if (!confirm) return button;

  return (
    <>
      {!controlled && button}
      <AlertDialog open={open} onOpenChange={(next) => !pending && setOpen(next)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>{confirm.title}</AlertDialogTitle>
            <AlertDialogDescription>{confirm.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>رجوع</AlertDialogCancel>
            {/* Plain Button, not AlertDialogAction: that one closes before the action finishes. */}
            <Button variant={confirm.destructive ? "destructive" : "default"} onClick={run} disabled={pending}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              {confirm.confirmLabel ?? "تأكيد"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

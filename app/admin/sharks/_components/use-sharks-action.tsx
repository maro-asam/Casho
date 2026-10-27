"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { SharksAdminResult } from "@/actions/admin/sharks.actions";

/** Runs a Sharks admin action: pending state, field errors, toast, refresh. */
export function useSharksAction<I>(action: (input: I) => Promise<SharksAdminResult>, onDone?: (res: SharksAdminResult) => void) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});

  function run(input: I) {
    start(async () => {
      try {
        const res = await action(input);
        setErrors(res.fieldErrors ?? {});
        if (!res.success) {
          toast.error(res.message);
          return;
        }
        toast.success(res.message);
        onDone?.(res);
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error && error.message !== "Unauthorized" ? error.message : "حصل خطأ، جرّب تاني");
      }
    });
  }

  return { run, pending, errors };
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="text-xs text-destructive">
      {message}
    </p>
  );
}

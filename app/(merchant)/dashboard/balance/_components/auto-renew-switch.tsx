"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { SetAutoRenewAction } from "@/actions/balance/balance.actions";
import { Switch } from "@/components/ui/switch";

export function AutoRenewSwitch({ storeId, initial }: { storeId: string; initial: boolean }) {
  const router = useRouter();
  const [on, setOn] = useState(initial);
  const [pending, startTransition] = useTransition();

  return (
    <Switch
      checked={on}
      disabled={pending}
      aria-label="التجديد التلقائي"
      onCheckedChange={(next) => {
        setOn(next);
        startTransition(async () => {
          const result = await SetAutoRenewAction(storeId, next).catch(() => null);
          if (!result?.ok) {
            setOn(!next);
            toast.error("مقدرناش نحفظ. جرّب تاني.");
            return;
          }
          toast.success(result.message);
          router.refresh();
        });
      }}
    />
  );
}

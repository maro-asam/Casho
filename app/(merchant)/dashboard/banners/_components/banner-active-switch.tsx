"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { SetBannerActiveAction } from "@/actions/admin/banner.actions";
import { Switch } from "@/components/ui/switch";

/** Inline show/hide — optimistic, rolls back on failure. */
export function BannerActiveSwitch({ bannerId, storeId, title, isActive }: { bannerId: string; storeId: string; title: string; isActive: boolean }) {
  const router = useRouter();
  const [checked, setChecked] = useState(isActive);
  const [pending, startTransition] = useTransition();

  function toggle(next: boolean) {
    setChecked(next);
    startTransition(async () => {
      const result = await SetBannerActiveAction(bannerId, storeId, next);
      if (!result.ok) {
        setChecked(!next);
        toast.error(result.message);
        return;
      }
      toast.success(next ? "البانر بقى ظاهر في المتجر" : "البانر اتخفى من المتجر");
      router.refresh();
    });
  }

  return (
    <Switch
      checked={checked}
      onCheckedChange={toggle}
      disabled={pending}
      aria-label={`إظهار "${title}" في المتجر`}
      className="relative z-10"
    />
  );
}

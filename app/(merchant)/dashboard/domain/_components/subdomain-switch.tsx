"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { setSubdomainEnabledAction } from "@/actions/store/custom-domain.actions";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { tr, trv } from "@/lib/i18n/dashboard";

type Props = {
  /** "mystore.casho.store" */
  subdomainHost: string;
  /** The live custom domain the subdomain redirects to when off. */
  domain: string;
  initialEnabled: boolean;
  className?: string;
};

/**
 * On: slug.casho.store keeps serving the store. Off: it redirects visitors —
 * and every old shared link — to the custom domain, same page. Optimistic,
 * rolled back on failure. Only rendered while the custom domain is ACTIVE.
 */
export function SubdomainSwitch({ subdomainHost, domain, initialEnabled, className }: Props) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(initialEnabled);
  const [pending, startTransition] = useTransition();
  const title = tr("رابط كاشو القديم");

  function toggle(next: boolean) {
    setEnabled(next);
    startTransition(async () => {
      const result = await setSubdomainEnabledAction(next).catch(() => null);
      if (!result?.ok) {
        setEnabled(!next);
        toast.error(result ? trv(result.message) : tr("مقدرناش نحفظ دلوقتي."));
        return;
      }
      if (result.message) toast.success(trv(result.message));
      router.refresh();
    });
  }

  return (
    <label className={cn("flex min-h-11 cursor-pointer items-center justify-between gap-4 px-4 py-3", className)}>
      <span className="min-w-0">
        <span className="block text-[15px]">{title}</span>
        <span className="block truncate text-[13px] text-muted-foreground rtl:text-right" dir="ltr">
          {subdomainHost}
        </span>
        <span className="block text-[13px] leading-5 text-muted-foreground">
          {enabled
            ? tr("شغّال — متجرك بيفتح على الرابطين.")
            : tr("مقفول — أي حد يفتحه بيتحوّل لـ {0} على نفس الصفحة، فاللينكات القديمة مش هتبوظ.", domain)}
        </span>
      </span>
      <Switch
        checked={enabled}
        onCheckedChange={toggle}
        disabled={pending}
        aria-label={title}
        className="apple-switch shrink-0"
      />
    </label>
  );
}

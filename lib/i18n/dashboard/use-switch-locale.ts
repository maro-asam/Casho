"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { UpdateDashboardLocaleAction } from "@/actions/auth/locale.actions";
import { tr, trv, type Locale } from "./index";

/**
 * Switch the dashboard language. Reloads the page afterwards: text rendered
 * outside React context (module-level getters, formatters) must re-read the
 * locale, and a full reload is the simple, reliable way to do that.
 */
export function useSwitchLocale() {
  const [pending, start] = useTransition();
  const switchTo = (locale: Locale) =>
    start(async () => {
      const res = await UpdateDashboardLocaleAction(locale);
      if (!res.success) {
        toast.error(trv(res.error) ?? tr("حصلت مشكلة، جرّب تاني"));
        return;
      }
      window.location.reload();
    });
  return { switchTo, pending };
}

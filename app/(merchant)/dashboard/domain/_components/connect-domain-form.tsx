"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, X } from "lucide-react";
import { toast } from "sonner";

import { checkDomainAvailabilityAction, connectCustomDomainAction } from "@/actions/store/custom-domain.actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { tr } from "@/lib/i18n/dashboard";

type Check = { state: "idle" | "checking" } | { state: "ok"; domain: string } | { state: "error"; message: string };

/** Domain input with live validation + availability, then connect. */
export function ConnectDomainForm() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [check, setCheck] = useState<Check>({ state: "idle" });
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const input = value.trim();
    if (input.length < 4) return;
    let cancelled = false;
    const t = setTimeout(async () => {
      setCheck({ state: "checking" });
      const result = await checkDomainAvailabilityAction(input).catch(() => null);
      if (cancelled || !result) return;
      if (result.status === "valid") setCheck({ state: "ok", domain: result.domain });
      else if (result.status === "taken") setCheck({ state: "error", message: tr("الدومين ده مربوط بمتجر تاني على كاشو.") });
      else setCheck({ state: "error", message: result.reason });
    }, 450);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [value]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (check.state !== "ok") return;
    startTransition(async () => {
      const result = await connectCustomDomainAction(check.domain);
      if (!result.ok) {
        setCheck({ state: "error", message: result.message });
        return;
      }
      toast.success(result.data?.status === "ACTIVE" ? tr("الدومين شغّال على طول 🎉") : tr("اتربط الدومين — فاضل خطوة الـ DNS"));
      router.refresh();
    });
  }

  const shownCheck: Check = value.trim().length < 4 ? { state: "idle" } : check;

  return (
    <form onSubmit={submit} className="space-y-2">
      <div className="flex flex-col gap-2 sm:flex-row">
        <div
          dir="ltr"
          className={cn(
            "flex h-11 flex-1 items-center rounded-lg border bg-background ps-3 transition-colors focus-within:ring-2 focus-within:ring-ring/30",
            shownCheck.state === "error" ? "border-destructive" : shownCheck.state === "ok" ? "border-emerald-500" : "border-input",
          )}
        >
          <span className="select-none text-sm text-muted-foreground">https://</span>
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="mystore.com"
            autoComplete="off"
            spellCheck={false}
            aria-label={tr("الدومين")}
            aria-invalid={shownCheck.state === "error" || undefined}
            className="h-full min-w-0 flex-1 bg-transparent px-1 text-sm outline-none"
          />
          <span className="grid w-9 place-items-center">
            {shownCheck.state === "checking" && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
            {shownCheck.state === "ok" && <Check className="size-4 text-emerald-600" />}
            {shownCheck.state === "error" && <X className="size-4 text-destructive" />}
          </span>
        </div>
        <Button type="submit" className="h-11 gap-1.5 px-6" disabled={shownCheck.state !== "ok" || pending}>
          {pending && <Loader2 className="size-4 animate-spin" />}
          {tr("اربط الدومين")}
        </Button>
      </div>
      <p className={cn("text-xs", shownCheck.state === "error" ? "text-destructive" : "text-muted-foreground")}>
        {shownCheck.state === "error"
          ? shownCheck.message
          : shownCheck.state === "ok"
            ? tr("{0} جاهز للربط.", shownCheck.domain)
            : tr("اكتب الدومين اللي اشتريته — دومين أساسي (mystore.com) أو فرعي (shop.mystore.com).")}
      </p>
    </form>
  );
}

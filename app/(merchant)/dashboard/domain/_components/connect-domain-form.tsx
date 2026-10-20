"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, X } from "lucide-react";
import { toast } from "sonner";

import { checkDomainAvailabilityAction, connectCustomDomainAction } from "@/actions/store/custom-domain.actions";
import { appleButton } from "@/components/saas-page";
import { cn } from "@/lib/utils";
import { tr } from "@/lib/i18n/dashboard";
import { BrowserBar } from "./browser-bar";

type Check = { state: "idle" | "checking" } | { state: "ok"; domain: string } | { state: "error"; message: string };

/** Hero: live address-bar preview, domain input with validation + availability, then connect. */
export function ConnectDomainForm({ currentHost }: { currentHost: string }) {
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
  const preview = value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "");

  return (
    <section className="apple-card flex flex-col items-center px-6 pt-10 pb-8 text-center sm:px-10">
      <BrowserBar host={preview} placeholder="mystore.com" secure={shownCheck.state === "ok"} />
      <h2 className="mt-7 text-[28px] leading-[34px] font-bold ltr:tracking-[-0.015em]">{tr("اربط دومينك")}</h2>
      <p className="mt-2 max-w-md text-[15px] leading-[22px] text-muted-foreground">
        {tr("متجرك دلوقتي على")}{" "}
        <span className="text-foreground" dir="ltr">
          {currentHost}
        </span>
        {tr(". اكتب الدومين وهنقولك بالظبط تعمل إيه.")}
      </p>

      <form onSubmit={submit} className="mt-7 w-full max-w-md space-y-3">
        <div
          dir="ltr"
          className={cn(
            "flex h-[50px] items-center rounded-[12px] bg-(--fill-3) ps-4 transition-shadow focus-within:ring-2",
            shownCheck.state === "error" ? "ring-2 ring-(--sys-red)/60" : "focus-within:ring-ring",
          )}
        >
          <span className="select-none text-[17px] text-(--label-3)">https://</span>
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="mystore.com"
            autoComplete="off"
            spellCheck={false}
            aria-label={tr("الدومين")}
            aria-invalid={shownCheck.state === "error" || undefined}
            aria-describedby="domain-hint"
            className="h-full min-w-0 flex-1 bg-transparent px-0.5 text-[17px] outline-none placeholder:text-(--label-3)"
          />
          <span className="grid w-11 place-items-center">
            {shownCheck.state === "checking" && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
            {shownCheck.state === "ok" && (
              <span className="grid size-5 place-items-center rounded-full bg-(--sys-green) text-white">
                <Check className="size-3" strokeWidth={3.5} />
              </span>
            )}
            {shownCheck.state === "error" && (
              <span className="grid size-5 place-items-center rounded-full bg-(--sys-red) text-white">
                <X className="size-3" strokeWidth={3.5} />
              </span>
            )}
          </span>
        </div>
        <p
          id="domain-hint"
          aria-live="polite"
          className={cn("min-h-[18px] px-1 text-[13px] leading-[18px]", shownCheck.state === "error" ? "text-(--sys-red)" : "text-muted-foreground")}
        >
          {shownCheck.state === "error"
            ? shownCheck.message
            : shownCheck.state === "ok"
              ? tr("{0} جاهز للربط.", shownCheck.domain)
              : tr("اكتب الدومين اللي اشتريته — دومين أساسي (mystore.com) أو فرعي (shop.mystore.com).")}
        </p>
        <button type="submit" disabled={shownCheck.state !== "ok" || pending} className={cn(appleButton.filled, "h-[50px] w-full text-[17px]")}>
          {pending && <Loader2 className="size-4 animate-spin" />}
          {tr("اربط الدومين")}
        </button>
      </form>
    </section>
  );
}

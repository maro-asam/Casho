"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { MailCheck, X } from "lucide-react";

import { tr } from "@/lib/i18n/dashboard";

const DISMISS_KEY = "casho-verify-email-dismissed";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function readDismissed() {
  try {
    return sessionStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

/** For accounts made before email confirmation existed: a quiet nudge, never a lock. Hidden for the session once closed. */
export default function VerifyEmailNotice({ email }: { email: string }) {
  const dismissed = useSyncExternalStore(subscribe, readDismissed, () => false);
  if (dismissed) return null;

  function dismiss() {
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // Storage blocked — it just shows again on the next page.
    }
    window.dispatchEvent(new Event("storage"));
  }

  return (
    <div role="status" className="apple-card mb-5 flex items-center gap-3 rounded-[14px] py-2.5 ps-3 pe-2 motion-safe:animate-in motion-safe:fade-in">
      <span aria-hidden className="grid size-[29px] shrink-0 place-items-center rounded-[7px] bg-primary text-white">
        <MailCheck className="size-[17px]" strokeWidth={2} />
      </span>
      <p className="min-w-0 flex-1 text-[15px] leading-5">
        <span className="font-semibold">{tr("أكّد إيميلك")}</span>
        <span className="text-muted-foreground">
          {" "}
          {tr("علشان إشعارات الطلبات وإعادة تعيين كلمة المرور توصل لـ {0}.", email)}
        </span>
      </p>
      <Link
        href="/verify-email"
        className="apple-press inline-flex h-9 shrink-0 items-center rounded-full bg-primary/10 px-4 text-[15px] font-semibold text-primary hover:bg-primary/15"
      >
        {tr("أكّد")}
      </Link>
      <button
        type="button"
        onClick={dismiss}
        aria-label={tr("إخفاء")}
        className="grid size-9 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-(--fill-3) hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}

"use client";

import { useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { replyToSharksInfoRequestAction } from "@/actions/sharks/apply.actions";
import { appleButton } from "@/components/saas-page";
import { Textarea } from "@/components/ui/textarea";
import { tr, trv } from "@/lib/i18n/dashboard";

/** The applicant's answer to the team's question. */
export default function ReplyForm({ applicationId }: { applicationId: string }) {
  const router = useRouter();
  const id = useId();
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function send() {
    start(async () => {
      try {
        const res = await replyToSharksInfoRequestAction({ applicationId, message });
        if (!res.success) {
          setError(trv(res.fieldErrors?.message ?? res.message));
          return;
        }
        toast.success(trv(res.message));
        setMessage("");
        router.refresh();
      } catch {
        toast.error(tr("محصلش إرسال، جرّب تاني"));
      }
    });
  }

  return (
    <div className="space-y-3">
      <label htmlFor={id} className="block text-[15px] font-medium">
        {tr("ردك")}
      </label>
      <Textarea
        id={id}
        value={message}
        onChange={(e) => {
          setMessage(e.target.value);
          setError(null);
        }}
        rows={4}
        maxLength={2000}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
      />
      {error && (
        <p id={`${id}-error`} role="alert" className="text-[13px] text-(--sys-red)">
          {error}
        </p>
      )}
      <button type="button" onClick={send} disabled={pending || message.trim().length < 5} className={appleButton.filled}>
        {pending && <Loader2 className="size-4 animate-spin" />}
        {tr("ابعت الرد")}
      </button>
    </div>
  );
}

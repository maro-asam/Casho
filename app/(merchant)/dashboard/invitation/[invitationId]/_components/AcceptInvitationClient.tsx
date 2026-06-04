"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AcceptInvitationAction, DeclineInvitationAction } from "@/actions/store/members.actions";

type Props = { invitationId: string };

export default function AcceptInvitationClient({ invitationId }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [declined, setDeclined] = useState(false);

  function handleAccept() {
    startTransition(async () => {
      const res = await AcceptInvitationAction(invitationId);
      if (res.success) {
        toast.success(res.message);
        router.push("/dashboard");
      } else {
        toast.error(res.message);
      }
    });
  }

  function handleDecline() {
    startTransition(async () => {
      const res = await DeclineInvitationAction(invitationId);
      if (res.success) {
        setDeclined(true);
        toast.success(res.message);
        setTimeout(() => router.push("/dashboard"), 1500);
      } else {
        toast.error(res.message);
      }
    });
  }

  if (declined) {
    return (
      <p className="text-center text-sm text-muted-foreground">
        تم رفض الدعوة. جاري التحويل...
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <Button
        className="h-11 w-full rounded-xl"
        onClick={handleAccept}
        disabled={isPending}
      >
        {isPending ? "جاري القبول..." : "قبول الدعوة والانضمام"}
      </Button>
      <Button
        variant="ghost"
        className="w-full rounded-xl text-muted-foreground"
        onClick={handleDecline}
        disabled={isPending}
      >
        رفض الدعوة
      </Button>
    </div>
  );
}

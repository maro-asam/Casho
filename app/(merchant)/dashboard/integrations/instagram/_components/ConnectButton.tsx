"use client";

import { useTransition } from "react";
import { Camera, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConnectInstagramAction } from "@/actions/instagram/connect.actions";

export function ConnectButton() {
  const [isPending, startTransition] = useTransition();

  function handleConnect() {
    startTransition(async () => {
      await ConnectInstagramAction();
    });
  }

  return (
    <Button onClick={handleConnect} disabled={isPending} size="lg" className="">
      {isPending ? "جاري الاتصال..." : "ربط حساب انستجرام"}

      {isPending ? (
        <Loader2 className="mr-2 size-5 animate-spin" />
      ) : (
        <Camera className="mr-2 size-5" />
      )}
    </Button>
  );
}

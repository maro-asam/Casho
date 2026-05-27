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
    <Button
      onClick={handleConnect}
      disabled={isPending}
      size="lg"
      className="rounded-xl bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
    >
      {isPending ? (
        <Loader2 className="mr-2 size-5 animate-spin" />
      ) : (
        <Camera className="mr-2 size-5" />
      )}
      {isPending ? "جاري الاتصال..." : "ربط حساب انستجرام"}
    </Button>
  );
}

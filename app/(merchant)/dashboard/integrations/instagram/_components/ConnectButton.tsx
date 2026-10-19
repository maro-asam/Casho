"use client";

import { Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { tr } from "@/lib/i18n/dashboard";

export function ConnectButton() {
  return (
    <Button asChild size="lg">
      <a href="/api/instagram/oauth/initiate">
        {tr("ربط حساب انستجرام")}
        <Camera className="ms-2 size-5" />
      </a>
    </Button>
  );
}

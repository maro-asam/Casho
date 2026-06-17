"use client";

import { Camera } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ConnectButton() {
  return (
    <Button asChild size="lg">
      <a href="/api/instagram/oauth/initiate">
        ربط حساب انستجرام
        <Camera className="mr-2 size-5" />
      </a>
    </Button>
  );
}

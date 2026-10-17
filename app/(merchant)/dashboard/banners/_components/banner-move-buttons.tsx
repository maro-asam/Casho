"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

import { MoveBannerAction } from "@/actions/admin/banner.actions";
import { Button } from "@/components/ui/button";

/** Up/down arrows: the table order is the storefront slider order. */
export function BannerMoveButtons({
  bannerId,
  storeId,
  title,
  canMoveUp,
  canMoveDown,
}: {
  bannerId: string;
  storeId: string;
  title: string;
  canMoveUp: boolean;
  canMoveDown: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function move(direction: "up" | "down") {
    startTransition(async () => {
      const result = await MoveBannerAction(bannerId, storeId, direction);
      if (!result.ok) return void toast.error(result.message);
      router.refresh();
    });
  }

  return (
    <div className="relative z-10 flex flex-col">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-6 text-muted-foreground"
        disabled={pending || !canMoveUp}
        onClick={() => move("up")}
        aria-label={`قدّم "${title}"`}
      >
        <ChevronUp className="size-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-6 text-muted-foreground"
        disabled={pending || !canMoveDown}
        onClick={() => move("down")}
        aria-label={`أخّر "${title}"`}
      >
        <ChevronDown className="size-4" />
      </Button>
    </div>
  );
}

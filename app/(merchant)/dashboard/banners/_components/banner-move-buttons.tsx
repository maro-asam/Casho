"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

import { MoveBannerAction } from "@/actions/admin/banner.actions";
import { tr, trv } from "@/lib/i18n/dashboard";

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
      if (!result.ok) return void toast.error(trv(result.message));
      router.refresh();
    });
  }

  return (
    <div className="relative z-10 flex flex-col overflow-hidden rounded-full bg-muted">
      <button
        type="button"
        className="apple-press grid h-6 w-8 place-items-center text-primary hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring disabled:text-(--label-3)"
        disabled={pending || !canMoveUp}
        onClick={() => move("up")}
        aria-label={tr("قدّم \"{0}\"", title)}
      >
        <ChevronUp className="size-4" strokeWidth={2.4} />
      </button>
      <button
        type="button"
        className="apple-press grid h-6 w-8 place-items-center text-primary hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring disabled:text-(--label-3)"
        disabled={pending || !canMoveDown}
        onClick={() => move("down")}
        aria-label={tr("أخّر \"{0}\"", title)}
      >
        <ChevronDown className="size-4" strokeWidth={2.4} />
      </button>
    </div>
  );
}

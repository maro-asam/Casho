"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { RestoreCartAction } from "@/actions/store/cart-recovery.actions";

/** `?restore=<token>` from a recovery message: bring the saved cart into this browser. */
export function CartRestorer({ storeSlug }: { storeSlug: string }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const done = useRef(false);
  const token = searchParams.get("restore");

  useEffect(() => {
    if (!token || done.current) return;
    done.current = true;
    RestoreCartAction(storeSlug, token)
      .then((result) => {
        const next = new URLSearchParams(searchParams.toString());
        next.delete("restore");
        if (result.ok) toast.success(result.message);
        else toast.error(result.message);
        const query = next.toString();
        router.replace(query ? `?${query}` : "?", { scroll: false });
        router.refresh();
      })
      .catch(() => {});
  }, [token, storeSlug, router, searchParams]);

  return null;
}

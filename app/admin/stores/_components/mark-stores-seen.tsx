"use client";

import { useEffect } from "react";
import { markStoresSeenAction } from "@/actions/admin/stores-seen.actions";

/** Rendered only while there are unseen stores; clears the sidebar's "new stores" badge. */
export default function MarkStoresSeen({ at }: { at: string }) {
  useEffect(() => {
    void markStoresSeenAction(at);
  }, [at]);

  return null;
}

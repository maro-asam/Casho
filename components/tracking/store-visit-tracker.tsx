"use client";

import { TrackVisitAction } from "@/actions/admin/visitors-tracker.actions";
import { useEffect, useRef } from "react";

type StoreVisitTrackerProps = {
  storeId: string;
};

/** Mounted once in the storefront layout, so client-side navigation doesn't re-count. */
export function StoreVisitTracker({ storeId }: StoreVisitTrackerProps) {
  const trackedRef = useRef(false);

  useEffect(() => {
    if (!storeId || trackedRef.current) return;

    // Skip the dashboard's builder preview (iframe) and automated browsers.
    if (window !== window.top || navigator.webdriver) return;

    trackedRef.current = true;

    TrackVisitAction(storeId).catch((error) => {
      console.error("StoreVisitTracker error:", error);
    });
  }, [storeId]);

  return null;
}

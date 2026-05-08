"use client";

import { TrackVisitAction } from "@/actions/admin/visitors-tracker.actions";
import { useEffect, useRef } from "react";

type StoreVisitTrackerProps = {
  storeId: string;
};

export function StoreVisitTracker({ storeId }: StoreVisitTrackerProps) {
  const trackedRef = useRef(false);

  useEffect(() => {
    if (!storeId || trackedRef.current) return;

    trackedRef.current = true;

    TrackVisitAction(storeId).catch((error) => {
      console.error("StoreVisitTracker error:", error);
    });
  }, [storeId]);

  return null;
}

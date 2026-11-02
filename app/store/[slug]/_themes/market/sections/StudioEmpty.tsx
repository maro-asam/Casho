"use client";

import { useSyncExternalStore } from "react";
import { Plus } from "lucide-react";

const noop = () => () => {};

/** Shown only inside the Studio canvas (the store framed by the builder): a
 *  section the merchant turned on that has nothing to show yet gets a visible
 *  place to click. Shoppers never see it, so nothing is faked on the live store. */
export default function StudioEmpty({ title, hint }: { title: string; hint: string }) {
  const framed = useSyncExternalStore(
    noop,
    () => window.self !== window.top,
    () => false,
  );
  if (!framed) return null;
  return (
    <div className="mk-wrap mk-section">
      <div className="mk-studio-empty">
        <Plus className="size-6 text-(--mk-tint)" />
        <p className="mk-h4">{title}</p>
        <p>{hint}</p>
      </div>
    </div>
  );
}

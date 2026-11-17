"use client";

import { AlertTriangle } from "lucide-react";
import { Unavailable, appleButton } from "@/components/saas-page";

export default function AnalyticsError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="apple-card">
      <Unavailable
        icon={AlertTriangle}
        title="مقدرناش نحمّل التحليلات"
        description="غالبًا قاعدة البيانات اتأخرت في الرد. الأرقام مش هتظهر غلط — جرّب تاني بعد لحظة."
        action={
          <button type="button" onClick={reset} className={appleButton.filled}>
            جرّب تاني
          </button>
        }
      />
    </div>
  );
}

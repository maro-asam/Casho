"use client";

import { useState, type ReactNode } from "react";
import { SegmentedButtons } from "@/components/saas-page";
import { tr } from "@/lib/i18n/dashboard";

type Tab = "buy" | "connect";

/** No domain yet: buy one through Casho, or connect one bought elsewhere. */
export function DomainSetupTabs({ buy, connect }: { buy: ReactNode; connect: ReactNode }) {
  const [tab, setTab] = useState<Tab>("buy");
  return (
    <div className="space-y-4">
      <div className="flex justify-center">
        <SegmentedButtons<Tab>
          role="tablist"
          label={tr("الدومين")}
          value={tab}
          onChange={setTab}
          options={[
            ["buy", tr("اشتري دومين")],
            ["connect", tr("عندي دومين")],
          ]}
        />
      </div>
      <div role="tabpanel">{tab === "buy" ? buy : connect}</div>
    </div>
  );
}

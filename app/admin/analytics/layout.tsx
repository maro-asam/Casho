import { Suspense, type ReactNode } from "react";
import type { Metadata } from "next";
import { LargeTitle } from "@/components/saas-page";
import { requireAnalyticsViewer } from "@/lib/analytics/access";
import { AnalyticsNav } from "./_components/analytics-nav";
import "./analytics.css";

export const metadata: Metadata = { title: "مركز التحليلات" };

export default async function AnalyticsLayout({ children }: { children: ReactNode }) {
  await requireAnalyticsViewer();
  return (
    <div className="analytics-ui space-y-6">
      <LargeTitle
        title="مركز التحليلات"
        subtitle="زوار كاشو ومتاجر التجار: منين جايين، بيعملوا إيه، وفين بيقفوا. بيانات حقيقية من كاشو نفسها، من غير أدوات خارجية."
      />
      <Suspense fallback={<div className="h-[42px]" />}>
        <AnalyticsNav />
      </Suspense>
      {children}
    </div>
  );
}

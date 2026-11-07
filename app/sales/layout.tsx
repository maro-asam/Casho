import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ShieldAlert } from "lucide-react";
import { LogoutButton } from "@/app/(auth)/_components/LogoutBtn";
import { buildReferralLink } from "@/lib/sales/attribution";
import { getSalesRepContext } from "@/lib/sales/guard";
import { SalesTabBar, SalesTopbar } from "./_components/sales-nav";

export const metadata: Metadata = {
  title: "لوحة المبيعات — كاشو",
  robots: { index: false, follow: false },
};

export default async function SalesLayout({ children }: { children: ReactNode }) {
  const rep = await getSalesRepContext();

  if (!rep) {
    return (
      <div dir="rtl" className="apple-ui flex min-h-screen items-center justify-center bg-background p-4 text-foreground">
        <div className="apple-card w-full max-w-2xl space-y-4 p-6 text-center">
          <ShieldAlert className="mx-auto size-11 text-(--label-3)" strokeWidth={1.5} />
          <div className="space-y-1">
            <h1 className="text-[20px] leading-[25px] font-semibold">الحساب ده مالوش صلاحية المبيعات</h1>
            <p className="text-[15px] text-muted-foreground">لو إنت مندوب وحسابك اتوقف، كلّم الإدارة.</p>
          </div>
          <LogoutButton />
        </div>
      </div>
    );
  }

  const name = rep.name?.trim() || rep.email.split("@")[0];

  return (
    <div dir="rtl" className="apple-ui min-h-screen bg-background text-foreground">
      <SalesTopbar name={name} email={rep.email} referralLink={buildReferralLink(rep.referralCode)} />
      <main id="main-content" className="apple-form mx-auto w-full max-w-screen-xl px-4 pt-5 pb-32 sm:px-6 md:pt-7 md:pb-14">
        {children}
      </main>
      <SalesTabBar />
    </div>
  );
}

import type { Metadata } from "next";
import type { ReactNode } from "react";
import { BadgePercent, ShieldAlert } from "lucide-react";
import { LogoutButton } from "@/app/(auth)/_components/LogoutBtn";
import { getSalesRepContext } from "@/lib/sales/guard";
import { SalesNav } from "./_components/sales-nav";

export const metadata: Metadata = {
  title: "لوحة المبيعات — كاشو",
  robots: { index: false, follow: false },
};

export default async function SalesLayout({ children }: { children: ReactNode }) {
  const rep = await getSalesRepContext();

  if (!rep) {
    return (
      <div dir="rtl" className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
        <div className="w-full max-w-sm space-y-4 rounded-xl border bg-background p-6 text-center shadow-sm">
          <ShieldAlert className="mx-auto size-8 text-muted-foreground" />
          <div className="space-y-1">
            <h1 className="font-semibold">الحساب ده مالوش صلاحية المبيعات</h1>
            <p className="text-sm text-muted-foreground">لو إنت مندوب وحسابك اتوقف، كلّم الإدارة.</p>
          </div>
          <LogoutButton />
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-muted/30">
      <header className="border-b bg-background">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4">
          <div className="flex items-center gap-2.5">
            <div className="flex size-7 items-center justify-center rounded-md bg-primary">
              <BadgePercent className="size-4 text-primary-foreground" />
            </div>
            <div className="leading-none">
              <p className="text-sm font-semibold">كاشو — المبيعات</p>
              <p className="text-[10px] text-muted-foreground">{rep.name ?? rep.email}</p>
            </div>
          </div>
          <div className="w-auto">
            <LogoutButton collapsed />
          </div>
        </div>
        <div className="mx-auto max-w-6xl px-4">
          <SalesNav />
        </div>
      </header>
      <main className="mx-auto max-w-6xl p-4 md:p-6">{children}</main>
    </div>
  );
}

import { Metadata } from "next";
import { redirect } from "next/navigation";
import { ReactNode } from "react";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/actions/auth/require-user-id.actions";

export const metadata: Metadata = {
  title: "نقطة البيع | كاشو",
  description: "نظام نقطة البيع لإدارة المبيعات المباشرة",
};

export default async function PosLayout({ children }: { children: ReactNode }) {
  const userId = await requireUserId();

  const store = await prisma.store.findFirst({
    where: { userId },
    select: { id: true, name: true, slug: true },
  });

  if (!store) redirect("/");

  return (
    <div dir="rtl" className="h-screen overflow-hidden bg-background text-foreground">
      {children}
    </div>
  );
}

import { requireAuth } from "@/actions/auth/require.actions";
import { prisma } from "@/lib/prisma";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { ReactNode } from "react";
import DashboardSidebar from "../_components/DashboardSidebar";

export const metadata: Metadata = {
  title: {
    default: "كٌشــك | لوحة تحكم التاجر",
    template: "كُشــك | %s",
  },
  description:
    "لوحة تحكم التاجر لإدارة الطلبات والمنتجات والتصنيفات وإعدادات المتجر بسهولة.",
  applicationName: "كُشــك",
  keywords: [
    "لوحة تحكم",
    "متجر إلكتروني",
    "إدارة الطلبات",
    "إدارة المنتجات",
    "كُشــك",
    "Dashboard",
    "Ecommerce",
  ],
  robots: {
    index: false,
    follow: false,
  },
};

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const userId = await requireAuth();
  const store = await prisma.store.findFirst({
    where: { userId },
  });

  if (!store) {
    redirect("/");
  }

  return (
    <div className="min-h-screen flex">
      <div className="w-64 h-screen sticky top-0">
        <DashboardSidebar store={store} />
      </div>

      <main className="flex-1 p-6 overflow-y-auto">{children}</main>
    </div>
  );
}

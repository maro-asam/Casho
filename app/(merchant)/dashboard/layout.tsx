import { prisma } from "@/lib/prisma";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { ReactNode } from "react";
import DashboardShell from "../_components/main/DashboardShell";
import { requireUserId } from "@/actions/auth/require-user-id.actions";

export const metadata: Metadata = {
  title: {
    default: "كــاشو | لوحة تحكم التاجر",
    template: "كــاشو | %s",
  },
  description:
    "لوحة تحكم التاجر لإدارة الطلبات والمنتجات والتصنيفات وإعدادات المتجر بسهولة.",
  applicationName: "كــاشو",
  keywords: [
    "لوحة تحكم",
    "متجر إلكتروني",
    "إدارة الطلبات",
    "إدارة المنتجات",
    "كــاشو",
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
  const userId = await requireUserId();

  const store = await prisma.store.findFirst({
    where: { userId },
    select: {
      name: true,
      slug: true,
    },
  });

  if (!store) {
    redirect("/");
  }

  return <DashboardShell store={store}>{children}</DashboardShell>;
}

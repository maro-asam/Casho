import { ReactNode } from "react";
import { Metadata } from "next";
import { requireUserId } from "@/actions/auth/require-user-id.actions";

export const metadata: Metadata = {
  title: "محرر المتجر المرئي",
};

export default async function BuilderLayout({ children }: { children: ReactNode }) {
  await requireUserId();
  return (
    <div className="h-screen overflow-hidden bg-background">
      {children}
    </div>
  );
}

import { ReactNode } from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Store",
  description: "Store Front",
};
export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="max-w-screen-2xl m-auto">
      {/* Main Content */}
      <main className="">{children}</main>
    </div>
  );
}

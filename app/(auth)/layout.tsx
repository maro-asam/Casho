import { Metadata } from "next";
import { ReactNode } from "react";

export const metadata: Metadata = {
  title: "كاشو | تسجيل الدخول وإنشاء حساب",
};

export default function AuthLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

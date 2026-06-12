"use client";

import { ReactNode } from "react";
import { useLang } from "../_i18n/LanguageContext";

export default function WelcomeDir({ children }: { children: ReactNode }) {
  const { lang } = useLang();
  return <div dir={lang === "ar" ? "rtl" : "ltr"}>{children}</div>;
}

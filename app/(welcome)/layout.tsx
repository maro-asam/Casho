import { ReactNode } from "react";
import Navbar from "./_components/Header/Navbar";
import Footer from "./_components/Footer";
import { LanguageProvider } from "./_i18n/LanguageContext";
import WelcomeDir from "./_components/WelcomeDir";
import "./_components/apple/apple.css";

// The landing page is full-bleed (Apple-style alternating sections); inner
// pages get their centered container from (pages)/layout.tsx.
export default async function WelcomeLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <LanguageProvider>
      <WelcomeDir>
        <Navbar />
        <main className="relative">{children}</main>
        <Footer />
      </WelcomeDir>
    </LanguageProvider>
  );
}

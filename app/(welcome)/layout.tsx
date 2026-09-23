import { ReactNode } from "react";
import Navbar from "./_components/Header/Navbar";
import Footer from "./_components/Footer";
import { LanguageProvider } from "./_i18n/LanguageContext";
import WelcomeDir from "./_components/WelcomeDir";

export default async function WelcomeLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <LanguageProvider>
      <WelcomeDir>
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-5 md:px-6 lg:px-8">
          <Navbar />

          <main className="relative">{children}</main>
          <Footer />
        </div>
      </WelcomeDir>
    </LanguageProvider>
  );
}

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
        <div className="max-w-7xl mx-auto px-4 sm:px-5 md:px-6 lg:px-8">
          <Navbar />
          <div className="absolute inset-0 -z-10 ">
            <div className="absolute left-1/2 -top-25 h-70 md:w-155 -translate-x-1/2 rounded-xl bg-primary/30 dark:bg-primary/10 blur-[110px]" />
            <div className="absolute bottom-110 right-[25%] h-55 w-55 rounded-xl bg-sky-300/20 blur-[100px]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.7),transparent_45%)] dark:bg-none" />
          </div>

          <main className="relative">{children}</main>
          <Footer />
        </div>
      </WelcomeDir>
    </LanguageProvider>
  );
}

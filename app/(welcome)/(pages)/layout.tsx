import { ReactNode } from "react";

export default function WelcomePagesLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto max-w-screen-2xl px-4 pt-20 sm:px-5 md:px-6 md:pt-24 lg:px-8">
      {children}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore

// ! Author : Maro Asam

import "./globals.css";
import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import NextTopLoader from "nextjs-toploader";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/theme/theme-provider";

const cairoFont = Cairo({
  subsets: ["arabic"],
  variable: "--font-cairo",
});

export const metadata: Metadata = {
  title: "كـــاشو | اعمل متجرك في دقايق",
  description:
    "بدل ما تغرق في شبر رسايل... اعمل متجرك في دقايق وابدأ تبيع بشكل احترافي.",

  icons: {
    icon: "/favicon.ico",
  },

  openGraph: {
    title: "كـــاشو | اعمل متجرك في دقايق",
    description: "اعمل متجرك بسهولة وابدأ تستقبل طلباتك من لينك واحد بس.",
    url: "https://casho.store",
    siteName: "Casho",
    images: [
      {
        url: "/logo.svg",
        width: 1200,
        height: 630,
        alt: "Casho",
      },
    ],
    locale: "ar_EG",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "كـــاشو | اعمل متجرك في دقايق",
    description: "سيبك من لخبطة الرسايل وخليك تدير شغلك صح.",
    images: ["/logo.svg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={cn(cairoFont.className)}
      suppressHydrationWarning
    >
      <body
        className={`antialiased mx-auto overflow-x-hidden`}
        cz-shortcut-listen="true"
        smooth-scroll="true"
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <main>
            <NextTopLoader />

            {children}
            <Toaster theme="light" dir="rtl" richColors position="top-center" />
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}

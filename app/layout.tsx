// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore

// ! Author : Maro Asam

import "./globals.css";
import type { Metadata } from "next";
import { Alexandria, Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import NextTopLoader from "nextjs-toploader";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/theme/theme-provider";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

const cairoFont = Alexandria({
  subsets: ["arabic"],
  variable: "--font-cairo",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://casho.store"),

  title: {
    default: "كاشو | أنشئ متجرك الإلكتروني في دقائق وابدأ البيع أونلاين",
    template: "%s | كاشو",
  },

  description:
    "كاشو منصة عربية لإنشاء متجر إلكتروني احترافي في دقائق. استقبل الطلبات من رابط واحد، اعرض منتجاتك، وابدأ البيع أونلاين بسهولة بدون خبرة تقنية.",

  keywords: [
    "كاشو",
    "Casho",
    "متجر إلكتروني",
    "إنشاء متجر إلكتروني",
    "منصة تجارة إلكترونية",
    "بيع أونلاين",
    "متجر اون لاين",
    "متجر إلكتروني مصر",
    "بديل شوبيفاي عربي",
    "بيع منتجات أونلاين",
    "متجر ملابس أونلاين",
    "عمل متجر إلكتروني",
    "منصة متاجر عربية",
  ],

  authors: [{ name: "Casho Team" }],
  creator: "Casho",
  publisher: "Casho",

  alternates: {
    canonical: "https://casho.store",
  },

  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },

  openGraph: {
    title: "كاشو | أنشئ متجرك الإلكتروني في دقائق",
    description:
      "ابدأ البيع أونلاين بسهولة مع كاشو. متجر احترافي، منتجاتك في مكان واحد، واستقبال الطلبات من رابط واحد فقط.",
    url: "https://casho.store",
    siteName: "Casho",
    locale: "ar_EG",
    type: "website",
    images: [
      {
        url: "/logo.svg",
        width: 1200,
        height: 630,
        alt: "كاشو - منصة إنشاء المتاجر الإلكترونية",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "كاشو | أنشئ متجرك الإلكتروني في دقائق",
    description:
      "منصة عربية تساعدك تعمل متجرك الإلكتروني وتبدأ البيع أونلاين بسهولة.",
    images: ["/og-image.png"],
    creator: "@casho",
  },

  category: "Ecommerce",
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
      className={cn(cairoFont.className, "font-sans", inter.variable)}
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

import type { Metadata } from "next";
import type { ReactNode } from "react";
import { requireUserId } from "@/actions/auth/require-user-id.actions";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

// Printable documents (invoices…): no dashboard chrome, always light, paper-sized.
export default async function PrintLayout({ children }: { children: ReactNode }) {
  await requireUserId();

  return (
    <div dir="rtl" className="min-h-screen bg-neutral-100 py-8 text-neutral-900 print:bg-white print:py-0">
      <style>{`
        @page { size: A4; margin: 12mm; }
        @media print { html, body { background: #fff !important; } }
      `}</style>
      {children}
    </div>
  );
}

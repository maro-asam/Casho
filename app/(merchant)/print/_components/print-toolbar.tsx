"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { tr } from "@/lib/i18n/dashboard";

/** Screen-only bar above a printable document. `autoPrint` opens the print dialog once fonts are ready. */
export function PrintToolbar({ backHref, backLabel, autoPrint }: { backHref: string; backLabel: string; autoPrint?: boolean }) {
  useEffect(() => {
    if (!autoPrint) return;
    let cancelled = false;
    document.fonts.ready.then(() => {
      if (!cancelled) window.print();
    });
    return () => {
      cancelled = true;
    };
  }, [autoPrint]);

  return (
    <div className="mx-auto mb-4 flex max-w-[210mm] items-center justify-between gap-3 px-4 print:hidden sm:px-0">
      <Link
        href={backHref}
        className="inline-flex items-center gap-1 text-sm text-neutral-600 transition-colors hover:text-neutral-900"
      >
        <ArrowRight className="size-4 ltr:-scale-x-100" />
        {backLabel}
      </Link>
      <Button onClick={() => window.print()} className="h-9 gap-1.5">
        <Printer className="size-4" />
        {tr("طباعة / حفظ PDF")}
      </Button>
    </div>
  );
}

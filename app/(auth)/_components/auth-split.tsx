import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

type AuthSplitProps = {
  /** Form column content. */
  children: ReactNode;
  /** Product preview on the other half (desktop only). */
  aside: ReactNode;
  /** Top-end link, e.g. "Don't have an account? Sign up". */
  switchPrompt?: string;
  switchLabel?: string;
  switchHref?: string;
};

/** Two-column auth layout: form on the start side, product preview on the end side. */
export function AuthSplit({ children, aside, switchPrompt, switchLabel, switchHref }: AuthSplitProps) {
  return (
    <div dir="rtl" className="grid min-h-svh bg-background lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      <div className="flex min-h-svh flex-col px-5 py-5 sm:px-10 sm:py-6">
        <header className="flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Image src="/logo.svg" alt="" width={32} height={32} priority className="rounded-lg" />
            <span className="text-base font-bold tracking-tight">كاشو</span>
          </Link>
          {switchLabel && switchHref && (
            <p className="text-sm text-muted-foreground">
              {switchPrompt && <span className="hidden sm:inline">{switchPrompt} </span>}
              <Link href={switchHref} className="font-semibold text-foreground underline-offset-4 hover:text-primary hover:underline">
                {switchLabel}
              </Link>
            </p>
          )}
        </header>

        <main className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-sm">{children}</div>
        </main>

        <footer className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} كاشو</span>
          <span className="flex gap-4">
            <Link href="/terms" className="hover:text-foreground">
              الشروط
            </Link>
            <Link href="/privacy" className="hover:text-foreground">
              الخصوصية
            </Link>
          </span>
        </footer>
      </div>

      <aside aria-hidden className="relative hidden overflow-hidden border-s border-border bg-muted/40 lg:flex lg:items-center lg:justify-center">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-size-[40px_40px] opacity-40 mask-[radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
        <div className="relative w-full max-w-lg px-10 py-12">{aside}</div>
      </aside>
    </div>
  );
}

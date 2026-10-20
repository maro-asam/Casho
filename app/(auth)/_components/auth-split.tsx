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

/**
 * Two-column auth layout. The form sits on the grouped background; the preview
 * lives in an inset dark showcase panel, apple.com-style.
 */
export function AuthSplit({ children, aside, switchPrompt, switchLabel, switchHref }: AuthSplitProps) {
  return (
    <div dir="rtl" className="apple-ui grid min-h-svh bg-background text-foreground lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      <div className="flex min-h-svh flex-col px-5 py-5 sm:px-10 sm:py-6">
        <header className="flex items-center justify-between gap-4">
          <Link
            href="/"
            className="apple-press flex items-center gap-2.5 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Image src="/logo.svg" alt="" width={32} height={32} priority className="rounded-[9px]" />
            <span className="text-[17px] font-semibold">كاشو</span>
          </Link>
          {switchLabel && switchHref && (
            <p className="text-[15px] text-muted-foreground">
              {switchPrompt && <span className="hidden sm:inline">{switchPrompt} </span>}
              <Link
                href={switchHref}
                className="apple-press inline-flex h-9 items-center rounded-full bg-card px-4 font-semibold text-primary hover:bg-card/70"
              >
                {switchLabel}
              </Link>
            </p>
          )}
        </header>

        <main className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-[400px]">{children}</div>
        </main>

        <footer className="flex flex-wrap items-center justify-between gap-2 text-[12px] text-muted-foreground">
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

      {/* Dark showcase: forced dark tokens regardless of the site theme. */}
      <aside aria-hidden className="dark hidden p-3 lg:block">
        <div className="apple-ui relative flex h-full items-center justify-center overflow-hidden rounded-[28px] bg-black text-foreground">
          <div className="pointer-events-none absolute -top-1/4 left-1/2 size-[640px] -translate-x-1/2 rounded-full bg-primary/35 blur-[120px]" />
          <div className="pointer-events-none absolute -bottom-1/3 -left-1/4 size-[420px] rounded-full bg-(--sys-indigo)/25 blur-[120px]" />
          <div className="relative w-full max-w-lg px-10 py-12">{aside}</div>
        </div>
      </aside>
    </div>
  );
}

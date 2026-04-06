import Link from "next/link";
import { ReactNode } from "react";
import { CheckCircle2, Store, ArrowLeft } from "lucide-react";

type AuthShellProps = {
  badge: string;
  title: ReactNode;
  description: string;
  points: string[];
  bottomText: string;
  mobileBackHref?: string;
  mobileBackLabel?: string;
  children: ReactNode;
};

export function AuthShell({
  badge,
  title,
  description,
  points,
  bottomText,
  mobileBackHref = "/",
  mobileBackLabel = "الرجوع للرئيسية",
  children,
}: AuthShellProps) {
  return (
    <main className="min-h-screen bg-muted/30">
      <div className="grid min-h-screen lg:grid-cols-2">
        <div className="hidden lg:flex flex-col justify-between bg-primary px-10 py-10 text-primary-foreground">
          <Link
            href="/"
            className="flex items-center gap-3 text-lg font-semibold"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white/10">
              <Store className="h-5 w-5" />
            </div>
            كــاشو
          </Link>

          <div className="max-w-md space-y-6">
            <span className="inline-flex rounded-full border border-white/15 px-4 py-1 text-sm text-white/80">
              {badge}
            </span>

            <h1 className="text-4xl font-bold leading-tight">{title}</h1>

            <p className="text-base leading-8 text-primary-foreground/80">
              {description}
            </p>

            <div className="space-y-4 pt-2">
              {points.map((point, index) => (
                <div key={index} className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="text-sm">{point}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-sm text-primary-foreground/70">{bottomText}</p>
        </div>

        <div className="flex items-center justify-center px-6 py-10">
          <div className="w-full max-w-md">
            <div className="mb-8 lg:hidden">
              <Link
                href={mobileBackHref}
                className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                {mobileBackLabel}
              </Link>
            </div>

            {children}
          </div>
        </div>
      </div>
    </main>
  );
}

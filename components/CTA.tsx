import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { CTA_CONTENT } from "@/constants";

const CTA = () => {
  return (
    <section className="w-full py-20">
      <div className="mx-auto px-6">
        <Card className="relative overflow-hidden rounded-4xl border-0 bg-primary text-primary-foreground shadow-2xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.18),transparent_35%)]" />
          <div className="absolute -left-16 top-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -right-16 bottom-0 h-48 w-48 rounded-full bg-white/10 blur-3xl" />

          <CardContent className="relative py-16">
            <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-sm font-medium text-white/90 backdrop-blur-sm">
                <Sparkles className="size-4" />
                {CTA_CONTENT.badge}
              </div>

              <h2 className="mt-6 text-3xl font-extrabold leading-tight tracking-tight md:text-5xl">
                {CTA_CONTENT.title.before}{" "}
                <span className="text-white">
                  {CTA_CONTENT.title.highlight}
                </span>
              </h2>

              <p className="mt-5 max-w-2xl text-base leading-8 text-primary-foreground/80 md:text-lg">
                {CTA_CONTENT.description}
              </p>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <Button
                  size="lg"
                  variant="secondary"
                  className="h-12 rounded-xl px-6 text-sm font-semibold"
                  asChild
                >
                  <Link href={CTA_CONTENT.primaryButton.href}>
                    {CTA_CONTENT.primaryButton.label}
                    <ArrowUpRight className="size-4" />
                  </Link>
                </Button>

                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 rounded-xl border-white/20 bg-transparent px-6 text-sm font-semibold text-white hover:bg-white/10 hover:text-white"
                  asChild
                >
                  <Link href={CTA_CONTENT.secondaryButton.href}>
                    {CTA_CONTENT.secondaryButton.label}
                  </Link>
                </Button>
              </div>

              <p className="mt-6 text-sm leading-7 text-primary-foreground/70">
                {CTA_CONTENT.note}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default CTA;

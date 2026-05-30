import Link from "next/link";
import { Store, StoreIcon, ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { HERO_CONTENT } from "@/constants/welcome/hero.constants";
import FadeIn from "./FadeIn";
import StoreMarquee from "./StoreMarquee";

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden py-20">
      <div className="relative mx-auto flex flex-col items-center px-4 text-center">
        <FadeIn>
          <div className="inline-flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 px-4 py-2 text-sm font-medium text-primary backdrop-blur-sm">
            <StoreIcon className="size-4 text-primary" />
            <span className="h-5 w-[0.5px] bg-muted-foreground" />
            <span>{HERO_CONTENT.badge}</span>
          </div>
        </FadeIn>

        <FadeIn delay={80} className="mt-6">
          <h1 className="text-3xl leading-normal tracking-tight sm:text-5xl lg:text-6xl">
            {HERO_CONTENT.title}
            <span className="mt-2 block bg-linear-to-l from-primary via-sky-500 dark:via-emerald-600 to-primary bg-clip-text text-transparent font-bold">
              {HERO_CONTENT.highlight}
            </span>
          </h1>
        </FadeIn>

        <FadeIn delay={160} className="mt-6">
          <p className="max-w-xl leading-8 font-light text-muted-foreground">
            {HERO_CONTENT.description}
          </p>
        </FadeIn>

        <FadeIn delay={240} className="mt-8">
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <Button size="lg" asChild>
              <Link
                href={HERO_CONTENT.cta.primary.href}
                className="flex items-center gap-2 px-10 font-semibold"
              >
                <span className="relative z-10">{HERO_CONTENT.cta.primary.label}</span>
                <Store className="relative z-10 size-4" />
              </Link>
            </Button>

            <Button variant="outline" size="lg" className="px-6" asChild>
              <Link href={HERO_CONTENT.cta.secondary.href}>
                {HERO_CONTENT.cta.secondary.label}
                <ArrowLeft className="ms-2 size-4" />
              </Link>
            </Button>
          </div>
        </FadeIn>

        <FadeIn delay={320} className="mt-8">
          <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
            {HERO_CONTENT.highlights.map((item, index) => (
              <div key={item} className="flex items-center gap-4">
                <span>{item}</span>
                {index !== HERO_CONTENT.highlights.length - 1 && <span>•</span>}
              </div>
            ))}
          </div>
        </FadeIn>
      </div>

      <StoreMarquee />
    </section>
  );
}

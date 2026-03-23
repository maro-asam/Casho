import { AvatarCircles } from "@/components/ui/avatar-circles";
import { Button } from "@/components/ui/button";
import { HERO_CONTENT } from "@/constants";
import {
  ArrowUpRight,
  CheckCircle2,
  Package,
  PlaneTakeoff,
  ShoppingBag,
  Store,
  Wallet,
} from "lucide-react";
import Link from "next/link";

const HeroSection = () => {
  return (
    <section className="w-full overflow-hidden py-10">
      <div className="mx-auto grid items-center gap-14  lg:grid-cols-2">
        <div className="space-y-8 text-right">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm font-medium text-primary">
            <PlaneTakeoff className="size-4" />
            {HERO_CONTENT.badge}
          </div>

          <div className="space-y-5">
            <h1 className="max-w-3xl text-4xl font-extrabold leading-normal tracking-tight md:text-5xl lg:text-6xl">
              {HERO_CONTENT.title.before} <br />
              <span className="bg-linear-to-r from-primary to-emerald-300 bg-clip-text text-transparent">
                {HERO_CONTENT.title.highlight} {" "}
              </span>
              {HERO_CONTENT.title.after}
            </h1>

            <p className="max-w-xl text-base leading-8 text-muted-foreground md:text-lg">
              <span className="text-primary font- ml-1.5">
                {HERO_CONTENT.description.highlight}
              </span>
              {HERO_CONTENT.description.title}
            </p>

            {/* <p className="max-w-xl text-sm leading-7 text-muted-foreground md:text-base">
              {HERO_CONTENT.pricing}
            </p> */}

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <div className="inline-flex items-center gap-2">
                <CheckCircle2 className="size-4 text-primary" />
                <span>إعداد سريع</span>
              </div>
              <div className="inline-flex items-center gap-2">
                <CheckCircle2 className="size-4 text-primary" />
                <span>واجهة سهلة</span>
              </div>
              <div className="inline-flex items-center gap-2">
                <CheckCircle2 className="size-4 text-primary" />
                <span>مناسبة للبداية</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <Button
              size="lg"
              className="h-12  px-6 text-sm font-semibold shadow-lg shadow-primary/20"
              asChild
            >
              <Link href="/signup">
                {HERO_CONTENT.primaryCta}
                <Store className="ms-2 size-4.5" />
              </Link>
            </Button>

            <Button
              variant="outline"
              size="lg"
              className="h-12  px-6 text-sm"
              asChild
            >
              <Link href="#features">{HERO_CONTENT.secondaryCta}</Link>
            </Button>
          </div>

          {/* <div className="space-y-3">
            <p className="text-sm leading-7 text-primary">
              {HERO_CONTENT.offer}
            </p>
          </div> */}

          <div className="flex items-center gap-4 rounded-22xl border border-border/60 bg-card/60 px-4 py-3 backdrop-blur-sm">
            <AvatarCircles
              numPeople={HERO_CONTENT.avatars.numPeople}
              avatarUrls={HERO_CONTENT.avatars.avatarUrls}
            />
            <div className="space-y-1">
              <p className="text-sm font-medium">{HERO_CONTENT.socialProof}</p>
              <p className="text-xs text-muted-foreground">
                {HERO_CONTENT.avatars.countText}
              </p>
            </div>
          </div>
        </div>

        <div className="relative flex min-h-135 items-center justify-center">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.12),transparent_55%)]" />
          <div className="absolute left-10 top-12 -z-10 h-32 w-32 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute bottom-10 right-10 -z-10 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />

          <div className="relative w-full max-w-xl rounded-4xl border border-border/60 bg-background/90 p-4 shadow-[0_20px_80px_rgba(0,0,0,0.08)] backdrop-blur">
            <div className="rounded-3xl border bg-card p-4 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-primary">
                    {HERO_CONTENT.dashboard.brand}
                  </p>
                  <h3 className="text-lg font-bold">
                    {HERO_CONTENT.dashboard.title}
                  </h3>
                </div>

                <div className="rounded-xl bg-primary/10 px-3 py-2 text-sm font-semibold text-primary">
                  {HERO_CONTENT.dashboard.status}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-22xl border bg-background p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <Wallet className="size-5 text-primary" />
                    <span className="text-xs text-muted-foreground">
                      {HERO_CONTENT.dashboard.sales.hint}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {HERO_CONTENT.dashboard.sales.label}
                  </p>
                  <h4 className="mt-1 text-xl font-bold">
                    {HERO_CONTENT.dashboard.sales.value}
                  </h4>
                </div>

                <div className="rounded-22xl border bg-background p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <ShoppingBag className="size-5 text-primary" />
                    <span className="text-xs text-muted-foreground">
                      {HERO_CONTENT.dashboard.orders.hint}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {HERO_CONTENT.dashboard.orders.label}
                  </p>
                  <h4 className="mt-1 text-xl font-bold">
                    {HERO_CONTENT.dashboard.orders.value}
                  </h4>
                </div>

                <div className="rounded-22xl border bg-background p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <Package className="size-5 text-primary" />
                    <span className="text-xs text-muted-foreground">
                      {HERO_CONTENT.dashboard.products.hint}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {HERO_CONTENT.dashboard.products.label}
                  </p>
                  <h4 className="mt-1 text-xl font-bold">
                    {HERO_CONTENT.dashboard.products.value}
                  </h4>
                </div>
              </div>

              <div className="mt-4 rounded-22xl border bg-background p-4">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold">
                      {HERO_CONTENT.dashboard.topProducts.title}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {HERO_CONTENT.dashboard.topProducts.description}
                    </p>
                  </div>

                  <button className="inline-flex items-center gap-1 text-sm font-medium text-primary">
                    {HERO_CONTENT.dashboard.topProducts.button}
                    <ArrowUpRight className="size-4" />
                  </button>
                </div>

                <div className="space-y-3">
                  {HERO_CONTENT.dashboard.topProducts.items.map((item) => (
                    <div
                      key={item.name}
                      className="flex items-center justify-between rounded-22xl border p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-xl bg-primary/10" />
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {item.sales}
                          </p>
                        </div>
                      </div>
                      <p className="font-semibold">{item.price}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="absolute -bottom-8 -left-8 hidden w-52 rounded-[28px] border bg-background p-3 shadow-2xl md:block">
              <div className="mb-3 h-6 w-20 rounded-full bg-muted" />
              <div className="space-y-3">
                <div className="h-28 rounded-22xl bg-primary/10" />
                <div className="space-y-2">
                  <div className="h-3 w-3/4 rounded bg-muted" />
                  <div className="h-3 w-1/2 rounded bg-muted" />
                </div>
                <div className="rounded-xl bg-primary px-4 py-3 text-center text-sm font-semibold text-primary-foreground">
                  {HERO_CONTENT.dashboard.mobileCta}
                </div>
              </div>
            </div>

            <div className="absolute right-60 -top-6 hidden rounded-22xl border bg-background px-12 py-4 shadow-lg md:block">
              <p className="text-xs text-muted-foreground">
                {HERO_CONTENT.dashboard.floatingBadge.title}
              </p>
              <p className="text-lg font-bold">
                {HERO_CONTENT.dashboard.floatingBadge.value}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;

import { Card, CardContent } from "@/components/ui/card";
import { FEATURES_LIST, FEATURES_SECTION } from "@/constants";

const Features = () => {
  const [featured, ...restFeatures] = FEATURES_LIST;
  const FeaturedIcon = featured.icon;

  return (
    <section id="features" className="w-full py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid items-start gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <div className="lg:sticky lg:top-24">
            <span className="inline-flex items-center rounded-full border border-primary/15 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
              {FEATURES_SECTION.badge}
            </span>

            <h2 className="mt-5 text-3xl font-extrabold leading-tight tracking-tight md:text-5xl">
              {FEATURES_SECTION.title.before}
              <br />
              <span className="text-primary">
                {FEATURES_SECTION.title.highlight}
              </span>
            </h2>

            <p className="mt-5 max-w-xl text-base leading-8 text-muted-foreground md:text-lg">
              {FEATURES_SECTION.description}
            </p>

            <div className="mt-8 space-y-4">
              <div className="rounded-[1.75rem] border border-border/60 bg-muted/30 p-6">
                <p className="text-sm leading-7 text-muted-foreground md:text-[15px]">
                  المنصة معمولة للتاجر اللي عايز يبدأ بسرعة، من غير لفة كبيرة
                  في الإعدادات أو تعقيد تقني يضيّع وقته.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-22xl border border-border/60 bg-background p-4">
                  <div className="text-2xl font-extrabold tracking-tight">سهل</div>
                  <p className="mt-1 text-sm leading-7 text-muted-foreground">
                    تبدأ وتبيع بدون خبرة تقنية.
                  </p>
                </div>

                <div className="rounded-22xl border border-border/60 bg-background p-4">
                  <div className="text-2xl font-extrabold tracking-tight">سريع</div>
                  <p className="mt-1 text-sm leading-7 text-muted-foreground">
                    تضيف منتجاتك وتستقبل الطلبات فورًا.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <Card className="group overflow-hidden rounded-[2rem] border border-primary/15 bg-primary/[0.04] shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
              <CardContent className="p-7 md:p-8">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex size-14 items-center justify-center rounded-22xl bg-primary text-primary-foreground shadow-sm">
                    <FeaturedIcon className="size-6" />
                  </div>

                  <span className="text-sm font-semibold tracking-[0.2em] text-primary/70">
                    01
                  </span>
                </div>

                <h3 className="mt-6 text-2xl font-extrabold leading-tight tracking-tight">
                  {featured.title}
                </h3>

                <p className="mt-4 max-w-2xl text-sm leading-8 text-muted-foreground md:text-[15px]">
                  {featured.description}
                </p>
              </CardContent>
            </Card>

            <div className="grid gap-5 md:grid-cols-2">
              {restFeatures.map((feature, index) => {
                const Icon = feature.icon;

                return (
                  <Card
                    key={feature.title}
                    className="group rounded-[1.75rem] border border-border/60 bg-background shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/20 hover:shadow-lg"
                  >
                    <CardContent className="p-6">
                      <div className="mb-5 flex items-center justify-between gap-4">
                        <div className="flex size-12 items-center justify-center rounded-22xl bg-primary/10 ring-1 ring-primary/10 transition-all duration-300 group-hover:bg-primary/15">
                          <Icon className="size-5 text-primary" />
                        </div>

                        <span className="text-sm font-medium text-muted-foreground/70">
                          {String(index + 2).padStart(2, "0")}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold leading-7 tracking-tight">
                        {feature.title}
                      </h3>

                      <p className="mt-3 text-sm leading-7 text-muted-foreground">
                        {feature.description}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;
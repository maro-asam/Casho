import { HOW_IT_WORKS_CONTENT, HOW_IT_WORKS_STEPS } from "@/constants";

const HowItWorks = () => {
  return (
    <section className="w-full py-15">
      <div className="mx-auto px-6">
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <span className="inline-flex items-center rounded-full border border-primary/15 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
            {HOW_IT_WORKS_CONTENT.badge}
          </span>

          <h2 className="mt-5 text-3xl font-extrabold leading-tight tracking-tight md:text-5xl">
            {HOW_IT_WORKS_CONTENT.title.before}{" "}
            <span className="text-primary">
              {HOW_IT_WORKS_CONTENT.title.highlight}
            </span>{" "}
            {HOW_IT_WORKS_CONTENT.title.after}
          </h2>

          <p className="mt-5 text-base leading-8 text-muted-foreground md:text-lg">
            {HOW_IT_WORKS_CONTENT.description}
          </p>
        </div>

        <div className="relative grid gap-10 md:grid-cols-3 md:gap-8">
          <div className="pointer-events-none absolute left-[16.66%] right-[16.66%] top-9 hidden h-px bg-border md:block" />

          {HOW_IT_WORKS_STEPS.map((step) => {
            const Icon = step.icon;

            return (
              <div key={step.id} className="group relative text-center">
                <div className="relative z-10 mx-auto mb-6 flex size-18 items-center justify-center rounded-full bg-background">
                  <div className="absolute inset-0 rounded-full border border-primary/15 bg-primary/5" />
                  <div className="relative flex size-14 items-center justify-center rounded-full border border-primary/20 bg-background shadow-sm">
                    <Icon className="size-6 text-primary" />
                  </div>
                </div>

                <div className="mx-auto max-w-sm">
                  <div className="mb-3 text-sm font-semibold tracking-[0.2em] text-primary/80">
                    {step.id}
                  </div>

                  <h3 className="text-xl font-bold tracking-tight">
                    {step.title}
                  </h3>

                  <p className="mt-4 text-sm leading-7 text-muted-foreground md:text-[15px]">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;

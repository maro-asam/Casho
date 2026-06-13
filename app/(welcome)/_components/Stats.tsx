"use client";

import { DiaTextReveal } from "@/components/ui/dia-text-reveal";
import { useLang } from "../_i18n/LanguageContext";

export default function StatsSection() {
  const { t } = useLang();
  const st = t.stats;

  return (
    <section className="relative overflow-hidden py-10">
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(to right, zinc 1px, transparent 1px),
            linear-gradient(to bottom, zinc 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center flex flex-col items-center gap-2">
          <DiaTextReveal
            className="rounded-lg border border-primary/15 bg-primary/5 px-4 py-1.5 text-md font-medium"
            text={st.badge}
            colors={["#1447e6", "#20bb6b", "#1447e6"]}
          />

          <h2 className="text-3xl md:text-4xl leading-tight tracking-tight text-zinc">
            {st.title}
            <span className="mt-4 font-bold block text-primary">
              {st.titleAccent}
            </span>
          </h2>

          {/* <p className="mt-5 text-base leading-8 text-muted-foreground">
            {st.subtitle}
          </p> */}
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {st.items.map((item, index) => (
            <div
              key={index}
              className="group relative overflow-hidden rounded-xl border border-zinc/10 bg-zinc/[0.03] p-6 backdrop-blur-sm transition duration-300 hover:border-primary/30 hover:bg-zinc/[0.05]"
            >
              <div className="absolute inset-0 bg-linear-to-b from-zinc/[0.04] to-transparent opacity-0 transition duration-300 group-hover:opacity-100" />

              <div className="relative text-center">
                <div className="text-4xl font-extrabold tracking-tight text-primary">
                  {item.value}
                </div>

                <div className="mt-3 text-base font-medium text-zinc/90">
                  {item.title}
                </div>

                <p className="mt-2 text-sm leading-7 text-muted-foreground">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

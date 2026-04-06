import { stats } from "@/constants/welcome/stats.constants";

export default function StatsSection() {
  return (
    <section className="relative overflow-hidden py-10 md:py-14 lg:py-20">
      {/* background glow */}
      <div className="absolute inset-0">
        <div className="absolute right-1/2 top-0 h-72 w-72 translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/4 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
      </div>

      {/* subtle grid */}
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

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex rounded-full border border-primary/15 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
            أرقام كــاشو
          </span>

          <h2 className="text-3xl md:text-4xl font-extrabold leading-tight tracking-tight text-zinc">
            أرقام بتثبت إن البيع أونلاين
            <span className="block bg-linear-to-l from-zinc via-zinc to-primary bg-clip-text text-transparent">
              لازم يكون أسهل
            </span>
          </h2>

          <p className="mt-5 text-base leading-8 text-zinc/60 ">
            كاشو بتساعدك تطلق متجرك، تستقبل الطلبات، وتبيع لعملائك في مصر بطريقة
            أبسط وأسرع ومن غير تعقيد تقني.
          </p>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((item, index) => (
            <div
              key={index}
              className="group relative overflow-hidden rounded-3xl border border-zinc/10 bg-zinc/[0.03] p-6 backdrop-blur-sm transition duration-300 hover:border-primary/30 hover:bg-zinc/[0.05]"
            >
              <div className="absolute inset-0 bg-linear-to-b from-zinc/[0.04] to-transparent opacity-0 transition duration-300 group-hover:opacity-100" />

              <div className="relative text-center">
                <div className="text-4xl font-extrabold tracking-tight text-primary ">
                  {item.value}
                </div>

                <div className="mt-3 text-base font-semibold text-zinc/90">
                  {item.title}
                </div>

                <p className="mt-2 text-sm leading-7 text-zinc/50">
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

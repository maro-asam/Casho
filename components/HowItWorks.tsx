import { Store, Link as LinkIcon, ShoppingCart } from "lucide-react";

const steps = [
  {
    icon: Store,
    title: "أنشئ متجرك",
    description:
      "سجل وأنشئ متجرك في دقائق، وأضف المنتجات والصور والأسعار بكل سهولة.",
  },
  {
    icon: LinkIcon,
    title: "احصل على رابط متجرك",
    description:
      "هيكون ليك رابط خاص بمتجرك تقدر تشاركه مع العملاء على السوشيال ميديا.",
  },
  {
    icon: ShoppingCart,
    title: "استقبل الطلبات",
    description:
      "العملاء يطلبوا المنتجات مباشرة من المتجر وتوصلك الطلبات جاهزة للتأكيد.",
  },
];

const HowItWorks = () => {
  return (
    <section className="w-full py-24">
      <div className="mx-auto max-w-7xl px-6">
        {/* Title */}
        <div className="mb-20 text-center">
          <h2 className="text-3xl md:text-4xl font-bold">
            ازاي تبدأ في <span className="text-primary">3</span> خطوات بس
          </h2>
          <p className="mt-4 text-muted-foreground">
            منصة بسيطة تخليك تبدأ البيع أونلاين بدون تعقيد
          </p>
        </div>

        {/* Steps */}
        <div className="relative grid gap-10 md:grid-cols-3">
          
          {/* الخط الرابط */}
          <div className="pointer-events-none absolute left-0 right-0 top-10 hidden h-px bg-primary md:block" />

          {steps.map((step, index) => {
            const Icon = step.icon;

            return (
              <div key={index} className="relative text-center">
                
                {/* الرقم */}
                <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-full border bg-background text-sm text-primary border-primary font-bold">
                  {index + 1}
                </div>

                <div className="rounded-2xl border bg-background p-8 transition hover:-translate-y-1 hover:shadow-md">
                  
                  {/* icon */}
                  <div className="mb-5 flex justify-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                  </div>

                  <h3 className="mb-3 text-lg font-semibold">{step.title}</h3>

                  <p className="text-sm leading-7 text-muted-foreground">
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
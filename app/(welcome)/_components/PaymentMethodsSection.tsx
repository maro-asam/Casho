"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import {
  PAYMENT_METHODS,
  PAYMENT_REGION_LABELS,
  type PaymentRegion,
} from "@/constants/welcome/payment-methods";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const REGIONS: PaymentRegion[] = ["global", "egypt", "saudi"];

const REGION_STYLES: Record<PaymentRegion, string> = {
  global: "from-blue-500/10 to-cyan-500/5",
  egypt: "from-emerald-500/10 to-lime-500/5",
  saudi: "from-violet-500/10 to-fuchsia-500/5",
};

export default function PaymentMethodsSection() {
  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-primary/15 bg-background px-4 py-10 shadow-sm md:px-8 md:py-14">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,hsl(var(--primary)/0.14),transparent_34%)]" />

      <div className="relative mx-auto max-w-7xl space-y-10">
        <div className="mx-auto max-w-3xl space-y-4 text-center">
          <Badge variant="secondary" className="rounded-full px-4 py-1">
            وسائل الدفع
          </Badge>

          <h2 className="text-3xl font-semibold tracking-tight md:text-5xl">
            ادفع بالطريقة اللي تناسب عميلك
          </h2>

          <p className="text-sm leading-7 text-muted-foreground md:text-base">
            وفر في متجرك وسائل دفع عالمية، مصرية، وسعودية — مع دعم بيانات
            التحويل اليدوي لكل وسيلة بشكل واضح وسهل.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {REGIONS.map((region, index) => {
            const methods = PAYMENT_METHODS.filter(
              (method) => method.region === region,
            );

            return (
              <motion.div
                key={region}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
                viewport={{ once: true }}
                className={cn(
                  "rounded-3xl border bg-linear-to-br p-5 shadow-sm",
                  REGION_STYLES[region],
                )}
              >
                <div className="mb-5 flex items-center justify-between gap-3">
                  <div className="text-right">
                    <h3 className="font-semibold">
                      {PAYMENT_REGION_LABELS[region]}
                    </h3>

                    <p className="mt-1 text-xs text-muted-foreground">
                      {methods.length} وسائل دفع
                    </p>
                  </div>

                  <div className="flex size-11 items-center justify-center rounded-2xl border bg-background/70 text-lg font-semibold">
                    {methods.length}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {methods.map((method, methodIndex) => (
                    <motion.div
                      key={method.key}
                      initial={{ opacity: 0, scale: 0.96 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      transition={{
                        delay: index * 0.08 + methodIndex * 0.035,
                      }}
                      viewport={{ once: true }}
                      className="group rounded-2xl border bg-background/80 p-4 text-center shadow-sm backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-md"
                    >
                      <div className="mx-auto flex size-16 items-center justify-center rounded-2xl border bg-white p-3 shadow-sm">
                        <Image
                          src={method.logo}
                          alt={method.label}
                          width={64}
                          height={64}
                          className="max-h-11 w-auto object-contain transition duration-300 group-hover:scale-105"
                        />
                      </div>

                      <p className="mt-3 truncate text-sm font-semibold">
                        {method.label}
                      </p>

                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {method.manual ? "تحويل يدوي" : "بوابة دفع"}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-3 rounded-3xl border bg-card/70 p-4 shadow-sm backdrop-blur">
          <MiniFeature text="لوجوهات واضحة" />
          <MiniFeature text="تقسيم حسب السوق" />
          <MiniFeature text="تحويلات يدوية" />
          <MiniFeature text="جاهز للـ Checkout" />
        </div>
      </div>
    </section>
  );
}

function MiniFeature({ text }: { text: string }) {
  return (
    <div className="rounded-full border bg-background px-4 py-2 text-sm text-muted-foreground">
      {text}
    </div>
  );
}

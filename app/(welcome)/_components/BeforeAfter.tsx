"use client";

import {
  afterItems,
  beforeItems,
} from "@/constants/welcome/beforeAfter.constants";
import { motion } from "framer-motion";
import { ArrowLeftRight } from "lucide-react";

const transition = {
  duration: 0.55,
  ease: [0.22, 1, 0.36, 1] as const,
};

export default function BeforeAfterSection() {
  return (
    <section className="py-10 md:py-14 lg:py-20">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={transition}
          className="mx-auto max-w-3xl text-center"
        >
          <span className="inline-flex rounded-lg border border-primary/15 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
            قبل / بعد
          </span>

          <h2 className="text-3xl font-extrabold leading-tight text-foreground sm:text-4xl md:text-5xl">
            الفرق بين البيع التقليدي
            <span className="block bg-linear-to-l from-primary via-sky-500 to-primary bg-clip-text text-transparent">
              والبيع عن طريق كاشو
            </span>
          </h2>

          <p className="mt-5 text-base leading-8 text-muted-foreground sm:text-lg">
            بدل ما تفضل تجمع الطلبات يدويًا وترد على كل عميل بشكل عشوائي، كاشو
            بتنظم لك العملية من أول عرض المنتج لحد استلام الطلب.
          </p>
        </motion.div>

        <div className="mt-16 grid gap-6 lg:grid-cols-[1fr_auto_1fr]">
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={transition}
            className="rounded-lg border border-red-500/20 bg-background/70 p-6 sm:p-7"
          >
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-red-500/80">Before</p>
                <h3 className="mt-1 text-2xl font-bold text-red-600">
                  قبل Casho
                </h3>
              </div>

              <span className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-1 text-xs font-medium text-red-500">
                عشوائية وتعب
              </span>
            </div>

            <div className="space-y-4">
              {beforeItems.map((item, index) => {
                const Icon = item.icon;

                return (
                  <div
                    key={index}
                    className="rounded-lg border border-red-500/20 bg-card/80 p-4 shadow-sm"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-500/20 text-red-500">
                        <Icon className="size-4.5" />
                      </div>

                      <div>
                        <h4 className="font-semibold text-foreground">
                          {item.title}
                        </h4>
                        <p className="mt-2 text-sm leading-7 text-muted-foreground">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 rounded-lg border border-red-500/20 bg-background/80 p-4 shadow-sm">
              <div className="space-y-3">
                <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3">
                  <p className="text-sm text-red-700">
                    &quot;ممكن تفاصيل المنتج؟&quot;
                  </p>
                </div>
                <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3">
                  <p className="text-sm text-red-700">
                    &quot;عايز أطلب، ابعتلي السعر والمقاس&quot;
                  </p>
                </div>
                <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3">
                  <p className="text-sm text-red-700">
                    &quot;العنوان: ... واسم المنتج كان إيه؟&quot;
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="hidden items-center justify-center lg:flex"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-primary/15 bg-primary/5 text-primary shadow-sm">
              <ArrowLeftRight className="size-6" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={transition}
            className="rounded-lg border border-primary/15 bg-primary/[0.035] p-6 sm:p-7"
          >
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-primary/80">After</p>
                <h3 className="mt-1 text-2xl font-bold text-foreground">
                  بعد Casho
                </h3>
              </div>

              <span className="rounded-lg border border-primary/15 bg-primary/10 px-3 py-1 text-xs font-medium text-primary shadow-sm">
                تنظيم وسرعة
              </span>
            </div>

            <div className="space-y-4">
              {afterItems.map((item, index) => {
                const Icon = item.icon;

                return (
                  <div
                    key={index}
                    className="rounded-lg border border-primary/20 bg-card p-4 shadow-sm"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Icon className="size-4.5" />
                      </div>

                      <div>
                        <h4 className="font-semibold text-foreground">
                          {item.title}
                        </h4>
                        <p className="mt-2 text-sm leading-7 text-muted-foreground">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 rounded-lg border border-border bg-card p-4 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">معاينة الطلب</p>
                  <h4 className="mt-1 font-medium text-foreground">
                    طلب جديد #1024
                  </h4>
                </div>

                <span className="rounded-lg bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  جديد
                </span>
              </div>

              <div className="space-y-3">
                <div className="rounded-lg border border-border bg-muted/40 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-foreground">تيشيرت أسود</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        الكمية: 2
                      </p>
                    </div>
                    <p className="text-sm font-medium text-foreground">
                      450 ج.م
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border border-border bg-muted/40 p-3">
                    <p className="text-xs text-muted-foreground">العميل</p>
                    <p className="mt-1 text-sm font-medium text-foreground">
                      أحمد محمود
                    </p>
                  </div>

                  <div className="rounded-lg border border-border bg-muted/40 p-3">
                    <p className="text-xs text-muted-foreground">الدفع</p>
                    <p className="mt-1 text-sm font-medium text-foreground">
                      فودافون كاش
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

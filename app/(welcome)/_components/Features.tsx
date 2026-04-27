"use client";

import { features } from "@/constants/welcome/features.constants";
import { motion } from "framer-motion";
import { BarChart3, PackageCheck } from "lucide-react";

export default function CashoFeaturesSection() {
  return (
    <section className="py-24">
      <div className="wrapper">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-2xl text-center"
        >
          <span className="inline-flex rounded-xl border border-primary/15 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
            المميزات
          </span>

          <h2 className="mt-5 text-3xl leading-tight tracking-tight text-foreground md:text-4xl">
            كل اللي محتاجه عشان تبيع أونلاين
            <span className="mt-4 block font-semibold bg-linear-to-l from-primary to-sky-500 bg-clip-text text-transparent">
              من غير لخبطة ولا تعقيد
            </span>
          </h2>

          <p className="mt-5 text-base leading-8 text-muted-foreground md:text-lg">
            كاشو بيسهّل عليك عرض المنتجات، استقبال الطلبات، ومتابعة شغلك كله من
            مكان واحد.
          </p>
        </motion.div>

        <div className="mt-14 grid gap-6 lg:grid-cols-5">
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.55 }}
            className="relative overflow-hidden rounded-xl border border-border bg-card p-6 lg:col-span-2"
          >
            <div className="absolute inset-x-0 top-0 h-24 bg-linear-to-b from-primary/8 to-transparent" />

            <div className="relative">
              <div className="flex items-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <PackageCheck className="size-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">إدارة الطلبات</p>
                  <h3 className="text-xl font-semibold text-foreground">
                    شوف الطلبات بشكل واضح
                  </h3>
                </div>
              </div>

              <p className="mt-4 text-sm leading-7 text-muted-foreground md:text-[15px]">
                بدل اللخبطة بين الشات والمكالمات، كل طلب بيظهرلك ببياناته كاملة
                عشان تراجع وتتابع بسرعة.
              </p>

              <div className="mt-6 rounded-xl border border-border bg-background p-4 shadow-sm">
                <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">طلب جديد</p>
                    <h4 className="mt-1 font-semibold text-foreground">
                      أوردر #1024
                    </h4>
                  </div>

                  <span className="rounded-xl bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                    جديد
                  </span>
                </div>

                <div className="space-y-3 py-4">
                  <div className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
                    <div>
                      <p className="font-medium text-foreground">تيشيرت أسود</p>
                      <p className="text-sm text-muted-foreground">الكمية: 2</p>
                    </div>
                    <p className="text-sm font-medium text-foreground">
                      450 ج.م
                    </p>
                  </div>

                  <div className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
                    <div>
                      <p className="font-medium text-foreground">شنطة بيج</p>
                      <p className="text-sm text-muted-foreground">الكمية: 1</p>
                    </div>
                    <p className="text-sm font-medium text-foreground">
                      320 ج.م
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-border bg-card px-4 py-3">
                    <p className="text-xs text-muted-foreground">العميل</p>
                    <p className="mt-1 font-medium text-foreground">
                      أحمد محمود
                    </p>
                  </div>

                  <div className="rounded-xl border border-border bg-card px-4 py-3">
                    <p className="text-xs text-muted-foreground">الدفع</p>
                    <p className="mt-1 font-medium text-foreground">
                      فودافون كاش
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <div className="grid gap-6 sm:grid-cols-2 lg:col-span-3 lg:grid-cols-2">
            {features.map((feature, index) => {
              const Icon = feature.icon;

              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 22 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.45, delay: index * 0.08 }}
                  className="rounded-xl border border-border bg-card p-6 transition-opacity hover:opacity-95"
                >
                  <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="size-5" />
                  </div>

                  <h3 className="mt-5 text-lg font-semibold text-foreground">
                    {feature.title}
                  </h3>

                  <p className="mt-3 text-sm leading-7 text-muted-foreground">
                    {feature.description}
                  </p>
                </motion.div>
              );
            })}

            <motion.div
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.45, delay: 0.2 }}
              className="rounded-xl border border-border bg-card p-6 sm:col-span-2"
            >
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <BarChart3 className="size-5" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">
                  نظرة سريعة على شغلك
                </h3>
              </div>

              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                أرقام واضحة قدامك تخليك فاهم الدنيا ماشية إزاي بدون dashboard
                معقدة.
              </p>

              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <div className="rounded-xl border border-border bg-background p-4">
                  <p className="text-sm text-muted-foreground">طلبات جديدة</p>
                  <p className="mt-2 text-2xl font-extrabold text-foreground">
                    +128
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-background p-4">
                  <p className="text-sm text-muted-foreground">منتجات</p>
                  <p className="mt-2 text-2xl font-extrabold text-foreground">
                    42
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-background p-4">
                  <p className="text-sm text-muted-foreground">طرق دفع</p>
                  <p className="mt-2 text-2xl font-extrabold text-foreground">
                    4
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

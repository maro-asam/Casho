"use client";

import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, Sparkles } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function CTASection() {
  return (
    <section className="py-10 md:py-14 lg:py-20">
      <div className="wrapper">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="relative overflow-hidden rounded-[32px] border border-border bg-linear-to-br from-white via-white to-primary/4 px-6 py-10 shadow-sm sm:px-8 md:px-10 md:py-14"
        >
          {/* background accents */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute right-[-60px] top-[-60px] h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
            <div className="absolute left-[-40px] bottom-[-60px] h-36 w-36 rounded-full bg-sky-500/10 blur-3xl" />
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-l from-transparent via-primary/30 to-transparent" />
          </div>

          <div className="relative grid items-center gap-10 lg:grid-cols-[1.15fr_.85fr]">
            {/* content */}
            <div className="text-center lg:text-right">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-4 py-2 text-sm font-medium text-primary">
                <Sparkles className="size-4" />
                عرض الإطلاق شغال الآن
              </div>

              <h2 className="mt-6 text-3xl font-extrabold leading-tight tracking-tight text-foreground sm:text-4xl md:text-5xl">
                ابدأ متجرك النهارده
                <span className="mt-2 block text-primary">
                  قبل ما سعر البداية يخلص
                </span>
              </h2>

              <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-muted-foreground md:text-lg lg:mx-0">
                كاشو بيساعدك تعرض منتجاتك، تستقبل طلباتك، وتدير شغلك بشكل
                منظم من غير تعقيد. ابدأ دلوقتي بسعر الإطلاق قبل ما الأماكن
                المتاحة تخلص.
              </p>

              <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row lg:justify-start">
                <Button
                  asChild
                  size="lg"
                  className="h-12 rounded-xl px-8 text-sm font-medium shadow-sm"
                >
                  <Link href="/signup">
                    ابدأ دلوقتي
                    <ArrowLeft className="ms-2 size-4.5" />
                  </Link>
                </Button>

                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="h-12 rounded-xl border-border bg-white px-8 text-sm font-medium"
                >
                  <Link href="#pricing">شوف الأسعار</Link>
                </Button>
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-muted-foreground lg:justify-start">
                <span className="inline-flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-primary" />
                  تسجيل سريع
                </span>
                <span className="inline-flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-primary" />
                  إعداد بسيط
                </span>
                <span className="inline-flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-primary" />
                  مناسب للتجار في مصر
                </span>
              </div>
            </div>

            {/* side card */}
            <div className="mx-auto w-full max-w-md">
              <div className="rounded-[28px] border border-primary/15 bg-white p-5 shadow-sm">
                <div className="rounded-2xl border border-primary/15 bg-primary/[0.04] p-5">
                  <p className="text-sm font-medium text-muted-foreground">
                    متبقي من عرض البداية
                  </p>

                  <div className="mt-3 flex items-end justify-between gap-4">
                    <div>
                      <p className="text-4xl font-extrabold tracking-tight text-foreground">
                        17
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        تاجر فقط
                      </p>
                    </div>

                    <div className="rounded-2xl border border-primary/15 bg-white px-4 py-2 text-sm font-medium text-primary">
                      سعر خاص
                    </div>
                  </div>

                  <div className="mt-5">
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">نسبة الحجز</span>
                      <span className="font-medium text-foreground">66%</span>
                    </div>

                    <div className="h-2.5 overflow-hidden rounded-full bg-primary/10">
                      <div className="h-full w-2/3 rounded-full bg-primary" />
                    </div>
                  </div>

                  <p className="mt-5 text-sm leading-7 text-muted-foreground">
                    بعد انتهاء الأماكن المتاحة، السعر هيرجع للخطة الأساسية.
                  </p>
                </div>

                <div className="mt-4 rounded-2xl border border-border bg-muted/40 p-4">
                  <p className="text-sm text-foreground">
                    مناسب لو أنت بتبيع من إنستجرام، واتساب، أو صفحات السوشيال
                    وعايز طريقة أرتب وأسهل لاستقبال الطلبات.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
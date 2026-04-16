"use client";

import { motion } from "framer-motion";
import { HelpCircle } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { faqs } from "@/constants/welcome/FAQ.constants";



export default function FAQSection() {
  return (
    <section id="faq" className="py-10 md:py-14 lg:py-20">
      <div className="wrapper">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-2xl text-center"
        >
          <span className="inline-flex items-center gap-2 rounded-xl border border-primary/15 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
            <HelpCircle className="size-4" />
            الأسئلة الشائعة
          </span>

          <h2 className="mt-5 text-3xl font-extrabold leading-tight tracking-tight text-foreground md:text-4xl">
            كل اللي ممكن تسأل عنه
            <span className="mt-2 block bg-linear-to-l from-primary to-sky-500 bg-clip-text text-transparent">
              قبل ما تبدأ على كاشو
            </span>
          </h2>

          <p className="mt-5 text-base leading-8 text-muted-foreground md:text-lg">
            جمعنالك أهم الأسئلة اللي ممكن تيجي في بالك عشان تبقى الصورة واضحة
            من البداية.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.55 }}
          className="mx-auto mt-14 max-w-4xl rounded-xl border border-border bg-card p-3 sm:p-4 md:p-5"
        >
          <Accordion type="single" collapsible className="w-full space-y-3">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="overflow-hidden rounded-xl border border-border bg-background px-5"
              >
                <AccordionTrigger className="text-right text-base font-semibold leading-7 text-foreground hover:no-underline">
                  {faq.question}
                </AccordionTrigger>

                <AccordionContent className="pb-5 text-sm leading-7 text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}
"use client";

import { HelpCircle } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import FadeIn from "./FadeIn";
import { useLang } from "../_i18n/LanguageContext";

export default function FAQSection() {
  const { t } = useLang();
  const fq = t.faq;

  return (
    <section id="faq" className="py-10 md:py-14 lg:py-20">
      <div className="wrapper">
        <FadeIn className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-xl border border-primary/15 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
            <HelpCircle className="size-4" />
            {fq.badge}
          </span>

          <h2 className="mt-5 text-3xl font-extrabold leading-tight tracking-tight text-foreground md:text-4xl">
            {fq.title}
            <span className="mt-2 block bg-linear-to-l from-primary to-sky-500 bg-clip-text text-transparent">
              {fq.titleAccent}
            </span>
          </h2>

          <p className="mt-5 text-base leading-8 text-muted-foreground md:text-lg">
            {fq.subtitle}
          </p>
        </FadeIn>

        <FadeIn
          delay={80}
          className="mx-auto mt-14 max-w-4xl rounded-xl border border-border bg-card p-3 sm:p-4 md:p-5"
        >
          <Accordion type="single" collapsible className="w-full space-y-3">
            {fq.items.map((item, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="overflow-hidden rounded-xl border border-border bg-background px-5"
              >
                <AccordionTrigger className="text-right text-base font-semibold leading-7 text-foreground hover:no-underline">
                  {item.question}
                </AccordionTrigger>

                <AccordionContent className="pb-5 text-sm leading-7 text-muted-foreground">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </FadeIn>
      </div>
    </section>
  );
}

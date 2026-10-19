"use client";

import { useId, useState } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLang } from "../../_i18n/LanguageContext";
import { useLandingCopy } from "./copy";
import Reveal from "./Reveal";

export default function AppleFAQ() {
  const c = useLandingCopy().faq;
  const { t } = useLang();
  const [open, setOpen] = useState<number | null>(null);
  const baseId = useId();

  return (
    <section id="faq" className="al-section scroll-mt-16">
      <div className="al-container">
        <Reveal className="text-center">
          <h2 className="al-section-title">
            {c.title} <span className="text-(--al-muted)">{c.titleMuted}</span>
          </h2>
        </Reveal>

        <Reveal delay={80} className="mx-auto mt-14 max-w-[820px] border-t border-(--al-hair)">
          {t.faq.items.map((item, i) => {
            const isOpen = open === i;
            const panelId = `${baseId}-panel-${i}`;
            const buttonId = `${baseId}-button-${i}`;
            return (
              <div key={item.question} className="border-b border-(--al-hair)">
                <h3>
                  <button
                    id={buttonId}
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => setOpen(isOpen ? null : i)}
                    className="flex w-full items-center justify-between gap-6 py-6 text-start text-[19px] font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--al-tint) md:text-[21px]"
                  >
                    {item.question}
                    <Plus
                      className={cn(
                        "size-5 shrink-0 text-(--al-muted) transition-transform duration-300 ease-[cubic-bezier(0.28,0.11,0.32,1)]",
                        isOpen && "rotate-45",
                      )}
                      strokeWidth={2}
                    />
                  </button>
                </h3>
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  className={cn(
                    "grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.28,0.11,0.32,1)]",
                    isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
                  )}
                >
                  <div className="overflow-hidden">
                    <p className="max-w-[680px] pb-7 text-[17px] leading-relaxed text-(--al-muted)">{item.answer}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </Reveal>
      </div>
    </section>
  );
}

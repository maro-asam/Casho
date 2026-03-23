import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { FAQ_CONTENT, FAQ_ITEMS } from "@/constants";

const FAQ = () => {
  return (
    <section id="faq" className="w-full py-20 ">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto mb-14 max-w-3xl text-center">
          <span className="inline-flex items-center rounded-full border border-primary/15 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
            {FAQ_CONTENT.badge}
          </span>

          <h2 className="mt-5 text-3xl font-extrabold leading-tight tracking-tight md:text-5xl">
            {FAQ_CONTENT.title.before}{" "}
            <span className="text-primary">{FAQ_CONTENT.title.highlight}</span>
          </h2>

          <p className="mt-5 text-base leading-8 text-muted-foreground md:text-lg">
            {FAQ_CONTENT.description}
          </p>
        </div>

        <div className="rounded-4xl border border-border/60 bg-background p-3 shadow-sm md:p-4">
          <Accordion type="single" collapsible className="w-full space-y-3">
            {FAQ_ITEMS.map((faq) => (
              <AccordionItem
                key={faq.id}
                value={faq.id}
                className="rounded-22xl border border-border/60 bg-background px-5 transition-all duration-300 hover:border-primary/20"
              >
                <AccordionTrigger className="py-5 text-right text-base font-semibold leading-7 hover:no-underline md:text-lg">
                  {faq.question}
                </AccordionTrigger>

                <AccordionContent className="pb-5 text-sm leading-8 text-muted-foreground md:text-[15px]">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};

export default FAQ;

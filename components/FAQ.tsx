import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "هل أحتاج خبرة تقنية عشان أستخدم المنصة؟",
    answer:
      "لا، المنصة مصممة لتكون سهلة جدًا. تقدر تضيف منتجاتك وتدير متجرك وتستقبل الطلبات بدون أي خبرة برمجية.",
  },
  {
    question: "هل أقدر أشارك متجري على فيسبوك وواتساب وإنستجرام؟",
    answer:
      "أيوه، هيكون عندك رابط خاص بمتجرك تقدر تبعته لعملائك أو تضيفه في البايو وعلى صفحاتك بكل سهولة.",
  },
  {
    question: "ما هي طرق الدفع المتاحة؟",
    answer:
      "المنصة تدعم طرق دفع مناسبة للسوق المصري مثل فودافون كاش، أورنج كاش، اتصالات كاش، WE Pay، إنستا باي، فوري، التحويل البنكي، والدفع عند الاستلام حسب إعدادات متجرك.",
  },
  {
    question: "هل أقدر أضيف عدد كبير من المنتجات؟",
    answer:
      "أيوه، تقدر تضيف منتجاتك بسهولة وتعدل عليها في أي وقت من لوحة التحكم.",
  },
  {
    question: "هل المتجر بيشتغل على الموبايل؟",
    answer:
      "أيوه، المتجر متجاوب بالكامل ويظهر بشكل ممتاز على الموبايل والتابلت والكمبيوتر.",
  },
  {
    question: "بكام الاشتراك؟",
    answer:
      "السعر الحالي لأول 50 متجر هو 300 جنيه شهريًا، وبعد ذلك هيكون السعر 499 جنيه شهريًا.",
  },
];

const FAQ = () => {
  return (
    <section id="faq" className="w-full py-20">
      <div className="mx-auto max-w-6xl  px-6">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            الأسئلة <span className="text-primary">الشائعة</span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            كل اللي محتاج تعرفه قبل ما تبدأ متجرك
          </p>
        </div>

        <div className="rounded-2xl border bg-background p-2 md:p-4">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-right text-base font-medium">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-sm leading-7 text-primary">
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

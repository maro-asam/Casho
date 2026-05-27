import type { WhyChooseUsContent } from "@/types/store-theme.types";

const DEFAULT_CARDS = [
  {
    icon: "🛡️",
    title: "ضمان الجودة",
    description: "كل منتج يمر بفحص دقيق قبل الشحن لضمان وصوله بأفضل حالة",
  },
  {
    icon: "🚀",
    title: "شحن سريع",
    description: "توصيل خلال 24-48 ساعة لجميع المحافظات مع متابعة الشحنة",
  },
  {
    icon: "💬",
    title: "دعم على مدار الساعة",
    description: "فريق الدعم جاهز للرد على استفساراتك في أي وقت",
  },
  {
    icon: "🔄",
    title: "إرجاع مجاني",
    description: "غير راضٍ؟ أرسل المنتج ونرسلك مبلغك كاملًا خلال 30 يوم",
  },
];

type Props = {
  content?: WhyChooseUsContent;
};

export default function WhyChooseUsSection({ content }: Props) {
  const headline = content?.headline ?? "لماذا تتسوق معنا؟";
  const cards = content?.cards?.length ? content.cards : DEFAULT_CARDS;

  return (
    <section dir="rtl">
      {/* Header */}
      <div className="mb-8 text-center">
        <h2
          className="text-2xl font-bold tracking-tight sm:text-3xl"
          style={{ color: "var(--store-foreground)" }}
        >
          {headline}
        </h2>
        <div
          className="mx-auto mt-2 h-1 w-16 rounded-full"
          style={{ background: "var(--store-primary)" }}
        />
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card, i) => (
          <div
            key={i}
            className="group flex flex-col gap-3 rounded-2xl border p-6 transition-all hover:-translate-y-1 hover:shadow-lg"
            style={{
              background: "var(--store-card)",
              borderColor: "var(--store-border)",
              boxShadow: "var(--store-shadow-sm)",
            }}
          >
            {/* Icon */}
            <div
              className="flex size-12 items-center justify-center rounded-xl text-2xl transition-transform group-hover:scale-110"
              style={{
                background: "color-mix(in srgb, var(--store-primary) 10%, transparent)",
              }}
            >
              {card.icon}
            </div>

            {/* Text */}
            <div className="space-y-1">
              <h3
                className="font-semibold"
                style={{ color: "var(--store-foreground)" }}
              >
                {card.title}
              </h3>
              <p
                className="text-sm leading-relaxed"
                style={{ color: "var(--store-muted-foreground)" }}
              >
                {card.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

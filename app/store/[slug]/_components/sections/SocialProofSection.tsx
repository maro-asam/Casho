import type { SocialProofContent } from "@/types/store-theme.types";

const DEFAULT_STATS = [
  { icon: "😊", value: "10,000+", label: "عميل سعيد" },
  { icon: "⭐", value: "4.9", label: "متوسط التقييم" },
  { icon: "🚚", value: "24h", label: "متوسط التوصيل" },
  { icon: "🔄", value: "30 يوم", label: "ضمان الاسترجاع" },
];

type Props = {
  content?: SocialProofContent;
};

export default function SocialProofSection({ content }: Props) {
  const headline = content?.headline ?? "لماذا يثق بنا آلاف العملاء؟";
  const stats = content?.stats?.length ? content.stats : DEFAULT_STATS;

  return (
    <section className="py-10" dir="rtl">
      {/* Section header */}
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

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((stat, i) => (
          <div
            key={i}
            className="flex flex-col items-center gap-2 rounded-2xl border px-4 py-6 text-center transition-shadow hover:shadow-md"
            style={{
              background: "var(--store-card)",
              borderColor: "var(--store-border)",
              boxShadow: "var(--store-shadow-sm)",
            }}
          >
            <span className="text-3xl">{stat.icon}</span>
            <span
              className="text-2xl font-extrabold leading-none"
              style={{ color: "var(--store-primary)" }}
            >
              {stat.value}
            </span>
            <span
              className="text-sm"
              style={{ color: "var(--store-muted-foreground)" }}
            >
              {stat.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

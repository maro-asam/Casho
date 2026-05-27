"use client";

import { useState } from "react";
import { ChevronRight, ChevronLeft, Star, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TestimonialsContent, TestimonialItem } from "@/types/store-theme.types";

const DEFAULT_TESTIMONIALS: TestimonialItem[] = [
  {
    name: "أحمد محمد",
    text: "منتجات ممتازة وجودة عالية جدًا. الشحن وصل في نفس اليوم وكنت متفاجئ جدًا بالسرعة دي!",
    rating: 5,
  },
  {
    name: "سارة أحمد",
    text: "أفضل متجر تسوقت منه. خدمة العملاء تعاملت معايا باحترافية عالية وحلّت مشكلتي بسرعة",
    rating: 5,
  },
  {
    name: "محمد علي",
    text: "المنتج بالضبط زي ما في الصور، لا بل أحسن! هشتري تاني بكل تأكيد",
    rating: 5,
  },
  {
    name: "نور حسن",
    text: "سعر ممتاز مقارنة بالجودة. جربت متاجر كتير لكن ده الأفضل",
    rating: 4,
  },
];

type Props = {
  content?: TestimonialsContent;
};

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className="size-4"
          style={{
            fill: i < rating ? "#f59e0b" : "transparent",
            color: i < rating ? "#f59e0b" : "var(--store-border)",
          }}
        />
      ))}
    </div>
  );
}

export default function TestimonialsSection({ content }: Props) {
  const headline = content?.headline ?? "ماذا يقول عملاؤنا؟";
  const items = content?.items?.length ? content.items : DEFAULT_TESTIMONIALS;
  const [current, setCurrent] = useState(0);

  const prev = () => setCurrent((c) => (c === 0 ? items.length - 1 : c - 1));
  const next = () => setCurrent((c) => (c === items.length - 1 ? 0 : c + 1));

  const item = items[current];

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

      {/* Carousel */}
      <div className="relative mx-auto max-w-2xl">
        {/* Card */}
        <div
          className="rounded-3xl border p-8 text-center transition-all"
          style={{
            background: "var(--store-card)",
            borderColor: "var(--store-border)",
            boxShadow: "var(--store-shadow-md)",
          }}
        >
          {/* Quote icon */}
          <div className="mb-4 flex justify-center">
            <div
              className="flex size-10 items-center justify-center rounded-full"
              style={{ background: "color-mix(in srgb, var(--store-primary) 12%, transparent)" }}
            >
              <Quote className="size-5" style={{ color: "var(--store-primary)" }} />
            </div>
          </div>

          {/* Stars */}
          <div className="mb-4 flex justify-center">
            <StarRating rating={item.rating ?? 5} />
          </div>

          {/* Review text */}
          <p
            className="mb-6 text-lg leading-relaxed"
            style={{ color: "var(--store-foreground)" }}
          >
            &ldquo;{item.text}&rdquo;
          </p>

          {/* Author */}
          <div className="flex items-center justify-center gap-3">
            {item.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.avatar}
                alt={item.name}
                className="size-10 rounded-full object-cover"
              />
            ) : (
              <div
                className="flex size-10 items-center justify-center rounded-full text-sm font-bold"
                style={{
                  background: "var(--store-primary)",
                  color: "var(--store-primary-foreground)",
                }}
              >
                {item.name.charAt(0)}
              </div>
            )}
            <span
              className="font-semibold"
              style={{ color: "var(--store-foreground)" }}
            >
              {item.name}
            </span>
            <span
              className="text-xs"
              style={{ color: "var(--store-muted-foreground)" }}
            >
              ✅ عميل موثّق
            </span>
          </div>
        </div>

        {/* Navigation */}
        {items.length > 1 && (
          <>
            <Button
              variant="outline"
              size="icon"
              onClick={next}
              className="absolute -right-4 top-1/2 -translate-y-1/2 rounded-full shadow-md"
              style={{
                background: "var(--store-card)",
                borderColor: "var(--store-border)",
              }}
            >
              <ChevronRight className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={prev}
              className="absolute -left-4 top-1/2 -translate-y-1/2 rounded-full shadow-md"
              style={{
                background: "var(--store-card)",
                borderColor: "var(--store-border)",
              }}
            >
              <ChevronLeft className="size-4" />
            </Button>
          </>
        )}

        {/* Dots */}
        {items.length > 1 && (
          <div className="mt-6 flex justify-center gap-2">
            {items.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className="size-2 rounded-full transition-all"
                style={{
                  background:
                    i === current
                      ? "var(--store-primary)"
                      : "var(--store-border)",
                  transform: i === current ? "scale(1.4)" : "scale(1)",
                }}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

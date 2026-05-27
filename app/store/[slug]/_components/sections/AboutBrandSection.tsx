import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AboutBrandContent } from "@/types/store-theme.types";

type Props = {
  storeName: string;
  content?: AboutBrandContent;
};

export default function AboutBrandSection({ storeName, content }: Props) {
  const headline = content?.headline ?? `قصتنا مع ${storeName}`;
  const text =
    content?.text ??
    "نحن نؤمن بأن التسوق تجربة وليست مجرد عملية شراء. لهذا نحرص على تقديم أفضل المنتجات بأعلى معايير الجودة وأسرع خدمة توصيل.";
  const ctaText = content?.ctaText ?? "اعرف أكثر عنّا";
  const ctaLink = content?.ctaLink ?? "/about";
  const hasImage = !!content?.image;

  return (
    <section
      className="overflow-hidden rounded-3xl"
      style={{
        background: "var(--store-card)",
        border: "1px solid var(--store-border)",
        boxShadow: "var(--store-shadow-sm)",
      }}
      dir="rtl"
    >
      <div className={`flex flex-col ${hasImage ? "lg:flex-row" : ""}`}>
        {/* Image */}
        {hasImage && (
          <div className="relative h-64 w-full shrink-0 lg:h-auto lg:w-1/2">
            <Image
              src={content!.image!}
              alt={storeName}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(to left, transparent, rgba(0,0,0,0.2))",
              }}
            />
          </div>
        )}

        {/* Content */}
        <div className="flex flex-col justify-center gap-6 p-8 lg:p-12">
          {/* Eyebrow */}
          <span
            className="text-xs font-bold uppercase tracking-widest"
            style={{ color: "var(--store-primary)" }}
          >
            عن المتجر
          </span>

          {/* Headline */}
          <h2
            className="text-2xl font-bold leading-snug sm:text-3xl"
            style={{ color: "var(--store-foreground)" }}
          >
            {headline}
          </h2>

          {/* Text */}
          <p
            className="max-w-lg text-base leading-8"
            style={{ color: "var(--store-muted-foreground)" }}
          >
            {text}
          </p>

          {/* CTA */}
          <div>
            <Button
              asChild
              style={{
                background: "var(--store-primary)",
                color: "var(--store-primary-foreground)",
                borderRadius: "var(--store-radius)",
              }}
            >
              <Link href={ctaLink} className="flex items-center gap-2">
                {ctaText}
                <ArrowLeft className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

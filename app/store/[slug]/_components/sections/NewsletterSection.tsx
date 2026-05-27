"use client";

import { useState } from "react";
import { Mail, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { NewsletterContent } from "@/types/store-theme.types";

type Props = {
  content?: NewsletterContent;
};

export default function NewsletterSection({ content }: Props) {
  const headline = content?.headline ?? "اشترك واحصل على خصم 15% على أول طلب 🎁";
  const subheadline =
    content?.subheadline ??
    "كن أول من يعرف عن العروض الحصرية والمنتجات الجديدة";
  const placeholder = content?.placeholder ?? "أدخل بريدك الإلكتروني";
  const ctaText = content?.ctaText ?? "اشترك الآن";

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("loading");
    // Simulate API call — wire to real email collection later
    await new Promise((r) => setTimeout(r, 800));
    setStatus("success");
  }

  return (
    <section
      className="overflow-hidden rounded-3xl"
      style={{
        background:
          "linear-gradient(135deg, var(--store-primary) 0%, color-mix(in srgb, var(--store-primary) 70%, #000) 100%)",
        color: "var(--store-primary-foreground)",
      }}
      dir="rtl"
    >
      {/* Decorative circles */}
      <div className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-white/5" />
      <div className="pointer-events-none absolute -bottom-20 left-8 size-80 rounded-full bg-white/5" />

      <div className="relative z-10 flex flex-col items-center gap-6 px-6 py-14 text-center sm:px-10">
        {/* Icon */}
        <div className="flex size-14 items-center justify-center rounded-2xl bg-white/15">
          <Mail className="size-7" />
        </div>

        {/* Text */}
        <div className="space-y-2">
          <h2 className="text-2xl font-bold sm:text-3xl">{headline}</h2>
          <p className="max-w-md text-sm opacity-80">{subheadline}</p>
        </div>

        {/* Form */}
        {status === "success" ? (
          <div className="flex items-center gap-2 rounded-2xl bg-white/15 px-6 py-3 text-sm font-medium">
            <CheckCircle className="size-5" />
            <span>تم الاشتراك! 🎉 ستصلك رسالة قريبًا</span>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="flex w-full max-w-md gap-2"
          >
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={placeholder}
              className="flex-1 rounded-xl border-white/20 bg-white/10 text-white placeholder:text-white/50 focus:border-white/50 focus:ring-white/20"
            />
            <Button
              type="submit"
              disabled={status === "loading"}
              className="shrink-0 rounded-xl bg-white font-semibold hover:bg-white/90"
              style={{ color: "var(--store-primary)" }}
            >
              {status === "loading" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                ctaText
              )}
            </Button>
          </form>
        )}

        <p className="text-xs opacity-60">
          لن نرسل لك أي بريد مزعج • يمكنك إلغاء الاشتراك في أي وقت
        </p>
      </div>
    </section>
  );
}

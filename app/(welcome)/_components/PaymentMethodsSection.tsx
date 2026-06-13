"use client";

import Image from "next/image";
import {
  PAYMENT_METHODS,
  PAYMENT_REGION_LABELS,
  type PaymentRegion,
} from "@/constants/welcome/payment-methods";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import FadeIn from "./FadeIn";
import { useLang } from "../_i18n/LanguageContext";
import { Marquee } from "@/components/ui/marquee";

const REGIONS: PaymentRegion[] = ["global", "egypt", "saudi"];

const REGION_STYLES: Record<PaymentRegion, string> = {
  global: "from-blue-500/10 to-cyan-500/5",
  egypt: "from-emerald-500/10 to-lime-500/5",
  saudi: "from-violet-500/10 to-fuchsia-500/5",
};

function MiniFeature({ text }: { text: string }) {
  return (
    <div className="rounded-full border bg-background px-4 py-2 text-sm text-muted-foreground">
      {text}
    </div>
  );
}

function PaymentCard({ method }: { method: (typeof PAYMENT_METHODS)[number] }) {
  return (
    <figure
      className={cn(
        "group relative w-32 cursor-pointer overflow-hidden text-center  transition-all duration-300 hover:-translate-y-1 ",
      )}
    >
      <div className="mx-auto flex size-16 items-center justify-center">
        <Image
          src={method.logo}
          alt={method.label}
          width={64}
          height={64}
          className="max-h-16 w-auto object-contain transition duration-300 group-hover:scale-105"
        />
      </div>
    </figure>
  );
}

export default function PaymentMethodsSection() {
  const { t } = useLang();

  const allMethods = PAYMENT_METHODS;
  const firstRow = allMethods.slice(0, Math.ceil(allMethods.length / 2));
  const secondRow = allMethods.slice(Math.ceil(allMethods.length / 2));

  return (
    <section className="">
      <div className="relative mx-auto max-w-7xl space-y-10">
        <FadeIn className="relative flex w-full flex-col items-center justify-center gap-4 overflow-hidden p-6 opacity-70 transition duration-300 hover:opacity-100 ">
          <Marquee pauseOnHover className="[--duration:30s]">
            {firstRow.map((method) => (
              <PaymentCard key={method.key} method={method} />
            ))}
          </Marquee>

          <Marquee reverse pauseOnHover className="[--duration:30s]">
            {secondRow.map((method) => (
              <PaymentCard key={method.key} method={method} />
            ))}
          </Marquee>

          <div className="pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-linear-to-r from-background"></div>
          <div className="pointer-events-none absolute inset-y-0 right-0 w-1/4 bg-linear-to-l from-background"></div>
        </FadeIn>
      </div>
    </section>
  );
}

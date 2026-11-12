"use client";

import Image from "next/image";
import { Bell, ShoppingCart, TicketPercent, Truck, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLandingCopy } from "./copy";
import Reveal from "./Reveal";
import SectionHead from "./SectionHead";

const PAYMENT_LOGOS = [
  { src: "/payment-logos/vodafone-cash.svg", alt: "Vodafone Cash" },
  { src: "/payment-logos/instapay.svg", alt: "InstaPay" },
  { src: "/payment-logos/fawry.svg", alt: "Fawry" },
  { src: "/payment-logos/visa-mastercard.svg", alt: "Visa / Mastercard" },
  { src: "/payment-logos/cash-on-delivery.svg", alt: "Cash on delivery" },
  { src: "/payment-logos/bank-transfer.svg", alt: "Bank transfer" },
];

type Card = { eyebrow: string; title: string; body: string };

export default function Bento() {
  const c = useLandingCopy().bento;

  return (
    <section id="features" aria-labelledby="features-title" className="al-section scroll-mt-16">
      <SectionHead id="features-title" eyebrow={c.eyebrow} title={c.title1} accent={c.title2} />

      <div className="al-container-wide al-body">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-5 lg:grid-cols-6">
          {/* Payments — the wide hero tile */}
          <Reveal className="al-tile flex flex-col justify-between gap-8 p-7 sm:col-span-2 md:p-10 lg:col-span-4">
            <TileText card={c.payments} large />
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-6 lg:grid-cols-3">
              {PAYMENT_LOGOS.map((logo) => (
                <div key={logo.src} className="al-well grid h-16 place-items-center p-3">
                  <Image src={logo.src} alt={logo.alt} width={88} height={36} className="h-9 w-full max-w-[96px] object-contain" />
                </div>
              ))}
            </div>
          </Reveal>

          {/* Launch time — one big number */}
          <Reveal delay={80} className="al-tile flex flex-col justify-end p-7 sm:col-span-2 md:p-10 lg:col-span-2">
            <p className="flex items-baseline gap-3">
              <span className="text-[96px] font-bold leading-none tabular-nums md:text-[120px]">{c.launch.value}</span>
              <span className="text-[28px] font-semibold">{c.launch.unit}</span>
            </p>
            <p className="mt-4 text-[17px] leading-relaxed text-(--al-muted)">{c.launch.body}</p>
          </Reveal>

          <IconTile icon={Truck} card={c.shipping} className="lg:col-span-2" />
          <IconTile icon={TicketPercent} card={c.offers} className="lg:col-span-2" delay={80} />
          <IconTile icon={ShoppingCart} card={c.carts} className="sm:col-span-2 lg:col-span-2" delay={160} />
          <IconTile icon={Upload} card={c.shopify} className="lg:col-span-3" />
          <IconTile icon={Bell} card={c.telegram} className="lg:col-span-3" delay={80} />
        </div>
      </div>
    </section>
  );
}

function TileText({ card, large }: { card: Card; large?: boolean }) {
  return (
    <div>
      <p className="text-[15px] font-semibold text-(--al-muted)">{card.eyebrow}</p>
      <h3 className={cn("mt-2 font-bold leading-snug text-balance", large ? "text-[28px] md:text-[40px]" : "text-[24px] md:text-[28px]")}>
        {card.title}
      </h3>
      <p className="mt-3 max-w-[460px] text-[17px] leading-relaxed text-(--al-muted)">{card.body}</p>
    </div>
  );
}

function IconTile({
  icon: Icon,
  card,
  className,
  delay,
}: {
  icon: typeof Truck;
  card: Card;
  className?: string;
  delay?: number;
}) {
  return (
    <Reveal delay={delay} className={cn("al-tile flex flex-col gap-10 p-7 md:p-9", className)}>
      <Icon className="size-8 text-(--al-text)" strokeWidth={1.6} />
      <TileText card={card} />
    </Reveal>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { MessageCircle, PackageSearch } from "lucide-react";

const RM = "(prefers-reduced-motion: reduce)";
const subscribeRM = (cb: () => void) => {
  const mq = window.matchMedia(RM);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};

/** Deep-teal utility bar: the merchant's announcement (split into messages
 *  by "|" or new lines, one at a time, paused on hover) and, on desktop,
 *  order tracking and the store's WhatsApp. Hidden when there's nothing
 *  to say. */
export default function UtilityBar({ text, trackHref, whatsapp, whatsappHref }: { text: string | null; trackHref: string; whatsapp: string | null; whatsappHref: string | null }) {
  const messages = (text ?? "")
    .split(/\s*(?:\||\n)\s*/)
    .map((m) => m.trim())
    .filter(Boolean);
  const [index, setIndex] = useState(0);
  const [hold, setHold] = useState(false);
  const reduced = useSyncExternalStore(subscribeRM, () => window.matchMedia(RM).matches, () => false);

  useEffect(() => {
    if (messages.length < 2 || hold || reduced) return;
    const t = setTimeout(() => setIndex((i) => (i + 1) % messages.length), 4500);
    return () => clearTimeout(t);
  }, [index, hold, reduced, messages.length]);

  if (messages.length === 0 && !whatsappHref) return null;
  const current = messages[index % Math.max(messages.length, 1)];

  return (
    <div className="rx-utility text-[0.8125rem]" role="region" aria-label="إعلانات المتجر" onMouseEnter={() => setHold(true)} onMouseLeave={() => setHold(false)}>
      <div className="rx-wrap flex h-9 items-center justify-between gap-4">
        <div className="min-w-0 flex-1 max-lg:text-center">
          {messages.length > 0 && <p className="sr-only">{messages.join(" — ")}</p>}
          {current && (
            <p aria-hidden key={index} className="rx-announce truncate font-semibold">
              <span>{current}</span>
            </p>
          )}
          {!current && whatsappHref && (
            <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 font-semibold lg:hidden">
              <MessageCircle className="size-4" />
              اطلب على واتساب
            </a>
          )}
        </div>
        <ul className="hidden shrink-0 items-center gap-5 text-(--rx-deep-quiet) lg:flex">
          <li>
            <Link href={trackHref} className="inline-flex min-h-8 items-center gap-1.5 hover:text-white">
              <PackageSearch className="size-4" />
              تتبّع طلبك
            </Link>
          </li>
          {whatsappHref && whatsapp && (
            <li>
              <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-8 items-center gap-1.5 hover:text-white">
                <span aria-hidden className="rx-live-dot size-2 rounded-full bg-[#3fcf7f]" />
                واتساب
                <span dir="ltr" className="font-semibold text-white">
                  {whatsapp}
                </span>
              </a>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}

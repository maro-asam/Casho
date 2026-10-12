"use client";

import { useEffect, useState } from "react";
import { Pause, Play } from "lucide-react";

import { cn } from "@/lib/utils";
import type { StoreShell } from "../../types";
import { getSocialLinks } from "../../shared/social";

/** Announcement bar. Several messages (separated by "|" or new lines in the
 *  merchant's text) rotate with a pause control; socials sit at the end on
 *  wide screens. */
export default function Announcement({ shell }: { shell: StoreShell }) {
  const messages = (shell.announcementText ?? "")
    .split(/\s*(?:\||\n)\s*/)
    .map((m) => m.trim())
    .filter(Boolean);
  const socials = getSocialLinks(shell.contact);
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const rotating = messages.length > 1;

  useEffect(() => {
    if (!rotating || paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setI((v) => (v + 1) % messages.length), 5000);
    return () => clearInterval(t);
  }, [rotating, paused, messages.length]);

  if (messages.length === 0) return null;

  return (
    <div className="bg-(--dn-accent) text-(--dn-accent-ink)">
      <div className="dn-wrap relative grid min-h-10 grid-cols-[2.75rem_minmax(0,1fr)_2.75rem] items-center lg:grid-cols-[10rem_minmax(0,1fr)_10rem]">
        <span />
        <div className="relative grid min-w-0 text-center" aria-live={paused ? "polite" : "off"}>
          {messages.map((m, idx) => (
            <p
              key={idx}
              aria-hidden={idx !== i}
              className={cn(
                "dn-label col-start-1 row-start-1 truncate py-2 transition-[opacity,transform] duration-700 ease-(--dn-ease)",
                idx === i ? "opacity-100" : "pointer-events-none translate-y-2 opacity-0",
              )}
            >
              {m}
            </p>
          ))}
        </div>
        <div className="flex items-center justify-end gap-1">
          {socials.length > 0 && (
            <ul className="hidden items-center gap-1 lg:flex">
              {socials.map(({ label, href, Icon }) => (
                <li key={label}>
                  <a href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className="grid size-8 place-items-center opacity-80 transition-opacity hover:opacity-100 [&_svg]:size-4">
                    <Icon aria-hidden />
                  </a>
                </li>
              ))}
            </ul>
          )}
          {rotating && (
            <button
              type="button"
              onClick={() => setPaused((p) => !p)}
              aria-label={paused ? "تشغيل الإعلانات" : "إيقاف الإعلانات"}
              aria-pressed={paused}
              className="grid size-8 place-items-center opacity-70 transition-opacity hover:opacity-100 [&_svg]:size-3.5"
            >
              {paused ? <Play /> : <Pause />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

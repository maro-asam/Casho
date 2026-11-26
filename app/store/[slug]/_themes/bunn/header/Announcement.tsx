"use client";

import { useEffect, useState } from "react";

import { motionOff } from "../../shared/motion";
import { BeanIcon } from "../icons";

/** The merchant's announcement on the espresso strip above the header, one
 *  message at a time ("|" or new lines separate them). */
export default function Announcement({ text }: { text: string | null }) {
  const messages = (text ?? "")
    .split(/\s*[|\n]\s*/)
    .map((m) => m.trim())
    .filter(Boolean);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (messages.length < 2 || motionOff()) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % messages.length), 5000);
    return () => clearInterval(t);
  }, [messages.length]);

  if (messages.length === 0) return null;
  return (
    <div className="bn-announce" data-tone="espresso">
      <p className="bn-wrap flex items-center justify-center gap-2.5">
        <BeanIcon aria-hidden className="bn-announce-bean" />
        <span key={index} className="bn-fade truncate">
          {messages[index % messages.length]}
        </span>
        {messages.length > 1 && (
          <button type="button" onClick={() => setIndex((i) => (i + 1) % messages.length)} className="bn-announce-dots" aria-label={`${index + 1} / ${messages.length}`}>
            {messages.map((m, i) => (
              <i key={m + i} data-on={i === index % messages.length || undefined} />
            ))}
          </button>
        )}
      </p>
    </div>
  );
}

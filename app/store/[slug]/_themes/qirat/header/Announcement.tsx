"use client";

import { useEffect, useState } from "react";

/** The merchant's announcement on the velvet ribbon above the header, one
 *  message at a time ("|" or new lines separate them). */
export default function Announcement({ text }: { text: string | null }) {
  const messages = (text ?? "")
    .split(/\s*[|\n]\s*/)
    .map((m) => m.trim())
    .filter(Boolean);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (messages.length < 2) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % messages.length), 5000);
    return () => clearInterval(t);
  }, [messages.length]);

  if (messages.length === 0) return null;
  return (
    <div className="qr-announce" data-tone="velvet">
      <p className="qr-wrap flex items-center justify-center gap-3">
        <span aria-hidden className="qr-announce-gem" />
        <span key={index} className="qr-fade truncate">
          {messages[index % messages.length]}
        </span>
        <span aria-hidden className="qr-announce-gem" />
      </p>
    </div>
  );
}

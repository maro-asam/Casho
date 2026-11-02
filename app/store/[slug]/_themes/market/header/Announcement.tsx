"use client";

import { useEffect, useState } from "react";

/** The merchant's announcement above the bar, one message at a time ("|" or
 *  new lines separate them). */
export default function Announcement({ text }: { text: string | null }) {
  const messages = (text ?? "")
    .split(/\s*[|\n]\s*/)
    .map((m) => m.trim())
    .filter(Boolean);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (messages.length < 2) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % messages.length), 4500);
    return () => clearInterval(t);
  }, [messages.length]);

  if (messages.length === 0) return null;
  return (
    <p className="mk-announce">
      <span key={index} className="mk-fade block truncate">
        {messages[index % messages.length]}
      </span>
    </p>
  );
}

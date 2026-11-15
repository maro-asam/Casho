"use client";

import { useId, useState, type FormEvent } from "react";
import { Mail, MessageCircle } from "lucide-react";

import { btn } from "../ui";
import { st } from "@/lib/i18n/storefront";

/** No backend inbox exists, so the message is handed to WhatsApp (or the
 *  shopper's mail app) already written — nothing is silently dropped. */
export default function ContactForm({ storeName, whatsappHref, email }: { storeName: string; whatsappHref: string | null; email: string | null }) {
  const id = useId();
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const body = `${name ? st("أنا {0}.\n", name) : ""}${message}`;
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (whatsappHref) window.open(`${whatsappHref}?text=${encodeURIComponent(body)}`, "_blank", "noopener");
    else if (email) window.location.href = `mailto:${email}?subject=${encodeURIComponent(st("رسالة لـ {0}", storeName))}&body=${encodeURIComponent(body)}`;
  };
  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label htmlFor={`${id}-name`} className="mb-1.5 block text-sm font-bold text-(--qr-ink)">
          {st("اسمك")}
        </label>
        <input id={`${id}-name`} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" className="qr-field" />
      </div>
      <div>
        <label htmlFor={`${id}-msg`} className="mb-1.5 block text-sm font-bold text-(--qr-ink)">
          {st("رسالتك")}
        </label>
        <textarea id={`${id}-msg`} value={message} onChange={(e) => setMessage(e.target.value)} required rows={5} placeholder={st("اكتب سؤالك أو استفسارك…")} className="qr-field resize-y" />
      </div>
      <button type="submit" className={btn({ variant: whatsappHref ? "wa" : "solid", size: "lg", full: true })}>
        {whatsappHref ? <MessageCircle /> : <Mail />}
        {whatsappHref ? st("ابعت على واتساب") : st("ابعت بالإيميل")}
      </button>
    </form>
  );
}

"use client";

import { useState, type FormEvent } from "react";
import { Mail, MessageCircle } from "lucide-react";

import { btn } from "../ui";
import { st } from "@/lib/i18n/storefront";

/** No backend inbox exists, so the message is handed to WhatsApp (or the
 *  shopper's mail app) already written — nothing is silently dropped. */
export default function ContactForm({ storeName, whatsappHref, email }: { storeName: string; whatsappHref: string | null; email: string | null }) {
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
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">{st("اسمك")}</span>
        <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" className="md-field" />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">{st("رسالتك")}</span>
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} required rows={5} placeholder={st("اكتب سؤالك أو استفسارك…")} className="md-field resize-y" />
      </label>
      <button type="submit" className={btn({ size: "lg", full: true })}>
        {whatsappHref ? <MessageCircle /> : <Mail />}
        {whatsappHref ? st("ابعت على واتساب") : st("ابعت بالإيميل")}
      </button>
    </form>
  );
}

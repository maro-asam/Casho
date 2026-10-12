"use client";

import { useId, useState, type FormEvent } from "react";
import { Mail, MessageCircle } from "lucide-react";

import { btn } from "../ui";

/** No backend inbox exists, so the message is handed to WhatsApp (or the
 *  shopper's mail app) already written — nothing is silently dropped. */
export default function ContactForm({ storeName, whatsappHref, email }: { storeName: string; whatsappHref: string | null; email: string | null }) {
  const id = useId();
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const body = `${name ? `أنا ${name}.\n` : ""}${message}`;
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (whatsappHref) window.open(`${whatsappHref}?text=${encodeURIComponent(body)}`, "_blank", "noopener");
    else if (email) window.location.href = `mailto:${email}?subject=${encodeURIComponent(`رسالة لـ ${storeName}`)}&body=${encodeURIComponent(body)}`;
  };
  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <label htmlFor={`${id}-name`} className="dn-label mb-2 block">
          اسمك
        </label>
        <input id={`${id}-name`} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" className="dn-field" />
      </div>
      <div>
        <label htmlFor={`${id}-msg`} className="dn-label mb-2 block">
          رسالتك
        </label>
        <textarea id={`${id}-msg`} value={message} onChange={(e) => setMessage(e.target.value)} required rows={5} placeholder="اكتب سؤالك أو استفسارك…" className="dn-field resize-y" />
      </div>
      <button type="submit" className={btn({ size: "lg", full: true })}>
        {whatsappHref ? <MessageCircle /> : <Mail />}
        {whatsappHref ? "ابعت على واتساب" : "ابعت بالإيميل"}
      </button>
    </form>
  );
}

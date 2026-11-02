"use client";

import { useState } from "react";
import { Check, MessageCircle, Plus, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { useLocalList } from "../../shared/local-list";
import { listKey } from "../lib/events";
import { listMessage, waWith } from "../lib/market";
import { Wrap, btn } from "../ui";

/** Notes-style shopping list: the shopper writes what they want the way they
 *  would on paper and sends it to the store's WhatsApp. It stays in this
 *  browser, so next week's list starts from last week's. Made for shops whose
 *  shelves aren't all online yet. */
export default function ShoppingList({ storeSlug, whatsappHref }: { storeSlug: string; whatsappHref: string }) {
  const { list, pushFront, remove } = useLocalList(listKey(storeSlug), 30);
  const [text, setText] = useState("");
  const [done, setDone] = useState<string[]>([]);
  const items = [...list].reverse();
  const open = items.filter((i) => !done.includes(i));

  const add = () => {
    const value = text.trim();
    if (!value) return;
    pushFront(value);
    setText("");
  };

  return (
    <Wrap className="mk-section">
      <div className="mk-notes mk-reveal">
        <div className="min-w-0 lg:max-w-sm">
          <h2 className="mk-h2 text-balance">قايمة المشتريات</h2>
          <p className="mt-2 text-[0.9375rem] leading-6 text-(--mk-label-2)">اكتب اللي محتاجه زي ما بتكتبه في الورقة، وابعته للمتجر على واتساب.</p>
        </div>

        <div className="mk-notes-paper min-w-0 flex-1">
          {items.length > 0 && (
            <ul>
              {items.map((item) => {
                const on = done.includes(item);
                return (
                  <li key={item} className="mk-note-row">
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={on}
                      aria-label={item}
                      onClick={() => setDone((d) => (on ? d.filter((x) => x !== item) : [...d, item]))}
                      className={cn("mk-note-check", on && "mk-note-check--on")}
                    >
                      {on && <Check />}
                    </button>
                    <span className={cn("min-w-0 flex-1 truncate", on && "text-(--mk-label-3) line-through")}>{item}</span>
                    <button type="button" onClick={() => remove(item)} aria-label={`شيل ${item}`} className="mk-icon !size-8 text-(--mk-label-3) [&_svg]:!size-4">
                      <X />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              add();
            }}
            className="mk-note-row"
          >
            <button type="submit" aria-label="أضف للقايمة" className="mk-note-check mk-note-check--add">
              <Plus />
            </button>
            <label htmlFor="mk-list-input" className="sr-only">
              أضف للقايمة
            </label>
            <input id="mk-list-input" value={text} onChange={(e) => setText(e.target.value)} placeholder="٢ كيلو سكر، لبن، عيش…" autoComplete="off" enterKeyHint="done" className="min-w-0 flex-1 bg-transparent text-(--mk-ink) outline-none placeholder:text-(--mk-label-3)" />
          </form>

          <a
            href={open.length ? waWith(whatsappHref, listMessage(open)) : undefined}
            target="_blank"
            rel="noopener noreferrer"
            aria-disabled={open.length === 0}
            className={btn({ size: "lg", full: true, className: cn("mt-4", open.length === 0 && "pointer-events-none opacity-40") })}
          >
            <MessageCircle />
            ابعت القايمة على واتساب
          </a>
        </div>
      </div>
    </Wrap>
  );
}

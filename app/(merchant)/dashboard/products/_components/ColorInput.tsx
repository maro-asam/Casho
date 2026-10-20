"use client";

import { useRef, useState } from "react";
import { AlertTriangle, Check, X } from "lucide-react";

import { PRODUCT_COLOR_PALETTE, isLightSwatch, normalizeColorKey, swatchColor } from "@/lib/colors/product-colors";
import { cn } from "@/lib/utils";
import { tr } from "@/lib/i18n/dashboard";

/** A color dot exactly as the storefront will render it; dashed "?" when unknown. */
function Swatch({ label, className }: { label: string; className?: string }) {
  const bg = swatchColor(label);
  if (!bg) {
    return (
      <span
        aria-hidden
        className={cn("grid shrink-0 place-items-center rounded-full border border-dashed border-(--sys-orange) text-[9px] font-bold text-(--sys-orange)", className)}
      >
        ?
      </span>
    );
  }
  return (
    <span
      aria-hidden
      className={cn("shrink-0 rounded-full", isLightSwatch(bg) ? "ring-1 ring-black/20" : "ring-1 ring-black/5", className)}
      style={{ background: bg }}
    />
  );
}

/**
 * Product colors with real swatches: pick from the palette or type any name
 * ("كحلي غامق", "أسود × أبيض"). Submits the same comma-separated `name` field
 * as TagInput, so the product actions don't change.
 */
export default function ColorInput({ name, defaultValues = [] }: { name: string; defaultValues?: string[] }) {
  const [colors, setColors] = useState<string[]>(defaultValues);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const has = (label: string) => colors.some((c) => normalizeColorKey(c) === normalizeColorKey(label));
  const add = (label: string) => {
    // Commas are the field separator, so they can't live inside a name.
    const clean = label.replace(/[,،]/g, " ").trim();
    if (!clean || has(clean)) return;
    setColors((prev) => [...prev, clean]);
  };
  const remove = (label: string) => setColors((prev) => prev.filter((c) => c !== label));
  const toggle = (label: string) => {
    const existing = colors.find((c) => normalizeColorKey(c) === normalizeColorKey(label));
    if (existing) remove(existing);
    else add(label);
  };
  const commitDraft = () => {
    add(draft);
    setDraft("");
  };

  const unknown = colors.filter((c) => !swatchColor(c));

  return (
    <div className="space-y-2.5">
      <div
        className="apple-field flex min-h-11 cursor-text flex-wrap items-center gap-1.5 px-2 py-1.5"
        onClick={() => inputRef.current?.focus()}
      >
        {colors.map((c) => (
          <span
            key={c}
            title={swatchColor(c) ? undefined : tr("مش متعرف كلون — هيظهر للعميل كنص")}
            className={cn(
              "flex h-7 items-center gap-1.5 rounded-full pe-1 ps-1 text-[13px]",
              swatchColor(c) ? "bg-card shadow-[0_1px_2px_rgba(0,0,0,0.06)]" : "bg-(--sys-orange)/14",
            )}
          >
            <Swatch label={c} className="size-4" />
            {c}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                remove(c);
              }}
              aria-label={tr("شيل {0}", c)}
              className="grid size-5 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="size-3" strokeWidth={2.4} />
            </button>
          </span>
        ))}
        <span className="flex min-w-28 flex-1 items-center gap-1.5">
          {draft.trim() && <Swatch label={draft} className="size-4" />}
          <input
            ref={inputRef}
            type="text"
            className="w-full bg-transparent px-1.5 text-[15px] outline-none placeholder:text-muted-foreground"
            placeholder={colors.length === 0 ? tr("اختار من تحت أو اكتب لون…") : tr("لون تاني…")}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === "," || e.key === "،") {
                e.preventDefault();
                commitDraft();
              } else if (e.key === "Backspace" && !draft && colors.length > 0) {
                remove(colors[colors.length - 1]);
              }
            }}
            onBlur={() => draft.trim() && commitDraft()}
          />
        </span>
        <input type="hidden" name={name} value={colors.join(", ")} />
      </div>

      <div role="group" aria-label={tr("ألوان جاهزة")} className="flex flex-wrap gap-1.5">
        {PRODUCT_COLOR_PALETTE.map(({ name: label, hex }) => {
          const on = has(label);
          return (
            <button
              key={label}
              type="button"
              aria-pressed={on}
              aria-label={tr(label)}
              title={tr(label)}
              onClick={() => toggle(label)}
              className={cn(
                "grid size-9 place-items-center rounded-full border-2 transition-[transform,border-color] duration-200 ease-(--ease-apple) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                on ? "border-primary" : "border-transparent hover:scale-110",
              )}
            >
              <span
                className={cn("grid size-7 place-items-center rounded-full", isLightSwatch(hex) ? "ring-1 ring-black/20" : "ring-1 ring-black/5")}
                style={{ background: hex }}
              >
                {on && <Check className={cn("size-3.5", isLightSwatch(hex) ? "text-neutral-900" : "text-white")} strokeWidth={3} />}
              </span>
            </button>
          );
        })}
      </div>

      {unknown.length > 0 ? (
        <p className="flex items-start gap-1.5 px-1 text-[12px] leading-[17px] text-foreground/80">
          <AlertTriangle className="mt-px size-3.5 shrink-0 text-(--sys-orange)" />
          <span>
            {unknown.map((c) => `"${c}"`).join(tr("، "))}{" "}{tr("مش متعرف كلون، فهيظهر للعميل كنص. جرّب اسم قريب من الألوان اللي فوق، أو زوّد \"فاتح\" / \"غامق\".")}
          </span>
        </p>
      ) : (
        <p className="px-1 text-[12px] leading-[17px] text-muted-foreground">
          {tr("دوس على لون عشان تضيفه، أو اكتب أي اسم — زي \"كحلي غامق\" أو \"أسود × أبيض\" — والعميل هيشوفه كلون.")}
        </p>
      )}
    </div>
  );
}

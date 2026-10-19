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
        className={cn("grid shrink-0 place-items-center rounded-full border border-dashed border-amber-500 text-[9px] font-bold text-amber-600", className)}
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
        className="flex min-h-10 cursor-text flex-wrap items-center gap-1.5 rounded-xl border bg-background px-3 py-2 focus-within:ring-2 focus-within:ring-ring"
        onClick={() => inputRef.current?.focus()}
      >
        {colors.map((c) => (
          <span
            key={c}
            title={swatchColor(c) ? undefined : tr("مش متعرف كلون — هيظهر للعميل كنص")}
            className={cn(
              "flex items-center gap-1.5 rounded-lg py-0.5 pe-1.5 ps-1 text-sm",
              swatchColor(c) ? "bg-muted" : "bg-amber-500/10 text-amber-800 dark:text-amber-300",
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
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="size-3" />
            </button>
          </span>
        ))}
        <span className="flex min-w-28 flex-1 items-center gap-1.5">
          {draft.trim() && <Swatch label={draft} className="size-4" />}
          <input
            ref={inputRef}
            type="text"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
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
                "grid size-8 place-items-center rounded-full border-2 transition-all",
                on ? "border-foreground" : "border-transparent hover:scale-110",
              )}
            >
              <span
                className={cn("grid size-6 place-items-center rounded-full", isLightSwatch(hex) ? "ring-1 ring-black/20" : "ring-1 ring-black/5")}
                style={{ background: hex }}
              >
                {on && <Check className={cn("size-3.5", isLightSwatch(hex) ? "text-neutral-900" : "text-white")} strokeWidth={3} />}
              </span>
            </button>
          );
        })}
      </div>

      {unknown.length > 0 ? (
        <p className="flex items-start gap-1.5 text-xs text-amber-700 dark:text-amber-400">
          <AlertTriangle className="mt-px size-3.5 shrink-0" />
          <span>
            {unknown.map((c) => `"${c}"`).join(tr("، "))}{" "}{tr("مش متعرف كلون، فهيظهر للعميل كنص. جرّب اسم قريب من الألوان اللي فوق، أو زوّد \"فاتح\" / \"غامق\".")}
          </span>
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">
          {tr("دوس على لون عشان تضيفه، أو اكتب أي اسم — زي \"كحلي غامق\" أو \"أسود × أبيض\" — والعميل هيشوفه كلون.")}
        </p>
      )}
    </div>
  );
}

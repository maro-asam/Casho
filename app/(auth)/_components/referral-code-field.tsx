"use client";

import { useState } from "react";
import { BadgeCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { FIELD_CLASS, FormField } from "./forms/form-field";

const clean = (raw: string) => raw.replace(/[^a-z0-9]/gi, "").toUpperCase().slice(0, 32);

/**
 * The optional referral code at signup. A code that came with the link (or
 * was remembered from an earlier visit) shows as a confirmed line the merchant
 * can change; otherwise it's one quiet link that opens the field — so a
 * merchant a rep met in person can type the rep's code instead of losing them.
 *
 * Controlled; with `name` it also submits the value (always, even empty, so
 * clearing it means "no code").
 */
export function ReferralCodeField({
  value,
  onChange,
  knownCode,
  error,
  name,
}: {
  value: string;
  onChange: (value: string) => void;
  /** The code the page already verified (link or remembered visit). */
  knownCode?: string;
  error?: string;
  name?: string;
}) {
  const [editing, setEditing] = useState(false);
  const open = editing || !!error || (!!value && value !== knownCode);
  const hidden = name ? <input type="hidden" name={name} value={value} /> : null;

  if (!open && knownCode && value === knownCode) {
    return (
      <div className="flex items-center gap-3 rounded-[14px] bg-card px-4 py-3">
        {hidden}
        <BadgeCheck className="size-5 shrink-0 text-[#248a3d] dark:text-(--sys-green)" />
        <p className="min-w-0 flex-1 text-[15px] leading-5">
          هتسجّل بكود الإحالة{" "}
          <span dir="ltr" className="font-mono font-semibold tracking-wider">
            {knownCode}
          </span>
        </p>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="shrink-0 rounded-full px-2 py-1 text-[15px] font-normal text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          تغيير
        </button>
      </div>
    );
  }

  if (!open) {
    return (
      <div className="text-center">
        {hidden}
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="rounded-full px-2 py-1 text-[15px] font-normal text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          معاك كود إحالة؟
        </button>
      </div>
    );
  }

  return (
    <FormField
      htmlFor="refCode"
      label="كود الإحالة (اختياري)"
      error={error}
      hint="لو حد من فريق كاشو أو تاجر صاحبك بعتلك كود، اكتبه هنا."
    >
      {hidden}
      <Input
        id="refCode"
        value={value}
        onChange={(e) => onChange(clean(e.target.value))}
        placeholder="مثلًا: AB12CD34"
        dir="ltr"
        autoFocus={editing}
        autoComplete="off"
        autoCapitalize="characters"
        spellCheck={false}
        aria-invalid={!!error}
        className={cn(FIELD_CLASS, "font-mono tracking-wider")}
      />
    </FormField>
  );
}

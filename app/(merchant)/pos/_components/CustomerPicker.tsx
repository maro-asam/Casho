"use client";

import { useState } from "react";
import { UserRound, UserPlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { tdir, tr } from "@/lib/i18n/dashboard";

type Customer = { id?: string; name: string; phone: string } | null;

/** Optional customer on the invoice (saved on the order: name + phone). */
export default function CustomerPicker({ customer, onChange }: { customer: Customer; onChange: (c: Customer) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  if (customer) {
    return (
      <div className="flex items-center gap-2.5 rounded-lg bg-muted/60 px-3 py-2">
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-background text-muted-foreground">
          <UserRound className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{customer.name}</p>
          <p className="text-xs text-muted-foreground tabular-nums" dir="ltr">
            {customer.phone}
          </p>
        </div>
        <Button variant="ghost" size="icon" className="size-8 text-muted-foreground" onClick={() => onChange(null)} aria-label={tr("شيل العميل")}>
          <X className="size-4" />
        </Button>
      </div>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
        >
          <UserPlus className="size-4" />
          {tr("إضافة عميل")}
          <span className="ms-auto text-xs">{tr("(اختياري)")}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72" dir={tdir()}>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim() || phone.replace(/\D/g, "").length < 8) return;
            onChange({ name: name.trim(), phone: phone.trim() });
            setName("");
            setPhone("");
            setOpen(false);
          }}
        >
          <p className="text-sm font-semibold">{tr("بيانات العميل")}</p>
          <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder={tr("الاسم")} className="h-9" required />
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="01xxxxxxxxx"
            dir="ltr"
            inputMode="tel"
            className="h-9"
            required
            minLength={8}
          />
          <p className="text-xs text-muted-foreground">{tr("الاسم والرقم بيتسجلوا على الفاتورة والطلب.")}</p>
          <Button type="submit" size="sm" className="w-full">
            {tr("إضافة للفاتورة")}
          </Button>
        </form>
      </PopoverContent>
    </Popover>
  );
}

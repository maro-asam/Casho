"use client";

import { useState } from "react";
import { ChevronLeft, UserRound, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { tdir, tr } from "@/lib/i18n/dashboard";

type Customer = { id?: string; name: string; phone: string } | null;

const FIELD = "h-11 w-full rounded-[10px] bg-(--fill-3) px-3 text-[15px] outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring";

/** Optional customer on the invoice (saved on the order: name + phone). */
export default function CustomerPicker({ customer, onChange }: { customer: Customer; onChange: (c: Customer) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  if (customer) {
    return (
      <div className="flex items-center gap-3 rounded-[14px] bg-(--fill-3)/60 px-3 py-2">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary text-[15px] font-semibold text-primary-foreground">
          {customer.name.trim().slice(0, 1).toUpperCase() || <UserRound className="size-4" />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-medium">{customer.name}</p>
          <p className="text-[12px] text-muted-foreground tabular-nums rtl:text-right" dir="ltr">
            {customer.phone}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onChange(null)}
          aria-label={tr("شيل العميل")}
          className="grid size-5 place-items-center rounded-full bg-(--sys-gray)/50 text-white hover:bg-(--sys-gray)"
        >
          <X className="size-3" strokeWidth={3} />
        </button>
      </div>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" className="flex w-full items-center gap-3 rounded-[14px] bg-(--fill-3)/60 px-3 py-2 text-start hover:bg-(--fill-3)">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-(--sys-gray)/25 text-muted-foreground">
            <UserRound className="size-[18px]" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[15px] text-primary">{tr("إضافة عميل")}</span>
            <span className="block text-[12px] text-muted-foreground">{tr("(اختياري)")}</span>
          </span>
          <ChevronLeft className="size-4 text-(--label-3) ltr:-scale-x-100" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="apple-ui w-80 rounded-[18px] bg-card p-4 text-foreground" dir={tdir()}>
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
          <p className="text-[17px] font-semibold">{tr("بيانات العميل")}</p>
          <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder={tr("الاسم")} aria-label={tr("الاسم")} className={FIELD} required />
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="01xxxxxxxxx"
            aria-label={tr("رقم الموبايل")}
            dir="ltr"
            inputMode="tel"
            className={cn(FIELD, "tabular-nums rtl:text-right")}
            required
            minLength={8}
          />
          <p className="text-[12px] text-muted-foreground">{tr("الاسم والرقم بيتسجلوا على الفاتورة والطلب.")}</p>
          <button
            type="submit"
            className="apple-press h-11 w-full rounded-full bg-primary text-[15px] font-semibold text-primary-foreground hover:bg-primary/90"
          >
            {tr("إضافة للفاتورة")}
          </button>
        </form>
      </PopoverContent>
    </Popover>
  );
}

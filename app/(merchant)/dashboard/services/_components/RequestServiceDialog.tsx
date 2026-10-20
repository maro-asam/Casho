"use client";

import * as React from "react";
import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Check, Clock3, Loader2, Send } from "lucide-react";
import { toast } from "sonner";

import { CreateServiceRequestAction } from "@/actions/services/services.actions";
import { appleButton } from "@/components/saas-page";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { tdir, tr, trv } from "@/lib/i18n/dashboard";

export type DialogService = {
  id: string;
  title: string;
  description?: string;
  price?: string;
  duration?: string;
  features?: string[];
};

type RequestServiceDialogProps = {
  service: DialogService;
  /** Pre-rendered app-icon tile (server element). */
  glyph?: React.ReactNode;
  storeId?: string;
  defaults?: { fullName?: string; phone?: string; storeLink?: string };
  /** "get" = App Store style capsule; "custom" = gray page-level button. */
  trigger?: "get" | "custom";
};

type State = {
  success: boolean;
  message: string;
  errors?: {
    fullName?: string[];
    phone?: string[];
    whatsapp?: string[];
    storeLink?: string[];
    notes?: string[];
  };
};

const initialState: State = { success: false, message: "" };

export default function RequestServiceDialog({ service, glyph, storeId, defaults, trigger = "get" }: RequestServiceDialogProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger === "get" ? (
          <button
            type="button"
            aria-label={tr("طلب خدمة: {0}", service.title)}
            className="apple-press inline-flex h-8 min-w-[4.5rem] items-center justify-center rounded-full bg-(--fill-3) px-4 text-[15px] font-bold text-primary hover:bg-(--fill-3)/70"
          >
            {tr("اطلب")}
          </button>
        ) : (
          <button type="button" className={appleButton.filled}>
            {tr("اطلب خدمة مخصصة")}
          </button>
        )}
      </DialogTrigger>

      <DialogContent dir={tdir()} className="max-h-[92vh] gap-0 overflow-y-auto p-0 sm:max-w-[30rem]">
        {/* Remount per open so a sent request starts fresh next time. */}
        {open && <RequestBody service={service} glyph={glyph} storeId={storeId} defaults={defaults} onClose={() => setOpen(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function RequestBody({
  service,
  glyph,
  storeId,
  defaults,
  onClose,
}: Omit<RequestServiceDialogProps, "trigger"> & { onClose: () => void }) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(CreateServiceRequestAction, initialState);

  useEffect(() => {
    if (state.success) router.refresh();
    else if (state.message && !state.errors) toast.error(trv(state.message));
  }, [state, router]);

  if (state.success) {
    return (
      <div className="flex flex-col items-center gap-3 px-6 pt-10 pb-6 text-center">
        <span className="grid size-16 place-items-center rounded-full bg-(--sys-green) text-white">
          <Check className="size-8" strokeWidth={3} />
        </span>
        <DialogTitle className="text-[22px] font-bold">{tr("طلبك وصل")}</DialogTitle>
        <DialogDescription className="max-w-xs text-[15px] leading-6">
          {tr("هنتواصل معاك بخصوص «{0}» في أسرع وقت. تقدر تتابع حالة الطلب من «طلباتك».", service.title)}
        </DialogDescription>
        <button type="button" onClick={onClose} className={cn(appleButton.filled, "mt-4 h-[50px] w-full text-[17px]")}>
          {tr("تمام")}
        </button>
      </div>
    );
  }

  const err = (k: keyof NonNullable<State["errors"]>) =>
    state.errors?.[k]?.[0] && <p className="text-[13px] text-(--sys-red)">{trv(state.errors[k]![0])}</p>;

  return (
    <>
      <DialogHeader className="items-center gap-1.5 px-6 pt-8 pb-5 text-center sm:text-center">
        {glyph && <div className="mb-2">{glyph}</div>}
        <DialogTitle className="text-[22px] font-bold">{service.title}</DialogTitle>
        <DialogDescription className="text-[15px] leading-6">
          {service.description ?? tr("اكتب بياناتك وسنتواصل معك بخصوص الخدمة في أسرع وقت.")}
        </DialogDescription>
        {(service.price || service.duration) && (
          <p className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 pt-1 text-[13px] text-muted-foreground">
            {service.price && <span className="font-semibold text-foreground">{service.price}</span>}
            {service.duration && (
              <span className="inline-flex items-center gap-1">
                <Clock3 className="size-3.5" />
                {service.duration}
              </span>
            )}
          </p>
        )}
      </DialogHeader>

      <form action={formAction} className="space-y-5 px-5 pb-5">
        <input type="hidden" name="serviceId" value={service.id} />
        <input type="hidden" name="serviceTitle" value={service.title} />
        <input type="hidden" name="storeId" value={storeId ?? ""} />

        {!!service.features?.length && (
          <section className="space-y-2">
            <p className="px-1 text-[13px] font-semibold text-muted-foreground">{tr("الخدمة تشمل")}</p>
            <ul className="space-y-2 rounded-[14px] bg-(--fill-3) p-4">
              {service.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2.5 text-[15px]">
                  <Check className="size-4 shrink-0 text-primary" strokeWidth={2.8} />
                  {feature}
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="space-y-3">
          <p className="px-1 text-[13px] font-semibold text-muted-foreground">{tr("بياناتك للتواصل")}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor={`fullName-${service.id}`} className="sr-only">
                {tr("الاسم")}
              </Label>
              <Input id={`fullName-${service.id}`} name="fullName" defaultValue={defaults?.fullName} placeholder={tr("الاسم")} aria-invalid={!!state.errors?.fullName} />
              {err("fullName")}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`phone-${service.id}`} className="sr-only">
                {tr("رقم الموبايل")}
              </Label>
              <Input
                id={`phone-${service.id}`}
                name="phone"
                dir="ltr"
                inputMode="tel"
                defaultValue={defaults?.phone}
                placeholder={tr("رقم الموبايل")}
                aria-invalid={!!state.errors?.phone}
              />
              {err("phone")}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`whatsapp-${service.id}`} className="sr-only">
                {tr("رقم واتساب")}
              </Label>
              <Input id={`whatsapp-${service.id}`} name="whatsapp" dir="ltr" inputMode="tel" placeholder={tr("رقم واتساب (اختياري)")} />
              {err("whatsapp")}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`storeLink-${service.id}`} className="sr-only">
                {tr("لينك المتجر")}
              </Label>
              <Input id={`storeLink-${service.id}`} name="storeLink" dir="ltr" defaultValue={defaults?.storeLink} placeholder={tr("لينك المتجر")} />
              {err("storeLink")}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`notes-${service.id}`} className="sr-only">
              {tr("ملاحظات")}
            </Label>
            <Textarea id={`notes-${service.id}`} name="notes" placeholder={tr("اكتب تفاصيل إضافية عن طلبك...")} className="min-h-24 resize-none" />
            {err("notes")}
          </div>
        </section>

        <button type="submit" disabled={isPending} className={cn(appleButton.filled, "h-[50px] w-full text-[17px]")}>
          {isPending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4 rtl:-scale-x-100" />}
          {isPending ? tr("جاري الإرسال...") : tr("إرسال الطلب")}
        </button>
      </form>
    </>
  );
}

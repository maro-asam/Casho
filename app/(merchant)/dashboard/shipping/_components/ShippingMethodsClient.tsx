"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { ChevronLeft, Clock, Ellipsis, Loader2, MapPin, Pencil, Plus, Search, Trash2, Truck } from "lucide-react";

import {
  CreateShippingMethodAction,
  UpdateShippingMethodAction,
  DeleteShippingMethodAction,
  ToggleShippingMethodAction,
  SaveGovernorateRatesAction,
} from "@/actions/store/shipping.actions";
import { appleButton, appleMenu, StatusText } from "@/components/saas-page";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { EGYPT_GOVERNORATES } from "@/constants/egypt-governorates";
import { cn } from "@/lib/utils";
import { currentLocale, intlLocale, isRtl, tdir, tr, trv } from "@/lib/i18n/dashboard";

type ShippingMethod = {
  id: string;
  name: string;
  price: number;
  description: string | null;
  estimatedDays: number | null;
  isActive: boolean;
  governorateRates: { governorate: string; price: number }[];
};

function formatPrice(piasters: number) {
  return new Intl.NumberFormat(intlLocale(), { style: "currency", currency: "EGP", maximumFractionDigits: 0 }).format(piasters / 100);
}

const INLINE_INPUT =
  "h-11 min-w-0 flex-1 bg-transparent text-end text-[15px] text-muted-foreground outline-none placeholder:text-(--label-3) focus:text-foreground";

/** iOS form row: label leading, borderless field trailing. */
function InlineField({ label, htmlFor, suffix, children }: { label: string; htmlFor: string; suffix?: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-11 items-center gap-3 px-4">
      <label htmlFor={htmlFor} className="shrink-0 text-[15px]">
        {label}
      </label>
      <div className="flex min-w-0 flex-1 items-center gap-1.5">
        {children}
        {suffix && <span className="shrink-0 text-[15px] text-muted-foreground">{suffix}</span>}
      </div>
    </div>
  );
}

/** Add / edit a method — Apple sheet with one grouped form. */
function MethodDialog({
  method,
  open,
  onOpenChange,
  onSave,
  isPending,
}: {
  method: ShippingMethod | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSave: (fd: FormData) => void;
  isPending: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir={tdir()} className="gap-0 p-0 sm:max-w-md">
        <DialogHeader className="items-center gap-1.5 px-6 pt-8 pb-5 text-center sm:text-center">
          <span className="mb-2 grid size-14 place-items-center rounded-[16px] bg-(--sys-orange) text-white">
            <Truck className="size-7" />
          </span>
          <DialogTitle className="text-[22px] font-bold">{method ? tr("تعديل طريقة الشحن") : tr("إضافة طريقة شحن")}</DialogTitle>
          <DialogDescription className="text-[15px]">{tr("العميل بيختار منها في صفحة الدفع.")}</DialogDescription>
        </DialogHeader>

        <form action={onSave} className="space-y-5 px-5 pb-5">
          {method && <input type="hidden" name="isActive" value={method.isActive ? "on" : "off"} />}
          <div className="apple-rows overflow-hidden rounded-[14px] bg-(--fill-3) [--row-inset:16px]">
            <InlineField label={tr("الاسم")} htmlFor="m-name">
              <input id="m-name" name="name" required defaultValue={method?.name} placeholder={tr("مثال: شحن عادي")} className={INLINE_INPUT} />
            </InlineField>
            <InlineField label={tr("السعر")} htmlFor="m-price" suffix={tr("ج.م")}>
              <input
                id="m-price"
                name="price"
                type="number"
                min="0"
                step="0.5"
                inputMode="decimal"
                required
                defaultValue={method ? String(method.price / 100) : ""}
                placeholder="0"
                className={cn(INLINE_INPUT, "tabular-nums")}
              />
            </InlineField>
            <InlineField label={tr("مدة التوصيل")} htmlFor="m-days" suffix={tr("أيام")}>
              <input
                id="m-days"
                name="estimatedDays"
                type="number"
                min="1"
                inputMode="numeric"
                defaultValue={method?.estimatedDays ?? ""}
                placeholder={tr("مثال: 3")}
                className={cn(INLINE_INPUT, "tabular-nums")}
              />
            </InlineField>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="m-desc" className="block px-1 text-[13px] text-muted-foreground">
              {tr("وصف مختصر")}
            </label>
            <input
              id="m-desc"
              name="description"
              defaultValue={method?.description ?? ""}
              placeholder={tr("مثال: يصلك خلال 3-5 أيام عمل")}
              className="h-11 w-full rounded-[12px] bg-(--fill-3) px-4 text-[15px] outline-none placeholder:text-(--label-3) focus:ring-[3.5px] focus:ring-primary/30"
            />
          </div>
          <button type="submit" disabled={isPending} className={cn(appleButton.filled, "h-[50px] w-full text-[17px]")}>
            {isPending && <Loader2 className="size-4 animate-spin" />}
            {method ? tr("حفظ") : tr("إضافة")}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Per-governorate prices in a side sheet: searchable list, empty = base price. */
function RatesSheet({
  method,
  onOpenChange,
  onSave,
  isPending,
}: {
  method: ShippingMethod | null;
  onOpenChange: (o: boolean) => void;
  onSave: (fd: FormData) => void;
  isPending: boolean;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [query, setQuery] = useState("");
  const en = currentLocale() === "en";
  const rateByCode = useMemo(() => new Map(method?.governorateRates.map((r) => [r.governorate, r.price]) ?? []), [method]);

  function fillAll(value: string) {
    formRef.current?.querySelectorAll<HTMLInputElement>("input[data-gov]").forEach((input) => {
      input.value = value;
    });
  }

  const q = query.trim().toLowerCase();

  return (
    <Sheet open={!!method} onOpenChange={onOpenChange}>
      <SheetContent
        side={isRtl() ? "left" : "right"}
        dir={tdir()}
        className="apple-ui gap-0 border-0 bg-background text-foreground data-[side=left]:w-full data-[side=left]:sm:max-w-md data-[side=right]:w-full data-[side=right]:sm:max-w-md"
      >
        {method && (
          <form ref={formRef} action={onSave} className="flex min-h-0 flex-1 flex-col">
            <SheetHeader className="gap-1 px-5 pt-8 pb-4 text-start">
              <SheetTitle className="text-[22px] font-bold">{tr("أسعار المحافظات")}</SheetTitle>
              <SheetDescription className="text-[15px]">
                {method.name} · {tr("سيب الخانة فاضية عشان المحافظة تاخد السعر الأساسي ({0}). اكتب 0 للشحن المجاني.", formatPrice(method.price))}
              </SheetDescription>
            </SheetHeader>

            <div className="flex items-center gap-2 px-4 pb-3">
              <label className="flex h-9 flex-1 items-center gap-2 rounded-[10px] bg-(--fill-3) px-3">
                <Search className="size-4 text-muted-foreground" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={tr("ابحث عن محافظة")}
                  className="h-full min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-(--label-3)"
                />
              </label>
              <button type="button" className={cn(appleButton.plain, "mx-0 h-9 text-[15px]")} onClick={() => fillAll("")}>
                {tr("مسح الكل")}
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
              <div className="apple-rows overflow-hidden rounded-[14px] bg-card [--row-inset:16px]">
                {EGYPT_GOVERNORATES.map((g) => {
                  const name = en ? g.nameEn : g.name;
                  const hidden = q && !g.name.includes(q) && !g.nameEn.toLowerCase().includes(q);
                  const price = rateByCode.get(g.code);
                  return (
                    // Hidden (not unmounted) so filtered-out values still submit.
                    <div key={g.code} className={cn("flex min-h-11 items-center gap-3 px-4", hidden && "hidden")}>
                      <label htmlFor={`gov_${g.code}`} className="min-w-0 flex-1 truncate text-[15px]">
                        {name}
                      </label>
                      <input
                        id={`gov_${g.code}`}
                        name={`gov_${g.code}`}
                        data-gov
                        type="number"
                        min="0"
                        step="0.5"
                        inputMode="decimal"
                        defaultValue={price === undefined ? "" : String(price / 100)}
                        placeholder={String(method.price / 100)}
                        className="h-9 w-24 rounded-[8px] bg-(--fill-3) px-2.5 text-end text-[15px] tabular-nums outline-none placeholder:text-(--label-3) focus:ring-2 focus:ring-primary/40"
                      />
                      <span className="w-7 shrink-0 text-[13px] text-muted-foreground">{tr("ج.م")}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <SheetFooter className="apple-glass px-4 pt-3 pb-4">
              <button type="submit" disabled={isPending} className={cn(appleButton.filled, "h-[50px] w-full text-[17px]")}>
                {isPending && <Loader2 className="size-4 animate-spin" />}
                {tr("حفظ الأسعار")}
              </button>
            </SheetFooter>
          </form>
        )}
      </SheetContent>
    </Sheet>
  );
}

export default function ShippingMethodsClient({ initialMethods, fallbackPrice }: { initialMethods: ShippingMethod[]; fallbackPrice: number }) {
  const [methods, setMethods] = useState<ShippingMethod[]>(initialMethods);
  const [editing, setEditing] = useState<ShippingMethod | "new" | null>(null);
  const [ratesFor, setRatesFor] = useState<ShippingMethod | null>(null);
  const [deleting, setDeleting] = useState<ShippingMethod | null>(null);
  const [isPending, startTransition] = useTransition();

  const run = (fn: () => Promise<{ success: boolean; message: string }>, after: () => void) =>
    startTransition(async () => {
      const res = await fn();
      if (!res.success) {
        toast.error(trv(res.message));
        return;
      }
      toast.success(trv(res.message));
      after();
    });

  const handleSave = (fd: FormData) =>
    run(
      () => (editing && editing !== "new" ? UpdateShippingMethodAction(editing.id, fd) : CreateShippingMethodAction(fd)),
      () => {
        setEditing(null);
        window.location.reload();
      },
    );

  const handleSaveRates = (fd: FormData) =>
    ratesFor &&
    run(
      () => SaveGovernorateRatesAction(ratesFor.id, fd),
      () => {
        setRatesFor(null);
        window.location.reload();
      },
    );

  function handleDelete(id: string) {
    run(
      () => DeleteShippingMethodAction(id),
      () => {
        setMethods((prev) => prev.filter((m) => m.id !== id));
        setDeleting(null);
      },
    );
  }

  function handleToggle(id: string, next: boolean) {
    setMethods((prev) => prev.map((m) => (m.id === id ? { ...m, isActive: next } : m)));
    startTransition(async () => {
      try {
        await ToggleShippingMethodAction(id, next);
      } catch {
        setMethods((prev) => prev.map((m) => (m.id === id ? { ...m, isActive: !next } : m)));
        toast.error(tr("حدث خطأ"));
      }
    });
  }

  const active = methods.filter((m) => m.isActive);
  const cheapest = active.length ? Math.min(...active.map((m) => m.price)) : null;

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
      {/* ── Methods list ─────────────────────────────────────── */}
      <section aria-labelledby="methods-title" className="space-y-2">
        <div className="flex items-end justify-between gap-3 px-4">
          <h2 id="methods-title" className="text-[13px] font-semibold text-muted-foreground">
            {tr("طرق الشحن")}
          </h2>
          <button type="button" onClick={() => setEditing("new")} className={cn(appleButton.plain, "mx-0 h-8 text-[15px]")}>
            <Plus className="size-4" strokeWidth={2.4} />
            {tr("إضافة طريقة شحن")}
          </button>
        </div>

        {methods.length === 0 ? (
          <div className="apple-card flex flex-col items-center gap-2 px-6 py-14 text-center">
            <Truck className="mb-2 size-11 text-(--label-3)" strokeWidth={1.5} />
            <p className="text-[20px] font-semibold">{tr("لا توجد طرق شحن بعد")}</p>
            <p className="max-w-sm text-[15px] text-muted-foreground">
              {fallbackPrice > 0
                ? tr("حالياً تُطبق قيمة شحن ثابتة {0} على جميع الطلبات", formatPrice(fallbackPrice))
                : tr("حالياً الشحن مجاني — أضف طرق شحن لتتيح للعملاء الاختيار")}
            </p>
            <button type="button" onClick={() => setEditing("new")} className={cn(appleButton.filled, "mt-3")}>
              <Plus className="size-4" strokeWidth={2.4} />
              {tr("إضافة طريقة شحن")}
            </button>
          </div>
        ) : (
          <ul className="apple-card apple-rows overflow-hidden rounded-[14px] [--row-inset:68px]">
            {methods.map((method) => (
              <li key={method.id} className="flex items-center gap-3 px-4 py-3">
                <span
                  aria-hidden
                  className={cn("grid size-10 shrink-0 place-items-center rounded-[10px] text-white", method.isActive ? "bg-(--sys-orange)" : "bg-(--sys-gray)")}
                >
                  <Truck className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-baseline gap-2">
                    <span className={cn("truncate text-[15px] font-semibold", !method.isActive && "text-muted-foreground")}>{method.name}</span>
                    <span className="shrink-0 text-[15px] tabular-nums">{method.price === 0 ? tr("مجاني") : formatPrice(method.price)}</span>
                  </p>
                  <p className="flex flex-wrap items-center gap-x-2 text-[13px] text-muted-foreground">
                    {method.estimatedDays && (
                      <span className="inline-flex items-center gap-1">
                        <Clock className="size-3" />
                        {tr(" · {0} أيام", method.estimatedDays).replace(/^\s*·\s*/, "")}
                      </span>
                    )}
                    {method.description && <span className="truncate">{method.description}</span>}
                  </p>
                  <button type="button" onClick={() => setRatesFor(method)} className="mt-0.5 inline-flex items-center gap-1 text-[13px] text-primary">
                    <MapPin className="size-3" />
                    {method.governorateRates.length > 0 ? tr("{0} محافظة بسعر خاص", method.governorateRates.length) : tr("أسعار المحافظات")}
                    <ChevronLeft className="size-3.5 ltr:-scale-x-100" />
                  </button>
                </div>

                <Switch
                  className="apple-switch"
                  checked={method.isActive}
                  onCheckedChange={(v) => handleToggle(method.id, v)}
                  aria-label={method.isActive ? tr("إيقاف") : tr("تفعيل")}
                />
                <DropdownMenu dir={tdir()} modal={false}>
                  <DropdownMenuTrigger asChild>
                    <button type="button" className={cn(appleButton.more, "size-8")} aria-label={tr("إجراءات")}>
                      <Ellipsis className="size-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className={appleMenu}>
                    <DropdownMenuItem onSelect={() => setEditing(method)}>
                      <Pencil />
                      {tr("تعديل")}
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => setRatesFor(method)}>
                      <MapPin />
                      {tr("أسعار المحافظات")}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem variant="destructive" onSelect={() => setDeleting(method)}>
                      <Trash2 />
                      {tr("حذف")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ── Checkout preview ─────────────────────────────────── */}
      <aside className="space-y-3 xl:sticky xl:top-20 xl:self-start">
        <p className="px-4 text-[13px] font-semibold text-muted-foreground">{tr("كده العميل هيشوفها في صفحة الدفع")}</p>
        <div className="rounded-[22px] bg-(--fill-3) p-4">
          {active.length === 0 ? (
            <p className="rounded-[14px] bg-card px-4 py-6 text-center text-[13px] text-muted-foreground">
              {fallbackPrice > 0 ? tr("حالياً تُطبق قيمة شحن ثابتة {0} على جميع الطلبات", formatPrice(fallbackPrice)) : tr("حالياً الشحن مجاني — أضف طرق شحن لتتيح للعملاء الاختيار")}
            </p>
          ) : (
            <ol className="apple-rows overflow-hidden rounded-[14px] bg-card [--row-inset:44px]">
              {active.map((m, i) => (
                <li key={m.id} className="flex items-center gap-3 px-3.5 py-3">
                  <span
                    aria-hidden
                    className={cn("grid size-5 shrink-0 place-items-center rounded-full", i === 0 ? "bg-primary" : "ring-[1.5px] ring-(--label-3) ring-inset")}
                  >
                    {i === 0 && <span className="size-2 rounded-full bg-primary-foreground" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px]">{m.name}</span>
                    {(m.description || m.estimatedDays) && (
                      <span className="block truncate text-[12px] text-muted-foreground">{m.description || tr(" · {0} أيام", m.estimatedDays!).replace(/^\s*·\s*/, "")}</span>
                    )}
                  </span>
                  <span className={cn("shrink-0 text-[15px] font-semibold tabular-nums", m.price === 0 && "text-(--sys-green)")}>
                    {m.price === 0 ? tr("مجاني") : formatPrice(m.price)}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>
        {cheapest !== null && (
          <p className="px-4 text-[13px] text-muted-foreground">
            <StatusText tone="success">{tr("{0} طريقة شغّالة", active.length)}</StatusText>
          </p>
        )}
      </aside>

      <MethodDialog
        key={editing === "new" ? "new" : (editing?.id ?? "none")}
        method={editing && editing !== "new" ? editing : null}
        open={editing !== null}
        onOpenChange={(o) => !o && setEditing(null)}
        onSave={handleSave}
        isPending={isPending}
      />

      <RatesSheet key={ratesFor?.id ?? "none"} method={ratesFor} onOpenChange={(o) => !o && setRatesFor(null)} onSave={handleSaveRates} isPending={isPending} />

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent dir={tdir()} className="sm:max-w-sm">
          <AlertDialogHeader className="text-center sm:text-center">
            <AlertDialogTitle>{tr("هل أنت متأكد من حذف طريقة الشحن هذه؟")}</AlertDialogTitle>
            <AlertDialogDescription>{deleting?.name}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                if (deleting) handleDelete(deleting.id);
              }}
              className={cn(appleButton.destructiveFilled, "h-11 w-full text-[15px]")}
            >
              {isPending && <Loader2 className="size-4 animate-spin" />}
              {tr("حذف")}
            </AlertDialogAction>
            <AlertDialogCancel className={cn(appleButton.plain, "mx-0 h-11 w-full border-0 bg-transparent shadow-none")}>{tr("إلغاء")}</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

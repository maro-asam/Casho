"use client";

import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Edit2, Check, X, Truck, ToggleLeft, ToggleRight, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  CreateShippingMethodAction,
  UpdateShippingMethodAction,
  DeleteShippingMethodAction,
  ToggleShippingMethodAction,
  SaveGovernorateRatesAction,
} from "@/actions/store/shipping.actions";
import { EGYPT_GOVERNORATES } from "@/constants/egypt-governorates";
import { intlLocale, tr, trv } from "@/lib/i18n/dashboard";

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
  return new Intl.NumberFormat(intlLocale(), {
    style: "currency",
    currency: "EGP",
    maximumFractionDigits: 0,
  }).format(piasters / 100);
}

function ShippingMethodForm({
  initial,
  onSave,
  onCancel,
  isPending,
}: {
  initial?: ShippingMethod;
  onSave: (fd: FormData) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  return (
    <form
      action={onSave}
      className="rounded-xl border bg-muted/20 p-4 space-y-3"
    >
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5 col-span-2 sm:col-span-1">
          <Label>{tr("اسم طريقة الشحن *")}</Label>
          <Input name="name" defaultValue={initial?.name} placeholder={tr("مثال: شحن عادي")} className="rounded-xl" required />
        </div>
        <div className="space-y-1.5">
          <Label>{tr("السعر (بالجنيه) *")}</Label>
          <Input
            name="price"
            type="number"
            min="0"
            step="0.5"
            defaultValue={initial ? (initial.price / 100).toFixed(2) : "0"}
            placeholder="0"
            className="rounded-xl"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label>{tr("مدة التوصيل (أيام)")}</Label>
          <Input name="estimatedDays" type="number" min="1" defaultValue={initial?.estimatedDays ?? ""} placeholder={tr("مثال: 3")} className="rounded-xl" />
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label>{tr("وصف مختصر")}</Label>
          <Input name="description" defaultValue={initial?.description ?? ""} placeholder={tr("مثال: يصلك خلال 3-5 أيام عمل")} className="rounded-xl" />
        </div>
        {initial && (
          <input type="hidden" name="isActive" value={initial.isActive ? "on" : "off"} />
        )}
      </div>
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" size="sm" className="rounded-xl" onClick={onCancel}>
          <X className="me-1.5 size-3.5" />{" "}{tr("إلغاء")}
        </Button>
        <Button type="submit" size="sm" className="rounded-xl" disabled={isPending}>
          <Check className="me-1.5 size-3.5" /> {initial ? tr("حفظ") : tr("إضافة")}
        </Button>
      </div>
    </form>
  );
}

function GovernorateRatesForm({
  method,
  onSave,
  onCancel,
  isPending,
}: {
  method: ShippingMethod;
  onSave: (fd: FormData) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const rateByCode = new Map(method.governorateRates.map((r) => [r.governorate, r.price]));
  const formRef = useRef<HTMLFormElement>(null);

  function fillAll(value: string) {
    formRef.current
      ?.querySelectorAll<HTMLInputElement>("input[data-gov]")
      .forEach((input) => { input.value = value; });
  }

  return (
    <form ref={formRef} action={onSave} className="rounded-xl border bg-muted/20 p-4 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-semibold">{tr("أسعار الشحن حسب المحافظة — {0}", method.name)}</p>
          <p className="text-sm text-muted-foreground">
            {tr("سيب الخانة فاضية عشان المحافظة تاخد السعر الأساسي ({0}). اكتب 0 للشحن المجاني.", formatPrice(method.price))}
          </p>
        </div>
        <Button type="button" variant="ghost" size="sm" className="rounded-xl" onClick={() => fillAll("")}>
          {tr("مسح الكل")}
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-x-4 gap-y-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {EGYPT_GOVERNORATES.map((g) => {
          const price = rateByCode.get(g.code);
          return (
            <div key={g.code} className="flex items-center gap-2">
              <Label htmlFor={`gov_${g.code}`} className="w-28 shrink-0 text-sm font-normal">
                {g.name}
              </Label>
              <Input
                id={`gov_${g.code}`}
                name={`gov_${g.code}`}
                data-gov
                type="number"
                min="0"
                step="0.5"
                inputMode="decimal"
                defaultValue={price === undefined ? "" : String(price / 100)}
                placeholder={String(method.price / 100)}
                className="h-9 rounded-xl"
              />
            </div>
          );
        })}
      </div>
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" size="sm" className="rounded-xl" onClick={onCancel}>
          <X className="me-1.5 size-3.5" />{" "}{tr("إلغاء")}
        </Button>
        <Button type="submit" size="sm" className="rounded-xl" disabled={isPending}>
          <Check className="me-1.5 size-3.5" />{" "}{tr("حفظ الأسعار")}
        </Button>
      </div>
    </form>
  );
}

export default function ShippingMethodsClient({
  initialMethods,
  fallbackPrice,
}: {
  initialMethods: ShippingMethod[];
  fallbackPrice: number;
}) {
  const [methods, setMethods] = useState<ShippingMethod[]>(initialMethods);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [ratesId, setRatesId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSaveRates(id: string, fd: FormData) {
    startTransition(async () => {
      const res = await SaveGovernorateRatesAction(id, fd);
      if (!res.success) { toast.error(trv(res.message)); return; }
      toast.success(trv(res.message));
      setRatesId(null);
      window.location.reload();
    });
  }

  function handleAdd(fd: FormData) {
    startTransition(async () => {
      const res = await CreateShippingMethodAction(fd);
      if (!res.success) { toast.error(trv(res.message)); return; }
      toast.success(trv(res.message));
      setShowAdd(false);
      window.location.reload();
    });
  }

  function handleUpdate(id: string, fd: FormData) {
    startTransition(async () => {
      const res = await UpdateShippingMethodAction(id, fd);
      if (!res.success) { toast.error(trv(res.message)); return; }
      toast.success(trv(res.message));
      setEditingId(null);
      window.location.reload();
    });
  }

  function handleDelete(id: string) {
    if (!confirm(tr("هل أنت متأكد من حذف طريقة الشحن هذه؟"))) return;
    startTransition(async () => {
      const res = await DeleteShippingMethodAction(id);
      if (!res.success) { toast.error(trv(res.message)); return; }
      toast.success(trv(res.message));
      setMethods((prev) => prev.filter((m) => m.id !== id));
    });
  }

  function handleToggle(id: string, current: boolean) {
    startTransition(async () => {
      await ToggleShippingMethodAction(id, !current);
      setMethods((prev) =>
        prev.map((m) => (m.id === id ? { ...m, isActive: !current } : m)),
      );
    });
  }

  return (
    <div className="space-y-4">
      {methods.length === 0 && !showAdd && (
        <Card className="rounded-xl border-dashed">
          <CardContent className="flex flex-col items-center justify-center min-h-52 text-center p-6">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-muted">
              <Truck className="size-6 text-muted-foreground" />
            </div>
            <p className="font-semibold">{tr("لا توجد طرق شحن بعد")}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {fallbackPrice > 0
                ? tr("حالياً تُطبق قيمة شحن ثابتة {0} على جميع الطلبات", formatPrice(fallbackPrice))
                : tr("حالياً الشحن مجاني — أضف طرق شحن لتتيح للعملاء الاختيار")}
            </p>
          </CardContent>
        </Card>
      )}

      {methods.map((method) =>
        editingId === method.id ? (
          <ShippingMethodForm
            key={method.id}
            initial={method}
            onSave={(fd) => handleUpdate(method.id, fd)}
            onCancel={() => setEditingId(null)}
            isPending={isPending}
          />
        ) : ratesId === method.id ? (
          <GovernorateRatesForm
            key={method.id}
            method={method}
            onSave={(fd) => handleSaveRates(method.id, fd)}
            onCancel={() => setRatesId(null)}
            isPending={isPending}
          />
        ) : (
          <Card key={method.id} className="rounded-xl">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <Truck className="size-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold">{method.name}</p>
                  {!method.isActive && (
                    <Badge variant="secondary" className="rounded-lg text-xs">{tr("متوقف")}</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {formatPrice(method.price)}
                  {method.estimatedDays && tr(" · {0} أيام", method.estimatedDays)}
                  {method.description && ` · ${method.description}`}
                </p>
                {method.governorateRates.length > 0 && (
                  <p className="text-xs text-primary">
                    {tr("{0} محافظة بسعر خاص", method.governorateRates.length)}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1 rounded-lg"
                  onClick={() => setRatesId(method.id)}
                  title={tr("أسعار المحافظات")}
                >
                  <MapPin className="size-3.5" />
                  <span className="hidden sm:inline">{tr("المحافظات")}</span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  onClick={() => handleToggle(method.id, method.isActive)}
                  disabled={isPending}
                  title={method.isActive ? tr("إيقاف") : tr("تفعيل")}
                >
                  {method.isActive
                    ? <ToggleRight className="size-4 text-emerald-500" />
                    : <ToggleLeft className="size-4 text-muted-foreground" />}
                </Button>
                <Button variant="ghost" size="icon" className="size-8" onClick={() => setEditingId(method.id)}>
                  <Edit2 className="size-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 text-destructive hover:text-destructive"
                  onClick={() => handleDelete(method.id)}
                  disabled={isPending}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ),
      )}

      {showAdd ? (
        <ShippingMethodForm
          onSave={handleAdd}
          onCancel={() => setShowAdd(false)}
          isPending={isPending}
        />
      ) : (
        <Button variant="outline" className="rounded-xl gap-1.5" onClick={() => setShowAdd(true)}>
          <Plus className="size-4" />
          {tr("إضافة طريقة شحن")}
        </Button>
      )}
    </div>
  );
}

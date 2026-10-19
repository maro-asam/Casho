"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CreateSupplierAction, UpdateSupplierAction } from "@/actions/inventory/suppliers.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { tr } from "@/lib/i18n/dashboard";

type Supplier = {
  id?: string;
  name?: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  taxNumber?: string | null;
  notes?: string | null;
};

export function SupplierForm({ supplier }: { supplier?: Supplier }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(supplier?.name ?? "");
  const [phone, setPhone] = useState(supplier?.phone ?? "");
  const [email, setEmail] = useState(supplier?.email ?? "");
  const [address, setAddress] = useState(supplier?.address ?? "");
  const [taxNumber, setTaxNumber] = useState(supplier?.taxNumber ?? "");
  const [notes, setNotes] = useState(supplier?.notes ?? "");

  function handleSubmit() {
    if (!name.trim()) return toast.error(tr("اسم المورد مطلوب"));

    startTransition(async () => {
      try {
        if (supplier?.id) {
          await UpdateSupplierAction(supplier.id, { name, phone, email, address, taxNumber, notes });
          toast.success(tr("تم تحديث بيانات المورد"));
        } else {
          await CreateSupplierAction({ name, phone, email, address, taxNumber, notes });
          toast.success(tr("تم إضافة المورد بنجاح"));
        }
        router.push("/dashboard/inventory/suppliers");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : tr("حدث خطأ"));
      }
    });
  }

  return (
    <div className="mx-auto max-w-xl rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label>{tr("الاسم *")}</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={tr("اسم المورد")} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>{tr("رقم الهاتف")}</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="01xxxxxxxxx" dir="ltr" />
          </div>
          <div className="space-y-1.5">
            <Label>{tr("البريد الإلكتروني")}</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" dir="ltr" type="email" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>{tr("العنوان")}</Label>
          <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder={tr("عنوان المورد")} />
        </div>
        <div className="space-y-1.5">
          <Label>{tr("الرقم الضريبي")}</Label>
          <Input value={taxNumber} onChange={(e) => setTaxNumber(e.target.value)} placeholder={tr("الرقم الضريبي")} dir="ltr" />
        </div>
        <div className="space-y-1.5">
          <Label>{tr("ملاحظات")}</Label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={tr("أي ملاحظات إضافية...")} rows={3} />
        </div>
        <div className="flex gap-3 pt-2">
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? tr("جاري الحفظ...") : supplier?.id ? tr("تحديث") : tr("إضافة المورد")}
          </Button>
          <Button variant="outline" onClick={() => router.back()}>{tr("إلغاء")}</Button>
        </div>
      </div>
    </div>
  );
}

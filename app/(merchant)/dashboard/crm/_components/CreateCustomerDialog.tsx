"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreateCRMCustomerAction } from "@/actions/crm/customers.actions";

export function CreateCustomerDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);

    startTransition(async () => {
      const res = await CreateCRMCustomerAction({
        phone: form.get("phone") as string,
        name: form.get("name") as string || undefined,
        email: form.get("email") as string || undefined,
        address: form.get("address") as string || undefined,
        birthday: form.get("birthday") as string || undefined,
        notes: form.get("notes") as string || undefined,
        status: (form.get("status") as "ACTIVE" | "VIP" | "INACTIVE") ?? "ACTIVE",
      });

      if (res.success) {
        toast.success("تم إضافة العميل بنجاح");
        setOpen(false);
        router.refresh();
      } else {
        toast.error(res.message);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <UserPlus className="size-4" />
          إضافة عميل
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>إضافة عميل جديد</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="name">الاسم</Label>
              <Input id="name" name="name" placeholder="محمد أحمد" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">رقم الهاتف *</Label>
              <Input id="phone" name="phone" placeholder="01012345678" required />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">البريد الإلكتروني</Label>
            <Input id="email" name="email" type="email" placeholder="customer@example.com" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="address">العنوان</Label>
            <Input id="address" name="address" placeholder="القاهرة، مصر" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="birthday">تاريخ الميلاد</Label>
              <Input id="birthday" name="birthday" type="date" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="status">الحالة</Label>
              <Select name="status" defaultValue="ACTIVE">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">نشط</SelectItem>
                  <SelectItem value="VIP">VIP</SelectItem>
                  <SelectItem value="INACTIVE">غير نشط</SelectItem>
                  <SelectItem value="BLOCKED">محظور</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="notes">ملاحظات</Label>
            <Input id="notes" name="notes" placeholder="ملاحظات سريعة..." />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              إلغاء
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "جاري الحفظ..." : "حفظ"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

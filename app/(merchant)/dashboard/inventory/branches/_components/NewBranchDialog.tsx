"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { CreateBranchAction } from "@/actions/inventory/branches.actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function NewBranchDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");

  function handleSubmit() {
    if (!name.trim()) return toast.error("اسم الفرع مطلوب");
    startTransition(async () => {
      try {
        await CreateBranchAction({ name, address, phone });
        toast.success("تم إضافة الفرع");
        setOpen(false);
        setName(""); setAddress(""); setPhone("");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "حدث خطأ");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <Plus className="size-4" />
          فرع جديد
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>إضافة فرع جديد</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>اسم الفرع *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="مثال: فرع المعادي" />
          </div>
          <div className="space-y-1.5">
            <Label>العنوان</Label>
            <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="عنوان الفرع" />
          </div>
          <div className="space-y-1.5">
            <Label>الهاتف</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="01xxxxxxxxx" dir="ltr" />
          </div>
          <div className="flex gap-2 pt-1">
            <Button onClick={handleSubmit} disabled={isPending} className="flex-1">
              {isPending ? "جاري الإضافة..." : "إضافة"}
            </Button>
            <Button variant="outline" onClick={() => setOpen(false)}>إلغاء</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

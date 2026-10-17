"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import type { FeatureType } from "@prisma/client";

import { CreateFeatureAction } from "@/actions/admin/admin-plans.actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FEATURE_TYPE_LABELS } from "./feature-meta";

export function CreateFeatureDialog({ nextSortOrder }: { nextSortOrder: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [key, setKey] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<FeatureType>("BOOLEAN");
  const [unit, setUnit] = useState("");

  const valid = name.trim() && /^[a-z][a-z0-9_]{1,40}$/.test(key);

  const submit = () =>
    start(async () => {
      const result = await CreateFeatureAction({
        key,
        name: name.trim(),
        description: description.trim() || null,
        type,
        unit: unit.trim() || null,
        // Hidden from the comparison page until it actually ships.
        isActive: false,
        sortOrder: nextSortOrder,
      });
      if (result.success) {
        toast.success(result.message);
        setOpen(false);
        setKey("");
        setName("");
        setDescription("");
        setUnit("");
        router.refresh();
      } else toast.error(result.message);
    });

  return (
    <Dialog open={open} onOpenChange={(o) => !pending && setOpen(o)}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="size-4" />
          ميزة جديدة
        </Button>
      </DialogTrigger>
      <DialogContent dir="rtl" className="sm:max-w-md">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (valid) submit();
          }}
        >
          <DialogHeader>
            <DialogTitle>ميزة جديدة</DialogTitle>
            <DialogDescription>المفتاح هو اللي الكود بيستخدمه للتحقق من الصلاحية، ومينفعش يتغير بعدين. الميزة بتتعمل مخفية.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="ft-key">المفتاح</Label>
                <Input id="ft-key" dir="ltr" value={key} onChange={(e) => setKey(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))} placeholder="custom_domain" />
              </div>
              <div className="space-y-1.5">
                <Label>النوع</Label>
                <Select value={type} onValueChange={(v) => setType(v as FeatureType)} dir="rtl">
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(FEATURE_TYPE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ft-name">الاسم (بيظهر للتاجر)</Label>
              <Input id="ft-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="دومين مخصص" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ft-desc">الوصف (اختياري)</Label>
              <Input id="ft-desc" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            {type !== "BOOLEAN" && (
              <div className="space-y-1.5">
                <Label htmlFor="ft-unit">الوحدة</Label>
                <Input id="ft-unit" value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="منتج" />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              رجوع
            </Button>
            <Button type="submit" disabled={!valid || pending}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              أضف الميزة
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

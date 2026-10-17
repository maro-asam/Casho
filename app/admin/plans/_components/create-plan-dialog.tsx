"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

import { CreatePlanAction } from "@/actions/admin/admin-plans.actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { egpToPiasters } from "./money";

export function CreatePlanDialog({ nextSortOrder }: { nextSortOrder: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [slug, setSlug] = useState("");
  const [monthly, setMonthly] = useState("");
  const [yearly, setYearly] = useState("");

  const monthlyP = egpToPiasters(monthly);
  const yearlyP = egpToPiasters(yearly);
  const valid = name.trim() && /^[A-Z][A-Z0-9_]{1,30}$/.test(key) && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) && monthlyP !== null && yearlyP !== null;

  const submit = () =>
    start(async () => {
      const result = await CreatePlanAction({
        name: name.trim(),
        key,
        slug,
        monthlyPrice: monthlyP!,
        yearlyPrice: yearlyP!,
        description: null,
        currency: "EGP",
        originalMonthlyPrice: null,
        originalYearlyPrice: null,
        discountPercent: null,
        // New plans start hidden until features and prices are reviewed.
        isActive: false,
        pricingConfigured: false,
        sortOrder: nextSortOrder,
      });
      if (result.success && "plan" in result && result.plan) {
        toast.success(result.message);
        setOpen(false);
        router.push(`/admin/plans/${result.plan.id}`);
      } else toast.error(result.message);
    });

  return (
    <Dialog open={open} onOpenChange={(o) => !pending && setOpen(o)}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="size-4" />
          باقة جديدة
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
            <DialogTitle>باقة جديدة</DialogTitle>
            <DialogDescription>الباقة بتتعمل معطّلة. فعّلها بعد ما تظبط مميزاتها وتأكد أسعارها.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="plan-name">الاسم</Label>
              <Input
                id="plan-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="الباقة الذهبية"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="plan-key">الكود</Label>
                <Input
                  id="plan-key"
                  dir="ltr"
                  value={key}
                  onChange={(e) => {
                    const v = e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, "");
                    setKey(v);
                    if (!slug || slug === key.toLowerCase().replace(/_/g, "-")) setSlug(v.toLowerCase().replace(/_/g, "-"));
                  }}
                  placeholder="GOLD"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="plan-slug">الرابط</Label>
                <Input id="plan-slug" dir="ltr" value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase())} placeholder="gold" />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="plan-monthly">السعر الشهري (جنيه)</Label>
                <Input id="plan-monthly" dir="ltr" inputMode="decimal" value={monthly} onChange={(e) => setMonthly(e.target.value)} placeholder="299" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="plan-yearly">السعر السنوي (جنيه)</Label>
                <Input id="plan-yearly" dir="ltr" inputMode="decimal" value={yearly} onChange={(e) => setYearly(e.target.value)} placeholder="2990" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              رجوع
            </Button>
            <Button type="submit" disabled={!valid || pending}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              أنشئ الباقة
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

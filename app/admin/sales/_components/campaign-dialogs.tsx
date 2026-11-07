"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, Plus, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { SegmentedButtons, appleButton } from "@/components/saas-page";
import {
  addCampaignMemberAction,
  deleteAnnouncementAction,
  removeCampaignMemberAction,
  saveAnnouncementAction,
  updateCampaignAction,
} from "@/actions/admin/sales-campaign.actions";
import { cn } from "@/lib/utils";
import { Field, SubmitRow, formValues, useSalesForm } from "./sales-dialogs";

// ─── Campaign ───────────────────────────────────────────────────────────────

export type CampaignFormDefaults = {
  campaignId: string;
  name: string;
  firstDay: string;
  lastDay: string;
  baseRate: number;
  pharmacyRate: number;
  posRate: number;
  bonusTarget: number;
  bonusEgp: number;
  maxMembers: number;
};

export function EditCampaignDialog({ defaults }: { defaults: CampaignFormDefaults }) {
  const [open, setOpen] = useState(false);
  const { submit, pending, errors } = useSalesForm(updateCampaignAction, () => setOpen(false));
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button type="button" className={cn(appleButton.tinted, "h-11 px-4 text-primary")}>
          <Pencil className="size-4" />
          تعديل العرض
        </button>
      </DialogTrigger>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>تعديل العرض</DialogTitle>
          <DialogDescription>
            النسب على أول اشتراك للعميل الجديد بس — التجديد بيفضل بالنسبة العادية. العمولات اللي اتحسبت قبل كده مبتتغيرش. اليومين بتوقيت القاهرة، والعرض بيقفل لوحده بعد آخر يوم.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={(e) => submit({ ...formValues(e), campaignId: defaults.campaignId })}>
          <Field label="اسم العرض" name="name" error={errors.name}>
            <Input id="name" name="name" defaultValue={defaults.name} required />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="أول يوم" name="firstDay" error={errors.firstDay}>
              <Input id="firstDay" name="firstDay" type="date" dir="ltr" defaultValue={defaults.firstDay} required />
            </Field>
            <Field label="آخر يوم" name="lastDay" error={errors.lastDay}>
              <Input id="lastDay" name="lastDay" type="date" dir="ltr" defaultValue={defaults.lastDay} required />
            </Field>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="عميل جديد %" name="baseRate" error={errors.baseRate}>
              <Input id="baseRate" name="baseRate" type="number" step="0.01" min={0} max={100} dir="ltr" defaultValue={defaults.baseRate} required />
            </Field>
            <Field label="صيدلية %" name="pharmacyRate" error={errors.pharmacyRate}>
              <Input id="pharmacyRate" name="pharmacyRate" type="number" step="0.01" min={0} max={100} dir="ltr" defaultValue={defaults.pharmacyRate} required />
            </Field>
            <Field label="بلاتينيوم %" name="posRate" error={errors.posRate}>
              <Input id="posRate" name="posRate" type="number" step="0.01" min={0} max={100} dir="ltr" defaultValue={defaults.posRate} required />
            </Field>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="البونص (ج.م)" name="bonusEgp" error={errors.bonusEgp}>
              <Input id="bonusEgp" name="bonusEgp" type="number" step="1" min={0} dir="ltr" defaultValue={defaults.bonusEgp} required />
            </Field>
            <Field label="عند كام عميل" name="bonusTarget" error={errors.bonusTarget}>
              <Input id="bonusTarget" name="bonusTarget" type="number" step="1" min={0} dir="ltr" defaultValue={defaults.bonusTarget} required />
            </Field>
            <Field label="عدد المندوبين" name="maxMembers" error={errors.maxMembers}>
              <Input id="maxMembers" name="maxMembers" type="number" step="1" min={1} dir="ltr" defaultValue={defaults.maxMembers} required />
            </Field>
          </div>
          <SubmitRow pending={pending} label="حفظ" />
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function AddCampaignMember({
  campaignId,
  candidates,
}: {
  campaignId: string;
  candidates: { id: string; label: string }[];
}) {
  const [repId, setRepId] = useState("");
  const { submit, pending } = useSalesForm(addCampaignMemberAction, () => setRepId(""));
  if (candidates.length === 0) return null;
  return (
    <form
      className="flex items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        submit({ campaignId, salesRepId: repId });
      }}
    >
      <Select value={repId} onValueChange={setRepId} dir="rtl">
        <SelectTrigger aria-label="اختار مندوب" className="h-9 w-44 rounded-full border-0 bg-muted shadow-none">
          <SelectValue placeholder="اختار مندوب" />
        </SelectTrigger>
        <SelectContent>
          {candidates.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <button type="submit" disabled={!repId || pending} className={cn(appleButton.tinted, "text-primary")}>
        {pending ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />}
        ضيف
      </button>
    </form>
  );
}

export function RemoveCampaignMember({ memberId, name }: { memberId: string; name: string }) {
  const [open, setOpen] = useState(false);
  const { submit, pending } = useSalesForm(removeCampaignMemberAction, () => setOpen(false));
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button type="button" className={cn(appleButton.destructive, "relative z-10 h-8 px-3 text-[13px]")}>
          شيل
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>تشيل {name} من العرض؟</DialogTitle>
          <DialogDescription>الدفعات الجاية هترجع للنسب العادية. العمولات اللي اتحسبت بالعرض (والبونص لو اتاخد) بتفضل زي ما هي.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            إلغاء
          </Button>
          <Button variant="destructive" disabled={pending} onClick={() => submit({ memberId })}>
            {pending && <Loader2 className="size-4 animate-spin" />}
            شيل من العرض
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Announcements ──────────────────────────────────────────────────────────

type Tone = "INFO" | "PROMO" | "ALERT";

const TONES: readonly (readonly [Tone, string])[] = [
  ["INFO", "معلومة"],
  ["PROMO", "عرض"],
  ["ALERT", "تنبيه"],
];

export type AnnouncementDefaults = { id: string; title: string; body: string; tone: string; pinned: boolean; expiresOn: string };

export function AnnouncementDialog({ announcement }: { announcement?: AnnouncementDefaults }) {
  const editing = !!announcement;
  const [open, setOpen] = useState(false);
  const [tone, setTone] = useState<Tone>((announcement?.tone as Tone) ?? "INFO");
  const [pinned, setPinned] = useState(announcement?.pinned ?? false);
  const { submit, pending, errors } = useSalesForm(saveAnnouncementAction, () => setOpen(false));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {editing ? (
          <button type="button" className={cn(appleButton.tinted, "h-8 px-3 text-[13px]")}>
            <Pencil className="size-3.5" />
            تعديل
          </button>
        ) : (
          <button type="button" className={appleButton.filled}>
            <Plus className="size-[18px]" strokeWidth={2.4} />
            إعلان جديد
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? "تعديل الإعلان" : "إعلان جديد للمندوبين"}</DialogTitle>
          <DialogDescription>بيظهر في أول الصفحة الرئيسية عند كل المندوبين.</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => submit({ ...formValues(e), id: announcement?.id ?? "", tone, pinned: pinned ? "on" : "" })}
        >
          <div className="space-y-1.5">
            <p className="text-sm font-medium">النوع</p>
            <SegmentedButtons label="نوع الإعلان" value={tone} onChange={setTone} options={TONES} />
          </div>
          <Field label="العنوان" name="title" error={errors.title}>
            <Input id="title" name="title" defaultValue={announcement?.title} placeholder="مثلًا: عرض الإطلاق بدأ" required maxLength={80} />
          </Field>
          <Field label="الرسالة" name="body" error={errors.body}>
            <Textarea id="body" name="body" rows={5} defaultValue={announcement?.body} required maxLength={1200} />
          </Field>
          <Field label="يفضل ظاهر لحد (اختياري)" name="expiresOn" error={errors.expiresOn}>
            <Input id="expiresOn" name="expiresOn" type="date" dir="ltr" defaultValue={announcement?.expiresOn} />
          </Field>
          <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl bg-(--fill-3) px-3.5 py-3">
            <span className="text-sm">
              <span className="block font-medium">تثبيت فوق</span>
              <span className="text-muted-foreground">يفضل أول إعلان لحد ما تشيل التثبيت</span>
            </span>
            <Switch checked={pinned} onCheckedChange={setPinned} aria-label="تثبيت الإعلان" className="apple-switch" />
          </label>
          <SubmitRow pending={pending} label={editing ? "حفظ" : "انشر للمندوبين"} />
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function DeleteAnnouncement({ id, title }: { id: string; title: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function remove() {
    startTransition(async () => {
      const res = await deleteAnnouncementAction({ id });
      if (!res.success) {
        toast.error(res.message);
        return;
      }
      toast.success(res.message);
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button type="button" className={cn(appleButton.destructive, "h-8 px-3 text-[13px]")}>
          <Trash2 className="size-3.5" />
          مسح
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>تمسح &quot;{title}&quot;؟</DialogTitle>
          <DialogDescription>هيختفي من عند كل المندوبين ومش هيرجع.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            إلغاء
          </Button>
          <Button variant="destructive" disabled={pending} onClick={remove}>
            {pending && <Loader2 className="size-4 animate-spin" />}
            مسح
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";

import { broadcastNotificationAction, countBroadcastAudienceAction, type BroadcastAudience } from "@/actions/admin/admin-notifications.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

const AUDIENCES: { value: BroadcastAudience; label: string; hint: string }[] = [
  { value: "all", label: "كل المتاجر", hint: "أي متجر على المنصة" },
  { value: "active", label: "المشتركين", hint: "اشتراكهم نشط" },
  { value: "attention", label: "محتاجين متابعة", hint: "سماح، متأخر، أو غير مفعل" },
  { value: "store", label: "متجر واحد", hint: "بالرابط (slug)" },
];

const nf = new Intl.NumberFormat("ar-EG");

export function BroadcastForm() {
  const router = useRouter();
  const [audience, setAudience] = useState<BroadcastAudience>("all");
  const [storeSlug, setStoreSlug] = useState("");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [href, setHref] = useState("");
  const [reach, setReach] = useState<number | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [pending, start] = useTransition();

  // Live audience size, debounced for the slug field.
  useEffect(() => {
    let cancelled = false;
    const id = window.setTimeout(() => {
      countBroadcastAudienceAction(audience, storeSlug)
        .then((n) => !cancelled && setReach(n))
        .catch(() => !cancelled && setReach(null));
    }, audience === "store" ? 400 : 0);
    return () => {
      cancelled = true;
      window.clearTimeout(id);
    };
  }, [audience, storeSlug]);

  const valid = title.trim().length >= 3 && message.trim().length >= 5 && (audience !== "store" || storeSlug.trim()) && (reach ?? 0) > 0;

  const send = () =>
    start(async () => {
      const result = await broadcastNotificationAction({ audience, storeSlug, title, message, href });
      if (result.success) {
        toast.success(result.message);
        setConfirming(false);
        setTitle("");
        setMessage("");
        setHref("");
        router.refresh();
      } else toast.error(result.message);
    });

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (valid) setConfirming(true);
      }}
    >
      <fieldset className="space-y-2">
        <legend className="mb-2 text-sm font-medium">مين يوصله؟</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {AUDIENCES.map((a) => (
            <label
              key={a.value}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors",
                audience === a.value ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50",
              )}
            >
              <input type="radio" name="audience" value={a.value} checked={audience === a.value} onChange={() => setAudience(a.value)} className="mt-1 accent-primary" />
              <span>
                <span className="block text-sm font-medium">{a.label}</span>
                <span className="block text-xs text-muted-foreground">{a.hint}</span>
              </span>
            </label>
          ))}
        </div>
        {audience === "store" && (
          <Input dir="ltr" value={storeSlug} onChange={(e) => setStoreSlug(e.target.value)} placeholder="store-slug" aria-label="رابط المتجر" className="mt-2" />
        )}
        <p className="text-xs text-muted-foreground">
          {reach === null ? "بنحسب…" : audience === "store" && storeSlug && reach === 0 ? "مفيش متجر بالرابط ده." : `هيوصل لـ ${nf.format(reach)} متجر.`}
        </p>
      </fieldset>

      <div className="space-y-1.5">
        <Label htmlFor="bc-title">العنوان</Label>
        <Input id="bc-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} placeholder="مثال: ميزة جديدة في نقطة البيع" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="bc-message">الرسالة</Label>
        <Textarea id="bc-message" rows={4} value={message} onChange={(e) => setMessage(e.target.value)} maxLength={600} placeholder="جملتين واضحين: إيه الجديد وإيه المطلوب من التاجر." />
        <p className="text-left text-xs tabular-nums text-muted-foreground">{nf.format(message.length)} / ٦٠٠</p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="bc-href">صفحة يفتحها الإشعار (اختياري)</Label>
        <Input id="bc-href" dir="ltr" value={href} onChange={(e) => setHref(e.target.value)} placeholder="/dashboard/pos" />
      </div>

      {/* Preview, as the merchant sees it in the bell. */}
      {(title || message) && (
        <div className="rounded-lg border border-dashed border-border p-3">
          <p className="mb-2 text-xs text-muted-foreground">معاينة</p>
          <p className="text-sm font-semibold">{title || "العنوان"}</p>
          <p className="mt-0.5 text-sm leading-6 text-muted-foreground">{message || "الرسالة"}</p>
        </div>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={!valid || pending}>
          <Send className="size-4" />
          ابعت الإشعار
        </Button>
      </div>

      <AlertDialog open={confirming} onOpenChange={(o) => !pending && setConfirming(o)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>تبعت لـ {nf.format(reach ?? 0)} متجر؟</AlertDialogTitle>
            <AlertDialogDescription>الإشعار هيظهر في لوحة كل تاجر خلال دقيقة، ومش هينفع تسحبه بعد الإرسال.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>رجوع</AlertDialogCancel>
            <Button onClick={send} disabled={pending}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              ابعت
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </form>
  );
}

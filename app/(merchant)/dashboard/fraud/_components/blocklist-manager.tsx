"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Ban, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { BlockPhoneAction, UnblockPhoneAction } from "@/actions/store/fraud.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Entry = { id: string; phone: string; reason: string | null; createdAt: string };

export function BlocklistManager({ storeId, entries }: { storeId: string; entries: Entry[] }) {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [reason, setReason] = useState("");
  const [adding, startAdd] = useTransition();
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [, startRemove] = useTransition();

  function add(e: React.FormEvent) {
    e.preventDefault();
    startAdd(async () => {
      const result = await BlockPhoneAction(storeId, { phone, reason });
      if (result.ok) {
        toast.success(result.message);
        setPhone("");
        setReason("");
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  function remove(id: string) {
    setRemovingId(id);
    startRemove(async () => {
      const result = await UnblockPhoneAction(storeId, id);
      setRemovingId(null);
      if (result.ok) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <section className="rounded-xl border border-border bg-card">
      <div className="border-b border-border p-4">
        <h2 className="font-semibold">الأرقام المحظورة</h2>
        <p className="text-sm text-muted-foreground">الرقم المحظور مش هيقدر يعمل طلب من متجرك خالص. تقدر كمان تحظر من صفحة أي طلب.</p>
      </div>

      <form onSubmit={add} className="grid gap-3 border-b border-border p-4 sm:grid-cols-[1fr_1.5fr_auto] sm:items-end">
        <div className="space-y-2">
          <Label htmlFor="block-phone">رقم الموبايل</Label>
          <Input id="block-phone" dir="ltr" inputMode="tel" value={phone} placeholder="01012345678" onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="block-reason">السبب (اختياري)</Label>
          <Input id="block-reason" value={reason} maxLength={200} placeholder="رفض الاستلام مرتين" onChange={(e) => setReason(e.target.value)} />
        </div>
        <Button type="submit" variant="destructive" disabled={!phone.trim() || adding}>
          {adding ? <Loader2 className="size-4 animate-spin" /> : <Ban className="size-4" />}
          احظر
        </Button>
      </form>

      {entries.length === 0 ? (
        <p className="p-6 text-center text-sm text-muted-foreground">مفيش أرقام محظورة لسه.</p>
      ) : (
        <ul className="divide-y divide-border">
          {entries.map((entry) => (
            <li key={entry.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="font-mono text-sm font-medium tabular-nums" dir="ltr">
                  {entry.phone}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {entry.reason ? `${entry.reason} · ` : ""}
                  {entry.createdAt}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`شيل الحظر عن ${entry.phone}`}
                onClick={() => remove(entry.id)}
                disabled={removingId === entry.id}
              >
                {removingId === entry.id ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { appleButton } from "@/components/saas-page";
import { DeleteCampaignCostAction, SaveCampaignCostAction } from "@/actions/admin/analytics.actions";
import type { CampaignCostRow } from "@/lib/analytics/queries/campaigns";

const money = new Intl.NumberFormat("ar-EG", { style: "currency", currency: "EGP", maximumFractionDigits: 0 });
const field = "apple-field h-10 w-full px-3 text-[14px] text-foreground";

export function CostManager({ costs, canEdit }: { costs: CampaignCostRow[]; canEdit: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [form, setForm] = useState({ campaign: "", source: "", startDate: "", endDate: "", amountEgp: "", note: "" });
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    start(async () => {
      const res = await SaveCampaignCostAction({ ...form, amountEgp: Number(form.amountEgp) });
      if (!res.ok) return void toast.error(res.error);
      toast.success("اتضافت التكلفة");
      setForm({ campaign: "", source: "", startDate: "", endDate: "", amountEgp: "", note: "" });
      router.refresh();
    });
  };

  return (
    <section className="apple-card overflow-hidden">
      <div className="px-5 pt-5 pb-3">
        <h2 className="text-[17px] font-semibold">صرف الحملات</h2>
        <p className="text-[13px] text-muted-foreground">اكتب المبلغ اللي اتصرف فعلًا (من مدير الإعلانات) عشان تظهر تكلفة العميل والعائد. اسم الحملة لازم يطابق utm_campaign.</p>
      </div>
      {canEdit && (
        <form onSubmit={save} className="apple-form grid gap-2 px-5 pb-4 sm:grid-cols-2 lg:grid-cols-6">
          <input className={field} value={form.campaign} onChange={set("campaign")} placeholder="utm_campaign" dir="ltr" required aria-label="اسم الحملة" />
          <input className={field} value={form.source} onChange={set("source")} placeholder="المصدر (اختياري)" dir="ltr" aria-label="المصدر" />
          <input className={field} type="date" value={form.startDate} onChange={set("startDate")} required aria-label="من" />
          <input className={field} type="date" value={form.endDate} onChange={set("endDate")} required aria-label="إلى" />
          <input className={field} type="number" min="1" step="0.01" value={form.amountEgp} onChange={set("amountEgp")} placeholder="المبلغ بالجنيه" required aria-label="المبلغ" />
          <button type="submit" disabled={pending} className={appleButton.filled}>
            إضافة
          </button>
        </form>
      )}
      {costs.length ? (
        <ol className="apple-rows pb-2 [--row-inset:20px]">
          {costs.map((c) => (
            <li key={c.id} className="flex items-center gap-3 px-5 py-2.5 text-[14px]">
              <span className="min-w-0 flex-1 truncate">
                <span className="font-medium" dir="ltr">
                  {c.campaign}
                </span>
                {c.source && <span className="text-muted-foreground"> · {c.source}</span>}
                <span className="block text-[12px] text-muted-foreground tabular-nums">
                  {c.startDate} → {c.endDate}
                </span>
              </span>
              <span className="font-semibold tabular-nums">{money.format(c.amount / 100)}</span>
              {canEdit && (
                <button
                  type="button"
                  aria-label="مسح"
                  disabled={pending}
                  onClick={() => {
                    if (!confirm("تمسح التكلفة دي؟")) return;
                    start(async () => {
                      const res = await DeleteCampaignCostAction(c.id);
                      if (!res.ok) return void toast.error(res.error);
                      router.refresh();
                    });
                  }}
                  className="apple-press grid size-9 place-items-center rounded-full text-(--sys-red) hover:bg-(--sys-red)/10"
                >
                  <Trash2 className="size-4" />
                </button>
              )}
            </li>
          ))}
        </ol>
      ) : (
        <p className="px-5 pb-5 text-[13px] text-muted-foreground">لسه مفيش صرف متسجل.</p>
      )}
    </section>
  );
}

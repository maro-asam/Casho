"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Ban, Loader2, Search, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { BlockPhoneAction, UnblockPhoneAction } from "@/actions/store/fraud.actions";
import { Unavailable, appleButton } from "@/components/saas-page";
import { cn } from "@/lib/utils";
import { lazyIntl, tr, trv } from "@/lib/i18n/dashboard";

type Entry = { id: string; phone: string; reason: string | null; createdAt: string };

const nf = lazyIntl.number();
const INLINE_INPUT =
  "h-11 min-w-0 flex-1 bg-transparent text-end text-[15px] outline-none placeholder:text-(--label-3)";

export function BlocklistManager({ storeId, entries }: { storeId: string; entries: Entry[] }) {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [reason, setReason] = useState("");
  const [query, setQuery] = useState("");
  const [adding, startAdd] = useTransition();
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [, startRemove] = useTransition();

  function add(e: React.FormEvent) {
    e.preventDefault();
    startAdd(async () => {
      const result = await BlockPhoneAction(storeId, { phone, reason });
      if (result.ok) {
        toast.success(trv(result.message));
        setPhone("");
        setReason("");
        router.refresh();
      } else {
        toast.error(trv(result.message));
      }
    });
  }

  function remove(id: string) {
    setRemovingId(id);
    startRemove(async () => {
      const result = await UnblockPhoneAction(storeId, id);
      setRemovingId(null);
      if (result.ok) {
        toast.success(trv(result.message));
        router.refresh();
      } else {
        toast.error(trv(result.message));
      }
    });
  }

  const q = query.trim().toLowerCase();
  const visible = q ? entries.filter((e) => e.phone.includes(q) || e.reason?.toLowerCase().includes(q)) : entries;

  return (
    <div id="blocklist" className="scroll-mt-24 space-y-8">
      {/* Add — iOS form rows. */}
      <section className="space-y-2">
        <h2 className="px-4 text-[13px] font-semibold text-muted-foreground">{tr("احظر رقم")}</h2>
        <form onSubmit={add} className="apple-card apple-rows overflow-hidden rounded-[14px] [--row-inset:16px]">
          <label htmlFor="block-phone" className="flex items-center gap-4 px-4">
            <span className="shrink-0 text-[15px]">{tr("رقم الموبايل")}</span>
            <input
              id="block-phone"
              dir="ltr"
              inputMode="tel"
              value={phone}
              placeholder="01012345678"
              onChange={(e) => setPhone(e.target.value)}
              className={cn(INLINE_INPUT, "tabular-nums rtl:text-left")}
            />
          </label>
          <label htmlFor="block-reason" className="flex items-center gap-4 px-4">
            <span className="shrink-0 text-[15px]">{tr("السبب")}</span>
            <input
              id="block-reason"
              value={reason}
              maxLength={200}
              placeholder={tr("رفض الاستلام مرتين")}
              onChange={(e) => setReason(e.target.value)}
              className={INLINE_INPUT}
            />
          </label>
          <button
            type="submit"
            disabled={!phone.trim() || adding}
            className="flex min-h-11 w-full items-center justify-center gap-2 px-4 text-[15px] font-semibold text-(--sys-red) hover:bg-(--fill-3)/50 disabled:opacity-40 disabled:hover:bg-transparent"
          >
            {adding ? <Loader2 className="size-4 animate-spin" /> : <Ban className="size-4" />}
            {tr("احظر الرقم")}
          </button>
        </form>
        <p className="px-4 text-[13px] leading-[18px] text-muted-foreground">
          {tr("الرقم المحظور مش هيقدر يعمل طلب من متجرك خالص. تقدر كمان تحظر من صفحة أي طلب.")}
        </p>
      </section>

      {/* The list. */}
      <section className="space-y-2">
        <div className="flex items-end justify-between gap-3 px-4">
          <h2 className="text-[13px] font-semibold text-muted-foreground">
            {tr("الأرقام المحظورة")} {entries.length > 0 && <span className="tabular-nums">({nf.format(entries.length)})</span>}
          </h2>
        </div>
        <div className="apple-card overflow-hidden rounded-[14px]">
          {entries.length === 0 ? (
            <Unavailable icon={ShieldCheck} className="py-12" title={tr("مفيش أرقام محظورة لسه.")} description={tr("لما تحظر رقم هيظهر هنا، وتقدر تشيل الحظر في أي وقت.")} />
          ) : (
            <>
              {entries.length > 6 && (
                <div className="p-3">
                  <label className="flex h-9 items-center gap-2 rounded-[10px] bg-(--fill-3) px-3">
                    <Search className="size-4 shrink-0 text-muted-foreground" />
                    <span className="sr-only">{tr("ابحث برقم أو سبب")}</span>
                    <input
                      type="search"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder={tr("ابحث برقم أو سبب")}
                      className="min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted-foreground"
                    />
                  </label>
                </div>
              )}
              {visible.length === 0 ? (
                <p className="px-4 py-8 text-center text-[15px] text-muted-foreground">{tr("مفيش نتايج")}</p>
              ) : (
                <ul className="apple-rows max-h-[32rem] overflow-y-auto [--row-inset:60px]">
                  {visible.map((entry) => (
                    <li key={entry.id} className="flex items-center gap-3 px-4 py-2.5">
                      <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-full bg-(--sys-red)/12 text-(--sys-red)">
                        <Ban className="size-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[15px] font-medium tabular-nums rtl:text-right" dir="ltr">
                          {entry.phone}
                        </p>
                        <p className="truncate text-[13px] text-muted-foreground">
                          {entry.reason ? `${entry.reason} · ` : ""}
                          {entry.createdAt}
                        </p>
                      </div>
                      <button
                        type="button"
                        aria-label={tr("شيل الحظر عن {0}", entry.phone)}
                        onClick={() => remove(entry.id)}
                        disabled={removingId === entry.id}
                        className={cn(appleButton.tinted, "h-8 px-3 text-[13px] text-primary")}
                      >
                        {removingId === entry.id ? <Loader2 className="size-3.5 animate-spin" /> : tr("شيل الحظر")}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}

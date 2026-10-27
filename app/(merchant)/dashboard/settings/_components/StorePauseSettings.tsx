"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { PauseCircle } from "lucide-react";

import { PauseStoreAction, ResumeStoreAction } from "@/actions/store/store-pause.actions";
import { appleButton } from "@/components/saas-page";
import { Switch } from "@/components/ui/switch";
import { PAUSE_MESSAGE_MAX } from "@/lib/store/pause";
import { cn } from "@/lib/utils";
import { dateTimeFormat, tr, trv } from "@/lib/i18n/dashboard";
import { Group, IconTile } from "./settings-ui";

type Initial = {
  /** ISO, only while the pause is running (null = open). */
  pausedUntil: string | null;
  pauseMessage: string | null;
  pauseCountdown: boolean;
};

/** ISO → <input type="datetime-local"> value in the merchant's timezone. */
function toLocalInput(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const HOUR = 60 * 60 * 1000;

/** Quick reopen times, from now (rounded to the next 5 minutes). */
function presets() {
  return [
    { label: tr("ساعة"), ms: HOUR },
    { label: tr("٣ ساعات"), ms: 3 * HOUR },
    { label: tr("يوم"), ms: 24 * HOUR },
    { label: tr("أسبوع"), ms: 7 * 24 * HOUR },
  ];
}

function inFromNow(ms: number) {
  const step = 5 * 60 * 1000;
  return new Date(Math.ceil((Date.now() + ms) / step) * step);
}

/** Pause the storefront until a time, with an optional countdown and message. */
export default function StorePauseSettings({ initial }: { initial: Initial }) {
  const [pausedUntil, setPausedUntil] = useState(initial.pausedUntil);
  const paused = pausedUntil !== null;

  // The form only mounts after a click, so its local-time values never hit SSR.
  const [editing, setEditing] = useState(false);
  const [until, setUntil] = useState("");
  const [message, setMessage] = useState(initial.pauseMessage ?? "");
  const [countdown, setCountdown] = useState(initial.pauseCountdown);
  const [pending, startTransition] = useTransition();

  const formatUntil = (iso: string) =>
    dateTimeFormat({ timeZone: "Africa/Cairo", weekday: "long", day: "numeric", month: "long", hour: "numeric", minute: "2-digit" }).format(new Date(iso));

  function openForm() {
    setUntil(toLocalInput(pausedUntil ? new Date(pausedUntil) : inFromNow(24 * HOUR)));
    setEditing(true);
  }

  function submit() {
    if (!until) {
      toast.error(tr("اختار ميعاد رجوع المتجر"));
      return;
    }
    const iso = new Date(until).toISOString();
    startTransition(async () => {
      const result = await PauseStoreAction({ until: iso, message, showCountdown: countdown });
      if (!result.ok) {
        toast.error(trv(result.message));
        return;
      }
      setPausedUntil(iso);
      setEditing(false);
      toast.success(trv(result.message));
    });
  }

  function resume() {
    startTransition(async () => {
      const result = await ResumeStoreAction();
      if (!result.ok) {
        toast.error(trv(result.message));
        return;
      }
      setPausedUntil(null);
      setEditing(false);
      toast.success(trv(result.message));
    });
  }

  return (
    <Group
      id="pause"
      inset={58}
      title={tr("إيقاف المتجر مؤقتًا")}
      footer={tr("وقت الإيقاف الزوار بيشوفوا صفحة «المتجر مقفول» ومحدش يقدر يطلب، والمتجر بيفتح لوحده في الميعاد. تتبع الطلبات بيفضل شغال، وإنت لسه تقدر تعدّل شكل المتجر من «تخصيص شكل المتجر».")}
    >
      <label className="flex min-h-11 cursor-pointer items-center gap-3 px-4 py-3">
        <IconTile icon={PauseCircle} tint={paused ? "bg-(--sys-orange)" : "bg-(--sys-gray)"} />
        <span className="min-w-0 flex-1">
          <span className="block text-[15px]">{paused ? tr("المتجر واقف مؤقتًا") : tr("إيقاف المتجر")}</span>
          <span className="block text-[13px] leading-5 text-muted-foreground">
            {pausedUntil ? tr("بيفتح تاني {0}", formatUntil(pausedUntil)) : tr("اقفل المتجر لحد ميعاد معيّن، مع عدّاد تنازلي لو حابب.")}
          </span>
        </span>
        <Switch
          checked={paused || editing}
          onCheckedChange={(next) => {
            if (next) openForm();
            else if (paused) resume();
            else setEditing(false);
          }}
          disabled={pending}
          aria-label={tr("إيقاف المتجر")}
          className="apple-switch shrink-0"
        />
      </label>

      {paused && !editing && (
        <div className="flex flex-wrap items-center justify-end gap-2 px-4 py-3">
          <button type="button" onClick={openForm} disabled={pending} className={appleButton.tinted}>
            {tr("تعديل الإيقاف")}
          </button>
          <button type="button" onClick={resume} disabled={pending} className={appleButton.plain}>
            {tr("افتح المتجر دلوقتي")}
          </button>
        </div>
      )}

      {editing && (
        <>
          <div className="space-y-2.5 px-4 py-3">
            <div className="flex min-h-11 flex-wrap items-center gap-3">
              <label htmlFor="pause-until" className="shrink-0 text-[15px]">
                {tr("يفتح تاني في")}
              </label>
              <input
                id="pause-until"
                type="datetime-local"
                value={until}
                min={toLocalInput(new Date())}
                onChange={(e) => setUntil(e.target.value)}
                className="h-11 min-w-0 flex-1 bg-transparent text-end text-[15px] outline-none"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {presets().map((p) => (
                <button
                  key={p.ms}
                  type="button"
                  onClick={() => setUntil(toLocalInput(inFromNow(p.ms)))}
                  className="h-8 rounded-full bg-muted px-3 text-[13px] text-foreground transition-colors hover:bg-muted/70"
                >
                  {tr("بعد {0}", p.label)}
                </button>
              ))}
            </div>
          </div>

          <label className="flex min-h-11 cursor-pointer items-center justify-between gap-4 px-4 py-3">
            <span className="min-w-0">
              <span className="block text-[15px]">{tr("عدّاد تنازلي")}</span>
              <span className="block text-[13px] leading-5 text-muted-foreground">{tr("الزوار يشوفوا الوقت الباقي على فتح المتجر.")}</span>
            </span>
            <Switch checked={countdown} onCheckedChange={setCountdown} aria-label={tr("عدّاد تنازلي")} className="apple-switch shrink-0" />
          </label>

          <div className="px-4 py-3">
            <label htmlFor="pause-message" className="block text-[15px]">
              {tr("رسالة للزوار (اختياري)")}
            </label>
            <textarea
              id="pause-message"
              value={message}
              maxLength={PAUSE_MESSAGE_MAX}
              rows={2}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={tr("مثال: بنجهّز كولكشن الشتا، راجعين قريب!")}
              className="mt-2 w-full resize-none rounded-[10px] bg-muted/60 px-3 py-2 text-[15px] outline-none placeholder:text-(--label-3) focus:bg-muted"
            />
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2 px-4 py-3">
            <button type="button" onClick={() => setEditing(false)} disabled={pending} className={appleButton.plain}>
              {tr("إلغاء")}
            </button>
            <button type="button" onClick={submit} disabled={pending} className={cn(appleButton.filled, "h-10")}>
              {paused ? tr("حفظ التعديلات") : tr("إيقاف المتجر")}
            </button>
          </div>
        </>
      )}
    </Group>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { Radio, Users } from "lucide-react";
import { Unavailable } from "@/components/saas-page";
import { cn } from "@/lib/utils";
import type { RealtimeData } from "@/lib/analytics/queries/activity";
import { channelLabel, countryName, deviceLabel, eventLabel, flagOf, fmtNum, fmtSince, fmtTime, pathLabel } from "../_lib/format";

const POLL_MS = 10_000;

function groupCount<T>(items: T[], key: (t: T) => string) {
  const m = new Map<string, number>();
  for (const it of items) m.set(key(it), (m.get(key(it)) ?? 0) + 1);
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
}

function MiniList({ title, rows, empty }: { title: string; rows: [string, number][]; empty: string }) {
  const top = Math.max(1, ...rows.map((r) => r[1]));
  return (
    <section className="apple-card overflow-hidden">
      <h2 className="px-5 pt-5 pb-2 text-[15px] font-semibold">{title}</h2>
      {rows.length ? (
        <ol className="space-y-1 px-3 pb-3">
          {rows.slice(0, 6).map(([label, n]) => (
            <li key={label} className="relative flex min-h-9 items-center gap-3 rounded-[10px] px-2.5 text-[14px]">
              <span aria-hidden className="absolute inset-y-1 start-0 rounded-[8px] bg-(--viz-1)/12" style={{ width: `${(n / top) * 100}%` }} />
              <span className="relative min-w-0 flex-1 truncate" dir="auto">
                {label}
              </span>
              <span className="relative font-semibold tabular-nums">{fmtNum(n)}</span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="px-5 pb-5 text-[13px] text-muted-foreground">{empty}</p>
      )}
    </section>
  );
}

export function RealtimeView({ initial, query }: { initial: RealtimeData; query: string }) {
  const [data, setData] = useState(initial);
  const [now, setNow] = useState(() => Date.now());
  const [stale, setStale] = useState(false);

  useEffect(() => {
    let timer: number | null = null;
    let cancelled = false;
    const tick = async () => {
      if (document.visibilityState === "visible") {
        try {
          const res = await fetch(`/api/admin/analytics/realtime${query ? `?${query}` : ""}`, { cache: "no-store" });
          if (!res.ok) throw new Error(String(res.status));
          const next = (await res.json()) as RealtimeData;
          if (!cancelled) {
            setData(next);
            setStale(false);
          }
        } catch {
          if (!cancelled) setStale(true);
        }
      }
      if (!cancelled) {
        setNow(Date.now());
        timer = window.setTimeout(tick, POLL_MS);
      }
    };
    timer = window.setTimeout(tick, POLL_MS);
    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [query]);

  const pagesNow = useMemo(() => groupCount(data.sessions, (s) => pathLabel(s.currentPath)), [data.sessions]);
  const entries = useMemo(() => groupCount(data.sessions, (s) => pathLabel(s.entryPath)), [data.sessions]);
  const sources = useMemo(() => groupCount(data.sessions, (s) => `${channelLabel(s.channel)} · ${s.source}`), [data.sessions]);
  const places = useMemo(
    () => groupCount(data.sessions, (s) => (s.country ? `${flagOf(s.country)} ${countryName(s.country)}${s.city ? ` — ${s.city}` : ""}` : "غير معروف")),
    [data.sessions],
  );
  const maxMinute = Math.max(1, ...data.perMinute);

  return (
    <div className="space-y-4">
      <section className="apple-card overflow-hidden p-5">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <p className="flex items-center gap-2 text-[13px] font-semibold text-muted-foreground">
              <span className={cn("size-2.5 rounded-full", stale ? "bg-(--sys-gray)" : "analytics-live-dot bg-(--sys-green)")} aria-hidden />
              {stale ? "التحديث وقف — بنحاول تاني" : `زوار نشطين آخر ${fmtNum(data.windowMin)} دقايق`}
            </p>
            <p className="text-[48px] leading-[52px] font-bold tabular-nums" aria-live="polite">
              {fmtNum(data.activeVisitors)}
            </p>
            <p className="text-[13px] text-muted-foreground tabular-nums">
              {fmtNum(data.activeSessions)} زيارة نشطة · بيتحدث كل ١٠ ثواني
            </p>
          </div>
          <div className="w-full max-w-md space-y-1">
            <div className="flex h-16 items-end gap-[2px]" role="img" aria-label="مشاهدات الصفحات في كل دقيقة، آخر ٣٠ دقيقة">
              {data.perMinute.map((n, i) => (
                <span
                  key={i}
                  title={`${fmtNum(n)} مشاهدة`}
                  className="flex-1 rounded-t-[3px] bg-(--viz-1) transition-[height] duration-500 ease-(--ease-apple)"
                  style={{ height: `${Math.max(n ? 8 : 2, (n / maxMinute) * 100)}%`, opacity: n ? 1 : 0.25 }}
                />
              ))}
            </div>
            <div className="flex justify-between text-[11px] text-muted-foreground">
              <span>من ٣٠ دقيقة</span>
              <span>دلوقتي</span>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MiniList title="بيتفرجوا على" rows={pagesNow} empty="مفيش حد دلوقتي" />
        <MiniList title="دخلوا من" rows={entries} empty="—" />
        <MiniList title="المصدر" rows={sources} empty="—" />
        <MiniList title="المكان (تقريبي)" rows={places} empty="—" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
        <section className="apple-card overflow-hidden">
          <div className="px-5 pt-5 pb-3">
            <h2 className="text-[17px] font-semibold">الزيارات النشطة</h2>
            <p className="text-[13px] text-muted-foreground">المكان من عنوان الـ IP (تقريبي، والـ IP نفسه مش بيتخزن). الزائر رقم عشوائي مختصر.</p>
          </div>
          {data.sessions.length ? (
            <div className="overflow-x-auto pb-2">
              <table className="w-full min-w-[760px] text-[13px]">
                <thead>
                  <tr className="border-b-[0.5px] border-border text-right text-[12px] text-muted-foreground">
                    <th className="h-9 ps-5 font-medium">الصفحة الحالية</th>
                    <th className="font-medium">دخل من</th>
                    <th className="font-medium">المكان</th>
                    <th className="font-medium">الجهاز</th>
                    <th className="font-medium">المصدر</th>
                    <th className="pe-5 text-end font-medium">من</th>
                  </tr>
                </thead>
                <tbody>
                  {data.sessions.slice(0, 50).map((s) => (
                    <tr key={s.id} className="border-b-[0.5px] border-border/60 last:border-0">
                      <td className="h-11 max-w-56 truncate ps-5 font-medium" dir="auto">
                        {s.storeName && <span className="me-1 text-muted-foreground">{s.storeName} ·</span>}
                        {pathLabel(s.currentPath)}
                      </td>
                      <td className="max-w-40 truncate text-muted-foreground" dir="auto">
                        {pathLabel(s.entryPath)}
                      </td>
                      <td className="whitespace-nowrap">
                        {s.country ? `${flagOf(s.country)} ${countryName(s.country)}` : "—"}
                        {s.city && <span className="text-muted-foreground"> · {s.city}</span>}
                      </td>
                      <td className="whitespace-nowrap text-muted-foreground">
                        {deviceLabel(s.device)} · {s.browser ?? "—"} · {s.os ?? "—"}
                      </td>
                      <td className="whitespace-nowrap text-muted-foreground">
                        {channelLabel(s.channel)} · {s.source}
                      </td>
                      <td className="pe-5 text-end whitespace-nowrap tabular-nums text-muted-foreground">
                        {fmtSince(s.startedAt, now)} · {fmtNum(s.pageviews)} صفحة
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Unavailable icon={Users} title="مفيش زوار نشطين دلوقتي" description="الصفحة بتتحدث لوحدها أول ما حد يدخل." className="py-12" />
          )}
        </section>

        <section className="apple-card overflow-hidden">
          <div className="px-5 pt-5 pb-3">
            <h2 className="text-[17px] font-semibold">بيحصل دلوقتي</h2>
            <p className="text-[13px] text-muted-foreground">آخر ٣٠ دقيقة، الأحدث فوق</p>
          </div>
          {data.feed.length ? (
            <ol className="apple-rows max-h-[560px] overflow-y-auto pb-2 [--row-inset:20px]">
              {data.feed.map((item, i) => (
                <li key={`${item.at}-${i}`} className="flex items-start gap-3 px-5 py-2.5 text-[13px]">
                  <span
                    aria-hidden
                    className={cn("mt-1.5 size-2 shrink-0 rounded-full", item.kind === "page" ? "bg-(--viz-1)" : "bg-(--viz-2)")}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium">{item.kind === "page" ? "فتح صفحة" : eventLabel(item.name)}</span>
                    <span className="block truncate text-muted-foreground" dir="auto">
                      {item.storeName ? `${item.storeName} · ` : ""}
                      {pathLabel(item.path)}
                      {item.device ? ` · ${deviceLabel(item.device)}` : ""}
                      {item.country ? ` · ${flagOf(item.country)}` : ""}
                    </span>
                  </span>
                  <time className="shrink-0 text-[12px] text-muted-foreground tabular-nums" dateTime={item.at}>
                    {fmtTime(item.at)}
                  </time>
                </li>
              ))}
            </ol>
          ) : (
            <Unavailable icon={Radio} title="هادي" description="مفيش نشاط في آخر ٣٠ دقيقة." className="py-12" />
          )}
        </section>
      </div>
    </div>
  );
}

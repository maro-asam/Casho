import Link from "next/link";
import { CalendarClock, Gift, Megaphone, Plus, UserPlus } from "lucide-react";

import { StatusPill } from "@/components/saas-page";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { POPUP_TEMPLATES, POPUP_TYPE_META, triggerLabel, type PopupConfig, type PopupType } from "@/lib/popups/popup-config";
import { PanelHeader } from "../studio/studio-nav";
import { PopupActiveSwitch, PopupRowActions } from "./popup-row-actions";

export type PopupListRow = {
  id: string;
  name: string;
  type: PopupType;
  isActive: boolean;
  config: PopupConfig;
  startsAt: Date | null;
  endsAt: Date | null;
  views: number;
  clicks: number;
  conversions: number;
};

const nf = new Intl.NumberFormat("ar-EG");
const pf = new Intl.NumberFormat("ar-EG", { style: "percent", maximumFractionDigits: 1 });
const df = new Intl.DateTimeFormat("ar-EG", { timeZone: "Africa/Cairo", day: "numeric", month: "short" });
const TYPE_ICONS = { discount: Gift, lead: UserPlus, announcement: Megaphone } as const;

const editHref = (id: string) => `/customization?tab=popups&popup=${id}`;
const templateHref = (id: string) => `/customization?tab=popups&popup=new&template=${id}`;

function liveState(row: PopupListRow, now: Date) {
  if (!row.isActive) return { label: "متوقفة", tone: "neutral" as const };
  if (row.startsAt && row.startsAt > now) return { label: `تبدأ ${df.format(row.startsAt)}`, tone: "info" as const };
  if (row.endsAt && row.endsAt <= now) return { label: "انتهت", tone: "warning" as const };
  return { label: "شغّالة", tone: "success" as const };
}

/** Views → conversions, with the rate that matters. */
function Funnel({ row }: { row: PopupListRow }) {
  if (!row.views) return <span className="text-xs text-muted-foreground">لسه مفيش مشاهدات</span>;
  return (
    <div className="space-y-1">
      <div className="flex items-baseline gap-1.5 text-sm">
        <span className="font-semibold tabular-nums">{pf.format(row.conversions / row.views)}</span>
        <span className="text-xs text-muted-foreground">تحويل</span>
      </div>
      <p className="text-xs text-muted-foreground tabular-nums">
        {nf.format(row.views)} شافوها · {nf.format(row.conversions)} {row.type === "announcement" ? "ضغطوا" : row.type === "lead" ? "سجّلوا" : "أخدوا الكود"}
      </p>
    </div>
  );
}

export function PopupsPanel({ rows, storeId }: { rows: PopupListRow[]; storeId: string }) {
  const now = new Date();
  const topOrder = (id: string) => (rows[0]?.id === id ? null : [id, ...rows.map((r) => r.id).filter((x) => x !== id)]);
  const totals = rows.reduce((t, r) => ({ views: t.views + r.views, conversions: t.conversions + r.conversions }), { views: 0, conversions: 0 });

  return (
    <div className="space-y-5">
      <PanelHeader
        title="النوافذ المنبثقة"
        description="نافذة واحدة بس بتظهر للزائر في الزيارة، والأولوية للي فوق. مش هتظهر أبدًا وقت الدفع."
        actions={
          rows.length > 0 && (
            <Button asChild size="sm" className="gap-1.5">
              <Link href="/customization?tab=popups&popup=new" scroll={false}>
                <Plus className="size-4" />
                نافذة جديدة
              </Link>
            </Button>
          )
        }
      />

      {rows.length === 0 ? (
        <TemplateGallery />
      ) : (
        <>
          {totals.views > 0 && (
            <div className="grid grid-cols-3 divide-x divide-x-reverse divide-border rounded-xl border border-border bg-card">
              {[
                ["مشاهدات", nf.format(totals.views)],
                ["تحويلات", nf.format(totals.conversions)],
                ["معدل التحويل", pf.format(totals.conversions / totals.views)],
              ].map(([label, value]) => (
                <div key={label} className="px-4 py-3">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-lg font-semibold tabular-nums">{value}</p>
                </div>
              ))}
            </div>
          )}

          <section className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="h-10 ps-4 text-right text-xs font-medium text-muted-foreground">النافذة</TableHead>
                    <TableHead className="hidden h-10 text-right text-xs font-medium text-muted-foreground lg:table-cell">إمتى تظهر</TableHead>
                    <TableHead className="h-10 text-right text-xs font-medium text-muted-foreground">الأداء</TableHead>
                    <TableHead className="h-10 text-right text-xs font-medium text-muted-foreground">الحالة</TableHead>
                    <TableHead className="h-10 w-28 pe-4 text-left text-xs font-medium text-muted-foreground">تشغيل</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => {
                    const Icon = TYPE_ICONS[row.type];
                    const state = liveState(row, now);
                    return (
                      <TableRow key={row.id} className="relative">
                        <TableCell className="py-3 ps-4">
                          <div className="flex items-center gap-3">
                            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
                              <Icon className="size-4" />
                            </span>
                            <div className="min-w-0">
                              <Link
                                href={editHref(row.id)}
                                scroll={false}
                                className="block max-w-64 truncate text-sm font-medium after:absolute after:inset-0 hover:underline focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-inset focus-visible:after:ring-ring"
                              >
                                {row.name}
                              </Link>
                              <p className="max-w-64 truncate text-xs text-muted-foreground">
                                {POPUP_TYPE_META[row.type].label}
                                {row.config.content.couponCode && (
                                  <>
                                    {" · "}
                                    <span className="font-mono" dir="ltr">
                                      {row.config.content.couponCode}
                                    </span>
                                  </>
                                )}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden py-3 lg:table-cell">
                          <p className="text-sm">{triggerLabel(row.config.trigger)}</p>
                          {(row.startsAt || row.endsAt) && (
                            <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                              <CalendarClock className="size-3" />
                              {row.startsAt ? df.format(row.startsAt) : "الآن"} ← {row.endsAt ? df.format(row.endsAt) : "مفتوح"}
                            </p>
                          )}
                        </TableCell>
                        <TableCell className="py-3">
                          <Funnel row={row} />
                        </TableCell>
                        <TableCell className="py-3">
                          <StatusPill tone={state.tone}>{state.label}</StatusPill>
                        </TableCell>
                        <TableCell className="py-3 pe-4">
                          <div className="flex items-center justify-end gap-2">
                            <PopupActiveSwitch key={String(row.isActive)} popupId={row.id} storeId={storeId} name={row.name} isActive={row.isActive} />
                            <PopupRowActions popupId={row.id} storeId={storeId} name={row.name} editHref={editHref(row.id)} topOrder={topOrder(row.id)} />
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            <ul className="divide-y divide-border md:hidden">
              {rows.map((row) => {
                const state = liveState(row, now);
                return (
                  <li key={row.id} className="relative space-y-2 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link href={editHref(row.id)} scroll={false} className="block truncate text-sm font-medium after:absolute after:inset-0">
                          {row.name}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          {POPUP_TYPE_META[row.type].label} · {triggerLabel(row.config.trigger)}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <PopupActiveSwitch key={String(row.isActive)} popupId={row.id} storeId={storeId} name={row.name} isActive={row.isActive} />
                        <PopupRowActions popupId={row.id} storeId={storeId} name={row.name} editHref={editHref(row.id)} topOrder={topOrder(row.id)} />
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <StatusPill tone={state.tone}>{state.label}</StatusPill>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {row.views ? `${nf.format(row.views)} مشاهدة · ${pf.format(row.conversions / row.views)}` : "لسه مفيش مشاهدات"}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>

          <details className="group rounded-xl border border-dashed border-border">
            <summary className="flex cursor-pointer list-none items-center justify-between p-4 text-sm font-medium">
              ابدأ من قالب جاهز
              <Plus className="size-4 text-muted-foreground transition-transform group-open:rotate-45" />
            </summary>
            <div className="border-t border-dashed border-border p-4">
              <TemplateGrid />
            </div>
          </details>
        </>
      )}
    </div>
  );
}

function TemplateGallery() {
  return (
    <section className="rounded-xl border border-dashed border-border p-5">
      <div className="mb-4 space-y-1 text-center">
        <p className="font-semibold">اختار قالب وابدأ في دقيقة</p>
        <p className="text-sm text-muted-foreground">كل قالب متظبط على أفضل توقيت واستهداف لنوعه — عدّل الكلام بس.</p>
      </div>
      <TemplateGrid />
    </section>
  );
}

function TemplateGrid() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {POPUP_TEMPLATES.map((t) => {
        const Icon = TYPE_ICONS[t.type];
        return (
          <Link
            key={t.id}
            href={templateHref(t.id)}
            scroll={false}
            className="group flex flex-col gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-primary/[0.03]"
          >
            <div className="flex items-center justify-between">
              <span className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary">
                <Icon className="size-4" />
              </span>
              <StatusPill tone={POPUP_TYPE_META[t.type].tone}>{POPUP_TYPE_META[t.type].label}</StatusPill>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold">{t.name}</p>
              <p className="text-xs leading-5 text-muted-foreground">{t.description}</p>
            </div>
            <p className="mt-auto text-xs text-muted-foreground">{triggerLabel(t.config.trigger)}</p>
          </Link>
        );
      })}
    </div>
  );
}

"use client";

import Link from "next/link";
import { useMemo, useState, useSyncExternalStore, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { LeadPriority, LeadSource, LeadStatus } from "@prisma/client";
import { ArrowDown, ArrowUp, ChevronLeft, Columns3, MessageCircle, MoreHorizontal, UserPlus, X } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { appleButton, appleMenu, hrefWith, type SearchParamsRecord } from "@/components/saas-page";
import { bulkLeadStatusAction } from "@/actions/leads/admin-leads.actions";
import { LEAD_STATUSES, SOURCE_LABELS, STATUS_META } from "@/lib/leads/constants";
import { fmtDate, fmtWhen, whatsappLink } from "@/lib/sales/format";
import { cn } from "@/lib/utils";
import { AssignLeadsDialog, type RepOption } from "./admin-lead-actions";
import { formValues, SubmitRow, useLeadAction } from "./form-kit";
import { DueChip, LeadPriorityTag, LeadStatusTag } from "./lead-ui";
import { LostReasonFields } from "./lead-work-actions";

export type LeadTableRow = {
  id: string;
  businessName: string;
  ownerName: string | null;
  phone: string;
  whatsapp: string | null;
  category: string | null;
  city: string | null;
  source: LeadSource | null;
  status: LeadStatus;
  priority: LeadPriority;
  score: number;
  repName: string | null;
  repActive: boolean;
  lastContactedAt: Date | null;
  nextFollowUpAt: Date | null;
  createdAt: Date;
  archived: boolean;
};

const COLUMNS = [
  { key: "owner", label: "صاحب النشاط" },
  { key: "phone", label: "الموبايل" },
  { key: "category", label: "المجال" },
  { key: "city", label: "المدينة" },
  { key: "source", label: "المصدر" },
  { key: "status", label: "الحالة", sort: "status" },
  { key: "priority", label: "الأولوية", sort: "priority" },
  { key: "rep", label: "المندوب" },
  { key: "lastContact", label: "آخر تواصل", sort: "lastContactedAt" },
  { key: "nextFollowUp", label: "المتابعة الجاية", sort: "nextFollowUpAt" },
  { key: "created", label: "اتضاف", sort: "createdAt" },
] as const;
type ColumnKey = (typeof COLUMNS)[number]["key"];

const DEFAULT_HIDDEN: ColumnKey[] = ["owner", "source", "city", "created"];
const STORAGE_KEY = "casho-leads-columns-v1";

const columnListeners = new Set<() => void>();
function subscribeColumns(cb: () => void) {
  columnListeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    columnListeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}
function readColumns(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null; // private mode / blocked storage: defaults are fine
  }
}

/** Hidden columns, remembered per browser (a convenience — never required). */
function useColumns(mode: "admin" | "rep") {
  const key = `${STORAGE_KEY}:${mode}`;
  const fallback = mode === "rep" ? '["rep","source","created","city"]' : JSON.stringify(DEFAULT_HIDDEN);
  const raw = useSyncExternalStore(subscribeColumns, () => readColumns(key) ?? fallback, () => fallback);
  const hidden = useMemo<ColumnKey[]>(() => {
    try {
      const v = JSON.parse(raw) as unknown;
      return Array.isArray(v) ? (v.filter((k) => COLUMNS.some((c) => c.key === k)) as ColumnKey[]) : [];
    } catch {
      return [];
    }
  }, [raw]);
  function toggle(k: ColumnKey) {
    const next = hidden.includes(k) ? hidden.filter((x) => x !== k) : [...hidden, k];
    try {
      window.localStorage.setItem(key, JSON.stringify(next));
    } catch {
      // ignore
    }
    columnListeners.forEach((cb) => cb());
  }
  return { hidden, toggle };
}

function SortHeader({ label, sort, current, dir, basePath, searchParams }: { label: string; sort?: string; current: string; dir: "asc" | "desc"; basePath: string; searchParams?: SearchParamsRecord }) {
  if (!sort) return <>{label}</>;
  const active = current === sort;
  const nextDir = active && dir === "desc" ? "asc" : "desc";
  return (
    <Link
      href={hrefWith(basePath, searchParams, { sort, dir: nextDir })}
      className={cn("inline-flex items-center gap-1 hover:text-foreground", active && "text-foreground")}
      aria-label={`رتّب حسب ${label}`}
      scroll={false}
    >
      {label}
      {active && (dir === "desc" ? <ArrowDown className="size-3" /> : <ArrowUp className="size-3" />)}
    </Link>
  );
}

function BulkStatus({ ids, onDone }: { ids: string[]; onDone: () => void }) {
  const router = useRouter();
  const [lostOpen, setLostOpen] = useState(false);
  const [pending, start] = useTransition();
  const lost = useLeadAction(bulkLeadStatusAction, () => {
    setLostOpen(false);
    onDone();
  });
  function run(status: LeadStatus) {
    start(async () => {
      const res = await bulkLeadStatusAction({ leadIds: ids, status });
      if (res.success) {
        toast.success(res.message);
        onDone();
        router.refresh();
      } else toast.error(res.message);
    });
  }
  return (
    <>
      <DropdownMenu dir="rtl" modal={false}>
        <DropdownMenuTrigger asChild>
          <button type="button" disabled={pending} className={cn(appleButton.tinted, "h-9 bg-card text-primary")}>
            غيّر الحالة
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className={appleMenu}>
          {LEAD_STATUSES.filter((s) => s !== "CONVERTED").map((s) => (
            <DropdownMenuItem key={s} variant={s === "LOST" ? "destructive" : "default"} onSelect={() => (s === "LOST" ? setLostOpen(true) : run(s))}>
              {STATUS_META[s].label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <Dialog open={lostOpen} onOpenChange={setLostOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{`خسرنا ${ids.length} ليد؟`}</DialogTitle>
            <DialogDescription>نفس السبب بيتسجل على كلهم، والمتابعات المفتوحة بتتلغي.</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={(e) => lost.submit({ ...formValues(e), leadIds: ids, status: "LOST" })}>
            <LostReasonFields errors={lost.errors} />
            <SubmitRow pending={lost.pending} label="سجّل الخسارة" destructive />
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function LeadsTable({
  rows,
  mode,
  reps = [],
  detailBase,
  basePath,
  searchParams,
  sort,
  dir,
  now,
}: {
  rows: LeadTableRow[];
  mode: "admin" | "rep";
  reps?: RepOption[];
  detailBase: string;
  basePath: string;
  searchParams?: SearchParamsRecord;
  sort: string;
  dir: "asc" | "desc";
  now: Date;
}) {
  const { hidden, toggle } = useColumns(mode);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignFor, setAssignFor] = useState<string[] | null>(null);
  const visible = useMemo(() => COLUMNS.filter((c) => !hidden.includes(c.key)), [hidden]);
  const selectable = mode === "admin";
  const allSelected = rows.length > 0 && rows.every((r) => selected.has(r.id));
  const ids = [...selected];

  // A new page / filter clears the selection (it only ever holds rows on screen).
  const rowKey = rows.map((r) => r.id).join(",");
  const [selectionFor, setSelectionFor] = useState(rowKey);
  if (selectionFor !== rowKey) {
    setSelectionFor(rowKey);
    setSelected(new Set());
  }

  const show = (k: ColumnKey) => !hidden.includes(k);
  const greeting = (r: LeadTableRow) => `أهلًا${r.ownerName ? ` ${r.ownerName.split(/\s+/)[0]}` : ""}، معاك فريق كاشو.`;

  return (
    <div>
      <div className="flex min-h-12 flex-wrap items-center justify-between gap-2 border-t-[0.5px] border-border px-4 py-2">
        {selectable && selected.size > 0 ? (
          <div className="flex flex-wrap items-center gap-2" role="toolbar" aria-label="إجراءات على المحدد">
            <span className="text-[14px] font-semibold tabular-nums">{new Intl.NumberFormat("ar-EG").format(selected.size)} محدد</span>
            <button type="button" onClick={() => setAssignOpen(true)} className={cn(appleButton.tinted, "h-9 bg-card text-primary")}>
              <UserPlus className="size-4" />
              اسند
            </button>
            <BulkStatus ids={ids} onDone={() => setSelected(new Set())} />
            <button type="button" onClick={() => setSelected(new Set())} className={appleButton.plain}>
              <X className="size-4" />
              إلغاء التحديد
            </button>
          </div>
        ) : (
          <span className="text-[13px] text-muted-foreground">{selectable ? "حدّد ليدز عشان تسندهم أو تغير حالتهم مرة واحدة" : ""}</span>
        )}
        <DropdownMenu dir="rtl" modal={false}>
          <DropdownMenuTrigger asChild>
            <button type="button" className={cn(appleButton.plain, "hidden md:inline-flex")}>
              <Columns3 className="size-4" />
              الأعمدة
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52 rounded-xl p-1.5">
            <DropdownMenuLabel className="text-[12px] text-muted-foreground">الأعمدة الظاهرة</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {COLUMNS.map((c) => (
              <DropdownMenuCheckboxItem key={c.key} checked={show(c.key)} onCheckedChange={() => toggle(c.key)} onSelect={(e) => e.preventDefault()}>
                {c.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Desktop: table */}
      <div className="relative hidden overflow-x-auto md:block">
        <table className="w-full min-w-[56rem] text-[14px]">
          <thead>
            <tr className="border-y-[0.5px] border-border text-start text-[12px] font-medium text-muted-foreground">
              {selectable && (
                <th className="w-10 ps-4">
                  <input
                    type="checkbox"
                    aria-label="حدد الكل"
                    checked={allSelected}
                    onChange={(e) => setSelected(e.target.checked ? new Set(rows.map((r) => r.id)) : new Set())}
                    className="size-4 accent-(--primary)"
                  />
                </th>
              )}
              <th className="h-10 px-3 text-start font-medium">
                <SortHeader label="النشاط" sort="businessName" current={sort} dir={dir} basePath={basePath} searchParams={searchParams} />
              </th>
              {visible.map((c) => (
                <th key={c.key} className="h-10 px-3 text-start font-medium whitespace-nowrap">
                  <SortHeader label={c.label} sort={"sort" in c ? c.sort : undefined} current={sort} dir={dir} basePath={basePath} searchParams={searchParams} />
                </th>
              ))}
              <th className="w-12 pe-4">
                <span className="sr-only">إجراءات</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className={cn("border-b-[0.5px] border-border last:border-0 hover:bg-(--fill-3)/50", selected.has(r.id) && "bg-primary/5")}>
                {selectable && (
                  <td className="ps-4">
                    <input
                      type="checkbox"
                      aria-label={`حدد ${r.businessName}`}
                      checked={selected.has(r.id)}
                      onChange={(e) =>
                        setSelected((cur) => {
                          const next = new Set(cur);
                          if (e.target.checked) next.add(r.id);
                          else next.delete(r.id);
                          return next;
                        })
                      }
                      className="size-4 accent-(--primary)"
                    />
                  </td>
                )}
                <td className="max-w-[16rem] px-3 py-2.5">
                  <Link href={`${detailBase}/${r.id}`} className="block truncate font-semibold hover:text-primary">
                    {r.businessName}
                  </Link>
                  {(!show("owner") && r.ownerName) || r.archived ? (
                    <span className="block truncate text-[12px] text-muted-foreground">{[!show("owner") ? r.ownerName : null, r.archived ? "في الأرشيف" : null].filter(Boolean).join(" · ")}</span>
                  ) : null}
                </td>
                {show("owner") && <td className="max-w-[10rem] truncate px-3 py-2.5 text-foreground/85">{r.ownerName ?? "—"}</td>}
                {show("phone") && (
                  <td className="px-3 py-2.5 tabular-nums" dir="ltr">
                    <a href={`tel:${r.phone}`} className="hover:text-primary">
                      {r.phone}
                    </a>
                  </td>
                )}
                {show("category") && <td className="max-w-[9rem] truncate px-3 py-2.5 text-foreground/85">{r.category ?? "—"}</td>}
                {show("city") && <td className="px-3 py-2.5 text-foreground/85">{r.city ?? "—"}</td>}
                {show("source") && <td className="px-3 py-2.5 text-foreground/85">{r.source ? SOURCE_LABELS[r.source] : "—"}</td>}
                {show("status") && (
                  <td className="px-3 py-2.5">
                    <LeadStatusTag status={r.status} quiet />
                  </td>
                )}
                {show("priority") && (
                  <td className="px-3 py-2.5">
                    <LeadPriorityTag priority={r.priority} score={r.score} />
                  </td>
                )}
                {show("rep") && (
                  <td className={cn("max-w-[10rem] truncate px-3 py-2.5", !r.repName && "text-muted-foreground", r.repName && !r.repActive && "text-(--sys-orange)")}>{r.repName ?? "مش متسند"}</td>
                )}
                {show("lastContact") && <td className="px-3 py-2.5 whitespace-nowrap text-[13px] text-muted-foreground">{r.lastContactedAt ? fmtWhen(r.lastContactedAt, now) : "لسه"}</td>}
                {show("nextFollowUp") && (
                  <td className="px-3 py-2.5">
                    <DueChip at={r.nextFollowUpAt} now={now} label={r.nextFollowUpAt ? fmtWhen(r.nextFollowUpAt, now) : null} />
                  </td>
                )}
                {show("created") && <td className="px-3 py-2.5 whitespace-nowrap text-[13px] text-muted-foreground">{fmtDate(r.createdAt)}</td>}
                <td className="pe-4">
                  <DropdownMenu dir="rtl" modal={false}>
                    <DropdownMenuTrigger asChild>
                      <button type="button" aria-label={`خيارات ${r.businessName}`} className={cn(appleButton.more, "size-8")}>
                        <MoreHorizontal className="size-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className={appleMenu}>
                      <DropdownMenuItem asChild>
                        <Link href={`${detailBase}/${r.id}`}>
                          <ChevronLeft />
                          افتح الليد
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <a href={whatsappLink(r.whatsapp || r.phone, greeting(r))} target="_blank" rel="noreferrer">
                          <MessageCircle />
                          واتساب
                        </a>
                      </DropdownMenuItem>
                      {mode === "admin" && (
                        <DropdownMenuItem onSelect={() => setAssignFor([r.id])}>
                          <UserPlus />
                          {r.repName ? "انقل لمندوب تاني" : "اسند لمندوب"}
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Phones: a list */}
      <ul className="apple-rows md:hidden">
        {rows.map((r) => (
          <li key={r.id} className="flex items-center gap-3 px-4 py-3">
            {selectable && (
              <input
                type="checkbox"
                aria-label={`حدد ${r.businessName}`}
                checked={selected.has(r.id)}
                onChange={(e) =>
                  setSelected((cur) => {
                    const next = new Set(cur);
                    if (e.target.checked) next.add(r.id);
                    else next.delete(r.id);
                    return next;
                  })
                }
                className="size-5 shrink-0 accent-(--primary)"
              />
            )}
            <Link href={`${detailBase}/${r.id}`} className="min-w-0 flex-1 space-y-1">
              <p className="truncate text-[15px] font-semibold">{r.businessName}</p>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <LeadStatusTag status={r.status} quiet />
                <LeadPriorityTag priority={r.priority} />
              </div>
              <p className="truncate text-[12px] text-muted-foreground">
                {[mode === "admin" ? (r.repName ?? "مش متسند") : r.ownerName, r.nextFollowUpAt ? `متابعة ${fmtWhen(r.nextFollowUpAt, now)}` : null].filter(Boolean).join(" · ")}
              </p>
            </Link>
            <ChevronLeft className="size-4 shrink-0 text-(--label-3)" />
          </li>
        ))}
      </ul>

      {mode === "admin" && (
        <>
          <AssignLeadsDialog leadIds={ids} reps={reps} trigger="none" open={assignOpen} onOpenChange={setAssignOpen} onDone={() => setSelected(new Set())} />
          {assignFor && (
            <AssignLeadsDialog
              leadIds={assignFor}
              reps={reps}
              trigger="none"
              open
              onOpenChange={(o) => !o && setAssignFor(null)}
              onDone={() => setAssignFor(null)}
            />
          )}
        </>
      )}
    </div>
  );
}

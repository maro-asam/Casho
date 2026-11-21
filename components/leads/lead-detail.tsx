import type { ReactNode } from "react";
import type { LeadActivityType, LeadStatus } from "@prisma/client";
import {
  ArrowLeftRight,
  CalendarCheck,
  CalendarClock,
  CalendarPlus,
  CalendarX,
  Check,
  CircleDot,
  Flag,
  Globe,
  AtSign,
  Link2,
  Mail,
  MessageCircle,
  NotebookPen,
  Pencil,
  Phone,
  Presentation,
  RotateCcw,
  Sparkles,
  Trash2,
  Trophy,
  Upload,
  UserMinus,
  UserPlus,
  Users,
  Archive,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { Fields } from "@/app/admin/_components/admin-ui";
import { Card, StatusText, Tag, appleButton } from "@/components/saas-page";
import {
  ACTIVITY_LABELS,
  ACTOR_ROLE_LABELS,
  FOLLOW_UP_STATUS_META,
  LINK_SOURCE_LABELS,
  PRIORITY_META,
  SIZE_LABELS,
  SOURCE_LABELS,
  STATUS_META,
  lostReasonLabel,
} from "@/lib/leads/constants";
import { socialUrl } from "@/lib/leads/normalize";
import type { LeadDetail as Detail } from "@/lib/leads/queries";
import { repLabel } from "@/lib/leads/queries";
import { FIELD_LABELS } from "@/lib/leads/service";
import { fmtDate, fmtDateTime, fmtWhen, whatsappLink } from "@/lib/sales/format";
import { cn } from "@/lib/utils";
import { DueChip, LeadPriorityTag, LeadStatusTag, ScoreMeter } from "./lead-ui";
import { CompleteFollowUpDialog, FollowUpMenu, InteractionBar, ScheduleFollowUpDialog, StatusChanger } from "./lead-work-actions";

const ICONS: Record<LeadActivityType, LucideIcon> = {
  CREATED: Sparkles,
  IMPORTED: Upload,
  UPDATED: Pencil,
  ASSIGNED: UserPlus,
  REASSIGNED: ArrowLeftRight,
  UNASSIGNED: UserMinus,
  STATUS_CHANGED: CircleDot,
  PRIORITY_CHANGED: Flag,
  CALL: Phone,
  WHATSAPP: MessageCircle,
  EMAIL: Mail,
  MEETING: Users,
  DEMO: Presentation,
  NOTE: NotebookPen,
  FOLLOW_UP_SCHEDULED: CalendarPlus,
  FOLLOW_UP_COMPLETED: CalendarCheck,
  FOLLOW_UP_RESCHEDULED: CalendarClock,
  FOLLOW_UP_CANCELED: CalendarX,
  LINKED: Link2,
  UNLINKED: Link2,
  CONVERTED: Trophy,
  LOST: XCircle,
  REOPENED: RotateCcw,
  ARCHIVED: Archive,
  RESTORED: RotateCcw,
  DELETED: Trash2,
};

const TONE: Partial<Record<LeadActivityType, string>> = {
  CONVERTED: "bg-(--sys-green)/14 text-(--sys-green)",
  LINKED: "bg-(--sys-green)/14 text-(--sys-green)",
  LOST: "bg-(--sys-red)/12 text-(--sys-red)",
  DELETED: "bg-(--sys-red)/12 text-(--sys-red)",
  CALL: "bg-primary/10 text-primary",
  WHATSAPP: "bg-(--sys-green)/14 text-(--sys-green)",
  EMAIL: "bg-primary/10 text-primary",
  MEETING: "bg-(--sys-indigo)/12 text-(--sys-indigo)",
  DEMO: "bg-(--sys-indigo)/12 text-(--sys-indigo)",
};

const isStatus = (v: string | null): v is LeadStatus => !!v && v in STATUS_META;
const isIso = (v: string | null) => !!v && /^\d{4}-\d{2}-\d{2}T/.test(v);

function valueLabel(v: string | null): string | null {
  if (!v) return null;
  if (isStatus(v)) return STATUS_META[v].label;
  if (v === "AUTO") return "تلقائي";
  if (v in PRIORITY_META) return PRIORITY_META[v as keyof typeof PRIORITY_META].label;
  if (isIso(v)) return fmtDateTime(new Date(v));
  return v;
}

/** UPDATED entries store the changed fields as JSON: show "field: before → after". */
function changeLines(prev: string | null, next: string | null): { field: string; from: string; to: string }[] | null {
  try {
    const a = prev ? (JSON.parse(prev) as Record<string, unknown>) : {};
    const b = next ? (JSON.parse(next) as Record<string, unknown>) : {};
    const keys = [...new Set([...Object.keys(a), ...Object.keys(b)])].filter((k) => k !== "normalizedWhatsapp");
    const show = (v: unknown, k: string) =>
      v == null || v === "" ? "—" : k === "businessSize" ? (SIZE_LABELS[v as keyof typeof SIZE_LABELS] ?? String(v)) : k === "source" ? (SOURCE_LABELS[v as keyof typeof SOURCE_LABELS] ?? String(v)) : String(v);
    return keys.map((k) => ({ field: FIELD_LABELS[k] ?? k, from: show(a[k], k), to: show(b[k], k) }));
  } catch {
    return null;
  }
}

function Timeline({ detail }: { detail: Detail }) {
  const { activities, people } = detail;
  if (activities.length === 0) return <p className="px-5 pb-5 text-[15px] text-muted-foreground">لسه مفيش حاجة اتسجلت.</p>;
  return (
    <ol className="relative px-5 pb-5">
      {activities.map((a, i) => {
        const Icon = ICONS[a.type];
        const lines = a.type === "UPDATED" ? changeLines(a.previousValue, a.newValue) : null;
        const prev = a.type === "UPDATED" ? null : valueLabel(a.previousValue);
        const next = a.type === "UPDATED" ? null : valueLabel(a.newValue);
        const who = a.actorRole === "SYSTEM" ? "النظام" : `${people.get(a.actorUserId ?? "") ?? "—"} · ${ACTOR_ROLE_LABELS[a.actorRole] ?? a.actorRole}`;
        return (
          <li key={a.id} className="relative flex gap-3 pb-5 last:pb-0">
            {i < activities.length - 1 && <span aria-hidden className="absolute start-[15px] top-9 bottom-0 w-px bg-border" />}
            <span className={cn("relative z-10 grid size-8 shrink-0 place-items-center rounded-full", TONE[a.type] ?? "bg-(--fill-3) text-foreground/70")}>
              <Icon className="size-4" strokeWidth={2} />
            </span>
            <div className="min-w-0 flex-1 space-y-1 pt-1">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                <p className="text-[15px] font-semibold">
                  {ACTIVITY_LABELS[a.type]}
                  {a.reached === true && <span className="ms-2 text-[13px] font-normal text-(--sys-green)">ردّ</span>}
                  {a.reached === false && <span className="ms-2 text-[13px] font-normal text-muted-foreground">مردّش</span>}
                </p>
                <time dateTime={a.createdAt.toISOString()} className="text-[12px] tabular-nums text-muted-foreground" title={fmtDateTime(a.createdAt)}>
                  {fmtDateTime(a.createdAt)}
                </time>
              </div>
              {(prev || next) && (
                <p className="text-[13px] text-foreground/80">
                  {prev && <span className="text-muted-foreground line-through decoration-1">{prev}</span>}
                  {prev && next && <span className="mx-1.5 text-muted-foreground">←</span>}
                  {next && <span className="font-medium">{next}</span>}
                </p>
              )}
              {lines && lines.length > 0 && (
                <ul className="space-y-0.5 text-[13px]">
                  {lines.map((l) => (
                    <li key={l.field} className="wrap-break-word">
                      <span className="text-muted-foreground">{l.field}: </span>
                      <span className="text-muted-foreground line-through decoration-1">{l.from}</span>
                      <span className="mx-1 text-muted-foreground">←</span>
                      <span>{l.to}</span>
                    </li>
                  ))}
                </ul>
              )}
              {a.description && a.type !== "UPDATED" && <p className="whitespace-pre-line wrap-break-word text-[14px] leading-[20px] text-foreground/85">{a.description}</p>}
              {a.type === "UPDATED" && !lines?.length && a.description && <p className="text-[13px] text-muted-foreground">{a.description}</p>}
              <p className="text-[12px] text-muted-foreground">{who}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function FollowUps({ detail, now, canWork }: { detail: Detail; now: Date; canWork: boolean }) {
  const { followUps, people } = detail;
  if (followUps.length === 0) return <p className="px-5 pb-5 text-[15px] text-muted-foreground">مفيش متابعات. حدّد ميعاد عشان الليد ميتنساش.</p>;
  return (
    <ul className="apple-rows px-5 pb-3 [--row-inset:0px]">
      {followUps.map((f) => {
        const meta = FOLLOW_UP_STATUS_META[f.status];
        return (
          <li key={f.id} className="flex items-start gap-3 py-3">
            <div className="min-w-0 flex-1 space-y-0.5">
              <div className="flex flex-wrap items-center gap-2">
                {f.status === "PENDING" ? <DueChip at={f.dueAt} now={now} label={`${fmtDateTime(f.dueAt)} · ${fmtWhen(f.dueAt, now)}`} /> : <span className="text-[13px] tabular-nums text-muted-foreground">{fmtDateTime(f.dueAt)}</span>}
                <StatusText tone={meta.tone}>{meta.label}</StatusText>
              </div>
              {f.note && <p className="whitespace-pre-line text-[14px] text-foreground/85">{f.note}</p>}
              {f.outcome && (
                <p className="text-[13px] text-muted-foreground">
                  {f.status === "DONE" ? "النتيجة: " : "السبب: "}
                  {f.outcome}
                </p>
              )}
              <p className="text-[12px] text-muted-foreground">
                {f.salesRep ? `المندوب: ${repLabel(f.salesRep)}` : "متابعة الإدارة"}
                {f.closedAt && ` · اتقفلت ${fmtDateTime(f.closedAt)}${f.closedById ? ` بواسطة ${people.get(f.closedById) ?? "—"}` : ""}`}
              </p>
            </div>
            {canWork && f.status === "PENDING" && (
              <div className="flex shrink-0 items-center gap-1.5">
                <CompleteFollowUpDialog followUpId={f.id} compact />
                <FollowUpMenu followUpId={f.id} dueAt={f.dueAt} />
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function ContactButtons({ lead, greeting }: { lead: Detail["lead"]; greeting: string }) {
  const wa = lead.whatsapp || lead.phone;
  return (
    <div className="flex flex-wrap gap-2">
      <a href={`tel:${lead.phone}`} className={cn(appleButton.tinted, "gap-1.5")}>
        <Phone className="size-4 text-primary" />
        اتصل
      </a>
      <a
        href={whatsappLink(wa, greeting)}
        target="_blank"
        rel="noreferrer"
        className={cn(appleButton.tinted, "gap-1.5 bg-(--sys-green)/12 text-(--sys-green) hover:bg-(--sys-green)/18")}
      >
        <MessageCircle className="size-4" />
        واتساب
      </a>
      {lead.email && (
        <a href={`mailto:${lead.email}`} className={cn(appleButton.tinted, "gap-1.5")}>
          <Mail className="size-4 text-primary" />
          إيميل
        </a>
      )}
    </div>
  );
}

export function LeadDetailView({
  detail,
  viewer,
  now,
  statusTargets,
  canWork,
  greeting,
  headerActions,
  adminPanels,
  sideTop,
}: {
  detail: Detail;
  viewer: "admin" | "rep";
  now: Date;
  /** Statuses this viewer may set (from lib/leads/workflow). */
  statusTargets: LeadStatus[];
  canWork: boolean;
  greeting: string;
  headerActions?: ReactNode;
  /** Admin-only cards under the timeline (assignment history, matches…). */
  adminPanels?: ReactNode;
  /** Admin-only card on top of the side column (conversion / link). */
  sideTop?: ReactNode;
}) {
  const { lead, score, firstCharge } = detail;
  const repName = repLabel(lead.assignedRep);
  const flags = [
    lead.archivedAt && { label: "في الأرشيف", tone: "neutral" as const },
    lead.deletedAt && { label: "ممسوح", tone: "danger" as const },
    lead.assignedRep?.status === "DISABLED" && { label: "المندوب موقوف — محتاج إسناد", tone: "warning" as const },
  ].filter(Boolean) as { label: string; tone: "neutral" | "danger" | "warning" }[];

  return (
    <div className="space-y-4">
      {/* Header */}
      <section className="apple-card space-y-4 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <LeadStatusTag status={lead.status} />
              <LeadPriorityTag priority={lead.priority} />
              {flags.map((f) => (
                <Tag key={f.label} tone={f.tone}>
                  {f.label}
                </Tag>
              ))}
            </div>
            <h1 className="text-[28px] leading-[34px] font-bold wrap-break-word">{lead.businessName}</h1>
            <p className="text-[15px] text-muted-foreground">
              {[lead.ownerName, lead.category, lead.city].filter(Boolean).join(" · ") || "—"}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {canWork && <StatusChanger leadId={lead.id} current={lead.status} targets={statusTargets} />}
            {canWork && <ScheduleFollowUpDialog leadId={lead.id} />}
            {headerActions}
          </div>
        </div>
        <ContactButtons lead={lead} greeting={greeting} />
        {lead.status === "LOST" && (
          <p className="rounded-[12px] bg-(--sys-red)/8 px-3.5 py-2.5 text-[14px]">
            <span className="font-semibold">سبب الخسارة: </span>
            {lostReasonLabel(lead.lostReason, lead.lostNote)}
            {lead.lostAt && <span className="text-muted-foreground"> · {fmtDate(lead.lostAt)}</span>}
          </p>
        )}
      </section>

      {canWork && (
        <section className="apple-card space-y-2 p-5">
          <h2 className="text-[13px] font-semibold text-muted-foreground">سجّل تواصل</h2>
          <InteractionBar leadId={lead.id} />
        </section>
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
        <div className="min-w-0 space-y-4">
          <Card title="المتابعات" subtitle={lead.nextFollowUpAt ? `الجاية ${fmtWhen(lead.nextFollowUpAt, now)}` : "مفيش متابعة جاية"} action={canWork ? <ScheduleFollowUpDialog leadId={lead.id} trigger="plain" /> : undefined}>
            <FollowUps detail={detail} now={now} canWork={canWork} />
          </Card>
          <Card title="التاريخ" subtitle="كل اللي حصل مع الليد، الأحدث الأول">
            <Timeline detail={detail} />
          </Card>
          {adminPanels}
        </div>

        <div className="min-w-0 space-y-4">
          {sideTop}
          <Card title="التقييم" subtitle={`${score.earned} من ${score.max} نقطة — كل نقطة ليها سبب`}>
            <div className="space-y-3 px-5 pb-5">
              <ScoreMeter score={score.score} />
              <ul className="space-y-1.5 text-[14px]">
                {score.criteria.map((c) => (
                  <li key={c.key} className="flex items-center justify-between gap-3">
                    <span className={cn("flex items-center gap-2", !c.met && "text-muted-foreground")}>
                      {c.met ? <Check className="size-4 text-(--sys-green)" strokeWidth={2.4} /> : <span className="size-4 rounded-full border border-border" aria-hidden />}
                      {c.label}
                    </span>
                    <span className={cn("tabular-nums", c.met ? "font-medium" : "text-muted-foreground")}>+{c.points}</span>
                  </li>
                ))}
              </ul>
              <p className="text-[12px] text-muted-foreground">
                {lead.priorityLocked ? `الأولوية «${PRIORITY_META[lead.priority].label}» متحددة يدويًا.` : "الأولوية بتتحدد من التقييم: ٢٥+ متوسط، ٥٠+ عالي، ٧٥+ ساخن."}
              </p>
            </div>
          </Card>

          <Card title="المبيعات">
            <div className="px-5 pb-5">
              <Fields
                rows={[
                  { label: "المندوب", value: repName ?? "مش متسند" },
                  { label: "اتسند", value: lead.assignedAt ? fmtDate(lead.assignedAt) : "—" },
                  { label: "آخر تواصل", value: lead.lastContactedAt ? fmtWhen(lead.lastContactedAt, now) : "لسه" },
                  { label: "المتابعة الجاية", value: lead.nextFollowUpAt ? <DueChip at={lead.nextFollowUpAt} now={now} label={fmtDateTime(lead.nextFollowUpAt)} /> : "—" },
                  { label: "في المرحلة من", value: fmtDate(lead.statusChangedAt) },
                ]}
              />
            </div>
          </Card>

          <Card title="بيانات التواصل">
            <div className="px-5 pb-5">
              <Fields
                rows={[
                  { label: "الموبايل", value: lead.phone, ltr: true },
                  { label: "واتساب", value: lead.whatsapp, ltr: true },
                  { label: "الإيميل", value: lead.email, ltr: true },
                  {
                    label: "إنستجرام",
                    value: lead.instagram ? (
                      <a href={socialUrl("instagram", lead.instagram)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary" dir="ltr">
                        <AtSign className="size-3.5" />
                        {lead.instagram}
                      </a>
                    ) : null,
                  },
                  {
                    label: "فيسبوك",
                    value: lead.facebook ? (
                      <a href={socialUrl("facebook", lead.facebook)} target="_blank" rel="noreferrer" className="text-primary" dir="ltr">
                        {lead.facebook}
                      </a>
                    ) : null,
                  },
                  {
                    label: "الموقع",
                    value: lead.website ? (
                      <a href={lead.website} target="_blank" rel="noreferrer nofollow" className="inline-flex items-center gap-1 text-primary" dir="ltr">
                        <Globe className="size-3.5" />
                        {lead.website.replace(/^https?:\/\//, "")}
                      </a>
                    ) : null,
                  },
                ]}
              />
            </div>
          </Card>

          <Card title="النشاط">
            <div className="px-5 pb-5">
              <Fields
                rows={[
                  { label: "صاحب النشاط", value: lead.ownerName },
                  { label: "المجال", value: lead.category },
                  { label: "المدينة", value: lead.city },
                  { label: "الحجم", value: lead.businessSize ? SIZE_LABELS[lead.businessSize] : null },
                  { label: "المصدر", value: lead.source ? SOURCE_LABELS[lead.source] : null },
                  { label: "تفاصيل المصدر", value: lead.sourceDetails },
                  { label: "اتضاف", value: fmtDate(lead.createdAt) },
                  ...(viewer === "admin" && lead.import ? [{ label: "من ملف", value: lead.import.fileName }] : []),
                ]}
              />
              {lead.notes && (
                <div className="mt-3 rounded-[12px] bg-(--fill-3) px-3.5 py-2.5">
                  <p className="text-[12px] font-semibold text-muted-foreground">ملاحظات أول ما اتضاف</p>
                  <p className="whitespace-pre-line text-[14px]">{lead.notes}</p>
                </div>
              )}
            </div>
          </Card>

          {viewer === "rep" && lead.convertedAt && (
            <Card title="اتحوّل لعميل" icon={Trophy}>
              <div className="px-5 pb-5">
                <Fields
                  rows={[
                    { label: "المتجر", value: lead.customerStore?.name },
                    { label: "أول اشتراك", value: fmtDate(lead.convertedAt) },
                    { label: "طريقة الربط", value: lead.linkSource ? LINK_SOURCE_LABELS[lead.linkSource] : null },
                  ]}
                />
                {firstCharge && <p className="mt-2 text-[12px] text-muted-foreground">العمولات بتتحسب من رابط الإحالة زي العادي — مش من الليد.</p>}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

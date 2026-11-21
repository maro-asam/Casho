import Link from "next/link";
import { AlarmClock, CalendarCheck, CircleCheckBig, Contact, Handshake, Inbox, Percent, Sparkles, Target, UserCheck, Users, XCircle } from "lucide-react";
import { requireAdminPage } from "@/lib/admin/page-guard";
import { assertLeadAdmin } from "@/lib/leads/access";
import { KpiStrip, Panel, PanelEmpty, th, theadRow } from "@/app/admin/_components/admin-ui";
import { Segmented, Unavailable, appleButton, readParam, type SearchParamsRecord } from "@/components/saas-page";
import { LEAD_STATUSES, SOURCE_LABELS, STATUS_META } from "@/lib/leads/constants";
import { getLeadOverview, getLeadTrend, getRepLeadPerformance, type OverviewRange } from "@/lib/leads/queries";
import { fmtNum, fmtPct } from "@/lib/sales/format";
import { cn } from "@/lib/utils";
import { LeadTrend } from "./_components/lead-trend";

const RANGES: Record<OverviewRange, string> = { "30d": "٣٠ يوم", "90d": "٩٠ يوم", "12m": "١٢ شهر" };

/** Ranked bars with the value written next to each — the label carries the number, the bar is a glance. */
function BarList({ rows, href }: { rows: { key: string; label: string; count: number }[]; href: (key: string) => string | null }) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <ul className="space-y-2.5">
      {rows.map((r) => {
        const link = href(r.key);
        const body = (
          <>
            <div className="flex items-baseline justify-between gap-3 text-[14px]">
              <span className="truncate">{r.label}</span>
              <span className="shrink-0 tabular-nums text-muted-foreground">{fmtNum(r.count)}</span>
            </div>
            <div className="mt-1 h-1.5 rounded-full bg-(--fill-3)" aria-hidden>
              <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(2, (100 * r.count) / max)}%` }} />
            </div>
          </>
        );
        return (
          <li key={r.key || "none"} title={`${r.label}: ${fmtNum(r.count)}`}>
            {link ? (
              <Link href={link} className="block rounded-lg hover:opacity-80">
                {body}
              </Link>
            ) : (
              body
            )}
          </li>
        );
      })}
    </ul>
  );
}

export default async function LeadsOverviewPage({ searchParams }: { searchParams?: Promise<SearchParamsRecord> }) {
  assertLeadAdmin(await requireAdminPage());
  const params = await searchParams;
  const raw = readParam(params, "range");
  const range: OverviewRange = raw === "90d" || raw === "12m" ? raw : "30d";
  const now = new Date();

  const [o, trend, reps] = await Promise.all([getLeadOverview(now), getLeadTrend(range, now), getRepLeadPerformance(now)]);

  if (o.total === 0) {
    return (
      <div className="apple-card">
        <Unavailable
          icon={Inbox}
          title="مفيش ليدز لسه"
          description="ضيف أول ليد بإيدك، أو ارفع ملف Excel / CSV فيه قايمة التجار اللي عايز فريق المبيعات يكلمهم."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Link href="/admin/leads/new" className={appleButton.filled}>
                ليد جديد
              </Link>
              <Link href="/admin/leads/imports" className={appleButton.tinted}>
                استيراد من ملف
              </Link>
            </div>
          }
        />
      </div>
    );
  }

  const list = (q: string) => `/admin/leads/list?${q}`;
  const statusRows = LEAD_STATUSES.map((s) => ({ key: s, label: STATUS_META[s].label, count: o.status[s] }));

  return (
    <div className="space-y-6">
      <KpiStrip
        items={[
          { label: "كل الليدز", value: fmtNum(o.total), hint: `${fmtNum(o.newThisWeek)} اتضافوا آخر ٧ أيام`, icon: Users, href: "/admin/leads/list" },
          { label: "اتحوّلوا لعملاء", value: fmtNum(o.status.CONVERTED), hint: "دفعوا أول اشتراك", icon: CircleCheckBig, href: list("status=CONVERTED") },
          {
            label: "نسبة التحويل",
            value: fmtPct(o.conversionRate),
            hint: o.winRate === null ? "من كل الليدز" : `من كل الليدز · ${fmtPct(o.winRate)} من اللي اتحسموا`,
            icon: Percent,
          },
          { label: "متابعات متأخرة", value: fmtNum(o.overdue), hint: `${fmtNum(o.dueToday)} النهارده`, icon: AlarmClock, href: "/admin/leads/follow-ups?bucket=overdue" },
        ]}
      />
      <KpiStrip
        items={[
          { label: "جديد", value: fmtNum(o.status.NEW), hint: "محدش استلمه", icon: Sparkles, href: list("status=NEW") },
          { label: "متسند لمندوب", value: fmtNum(o.assigned), hint: `${fmtNum(o.status.ASSIGNED)} لسه متكلموش`, icon: UserCheck, href: list("status=ASSIGNED") },
          { label: "في تواصل", value: fmtNum(o.contacted), hint: `${fmtNum(o.status.INTERESTED)} مهتمين · ${fmtNum(o.status.DEMO_SCHEDULED)} ديمو`, icon: Contact, href: list("status=CONTACTED") },
          { label: "خسرناهم", value: fmtNum(o.status.LOST), hint: "بسبب متسجل", icon: XCircle, href: list("status=LOST") },
        ]}
      />

      {(o.orphaned > 0 || o.openMatches > 0) && (
        <div className="grid gap-3 sm:grid-cols-2">
          {o.orphaned > 0 && (
            <Link href={list("rep=inactive")} className="apple-card apple-press flex items-center gap-3 px-5 py-4 hover:bg-card/80">
              <Target className="size-5 shrink-0 text-(--sys-orange)" />
              <p className="text-[15px]">
                <span className="font-semibold">{fmtNum(o.orphaned)} ليد</span> مع مندوب موقوف — محتاجين يتسندوا لحد تاني.
              </p>
            </Link>
          )}
          {o.openMatches > 0 && (
            <Link href="/admin/leads/matches" className="apple-card apple-press flex items-center gap-3 px-5 py-4 hover:bg-card/80">
              <Handshake className="size-5 shrink-0 text-(--sys-orange)" />
              <p className="text-[15px]">
                <span className="font-semibold">{fmtNum(o.openMatches)} تاجر دفع</span> وممكن يكون ليد عندنا — محتاج قرارك.
              </p>
            </Link>
          )}
        </div>
      )}

      <LeadTrend
        points={trend.points}
        unit={trend.unit}
        rangeControl={
          <Segmented
            label="الفترة"
            param="range"
            basePath="/admin/leads"
            searchParams={params}
            segments={(Object.keys(RANGES) as OverviewRange[]).map((r) => ({ label: RANGES[r], value: r === "30d" ? undefined : r }))}
          />
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="حسب المرحلة" description="كل الليدز اللي مش ممسوحة">
          <BarList rows={statusRows} href={(k) => list(`status=${k}`)} />
        </Panel>
        <Panel title="حسب المصدر" description="الليدز جت منين">
          {o.bySource.length ? (
            <BarList rows={o.bySource.map((b) => ({ ...b, label: b.key ? SOURCE_LABELS[b.key as keyof typeof SOURCE_LABELS] : "مش محدد" }))} href={(k) => (k ? list(`source=${k}`) : null)} />
          ) : (
            <PanelEmpty>مفيش مصادر متسجلة.</PanelEmpty>
          )}
        </Panel>
        <Panel title="حسب المجال" description="أكبر ٨ مجالات">
          <BarList rows={o.byCategory.map((b) => ({ ...b, label: b.key || "مش محدد" }))} href={(k) => (k ? list(`category=${encodeURIComponent(k)}`) : null)} />
        </Panel>
        <Panel title="حسب المدينة" description="أكبر ٨ مدن">
          <BarList rows={o.byCity.map((b) => ({ ...b, label: b.key || "مش محدد" }))} href={(k) => (k ? list(`city=${encodeURIComponent(k)}`) : null)} />
        </Panel>
      </div>

      <Panel title="أداء المندوبين" description="الليدز اللي عند كل مندوب. «تواصل» = مكالمات وواتساب وإيميلات ومقابلات آخر ٣٠ يوم." flush>
        {reps.length === 0 ? (
          <PanelEmpty>مفيش مندوبين.</PanelEmpty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[40rem] text-[14px]">
              <thead>
                <tr className={theadRow}>
                  {["المندوب", "عنده", "شغالين", "لسه متكلموش", "اتحوّلوا", "خسرهم", "نسبة الكسب", "متأخرة", "تواصل ٣٠ يوم"].map((h, i) => (
                    <th key={h} className={cn(th, "px-3 text-start", i === 0 && "ps-5")}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reps.map((r) => (
                  <tr key={r.id} className="border-b-[0.5px] border-border last:border-0">
                    <td className="py-2.5 ps-5 pe-3">
                      <Link href={list(`rep=${r.id}`)} className={cn("font-medium hover:text-primary", !r.active && "text-muted-foreground")}>
                        {r.name}
                      </Link>
                    </td>
                    <td className="px-3 tabular-nums">{fmtNum(r.total)}</td>
                    <td className="px-3 tabular-nums">{fmtNum(r.open)}</td>
                    <td className={cn("px-3 tabular-nums", r.untouched > 0 && "text-(--sys-orange)")}>{fmtNum(r.untouched)}</td>
                    <td className="px-3 tabular-nums">{fmtNum(r.converted)}</td>
                    <td className="px-3 tabular-nums">{fmtNum(r.lost)}</td>
                    <td className="px-3 tabular-nums">{r.winRate === null ? "—" : fmtPct(r.winRate)}</td>
                    <td className={cn("px-3 tabular-nums", r.overdue > 0 && "font-medium text-(--sys-red)")}>{fmtNum(r.overdue)}</td>
                    <td className="px-3 tabular-nums">{fmtNum(r.touches30d)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
      <p className="-mt-2 flex items-center gap-1.5 px-5 text-[13px] text-muted-foreground">
        <CalendarCheck className="size-3.5" />
        التحويل = الليد اترابط بحساب تاجر ودفع أول اشتراك. العمولات مش بتتحسب من هنا — بتمشي برابط الإحالة زي ما هي.
      </p>
    </div>
  );
}

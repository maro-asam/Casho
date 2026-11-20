import Link from "next/link";
import { Lock, Route } from "lucide-react";
import { Pager, Segmented, Unavailable } from "@/components/saas-page";
import { readAnalyticsFilter } from "@/lib/analytics/access";
import { filterParams } from "@/lib/analytics/filters";
import { getJourneys, listSessions } from "@/lib/analytics/queries/activity";
import { getAnalyticsSettings } from "@/lib/analytics/settings";
import { BarList } from "../_components/bar-list";
import { Toolbar } from "../_components/toolbar";
import { DataTable, Note, Section } from "../_components/ui";
import { channelLabel, countryName, deviceLabel, eventLabel, flagOf, fmtDateTime, fmtDuration, fmtNum, pathLabel } from "../_lib/format";

export const dynamic = "force-dynamic";

/** "⚑ cta_clicked:signup" → "ضغط زرار التسجيل"-style label; pages stay paths. */
function stepLabel(step: string) {
  if (step === "(exit)") return "خرج";
  if (!step.startsWith("⚑ ")) return pathLabel(step);
  const [name, detail] = step.slice(2).split(":");
  return `${eventLabel(name)}${detail ? ` (${detail})` : ""}`;
}

export default async function JourneysPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const { viewer, f } = await readAnalyticsFilter(sp);
  const settings = await getAnalyticsSettings();
  const page = Math.max(1, Number(sp.page) || 1);
  const onlyConverted = sp.list === "converted";
  const [j, list] = await Promise.all([getJourneys(f), viewer.superAdmin ? listSessions(f, { page, converted: onlyConverted }) : null]);

  return (
    <div className="space-y-6">
      <Toolbar filter={f} report="journeys" />

      <Section
        title="أشهر المسارات"
        subtitle={`أول ٥ خطوات من كل زيارة · محسوبة على ${fmtNum(j.sampled)} زيارة${j.capped ? " (آخر ٥٬٠٠٠ في الفترة)" : ""}`}
        info={<p>الخطوة = صفحة اتفتحت أو حاجة مهمة اتعملت (ضغط CTA، إرسال فورم، تسجيل، طلب…). الصفحة لو اتكررت ورا بعض بتتحسب مرة. «خرج» = الزيارة خلصت قبل ٥ خطوات.</p>}
        flush
      >
        {j.paths.length ? (
          <ol className="apple-rows pb-2 [--row-inset:20px]">
            {j.paths.map((p, i) => (
              <li key={i} className="flex items-center gap-3 px-5 py-3">
                <span className="w-12 shrink-0 text-[15px] font-semibold tabular-nums">{fmtNum(p.sessions)}</span>
                <span className="flex min-w-0 flex-wrap items-center gap-1.5 text-[13px]">
                  {p.steps.map((s, k) => (
                    <span key={k} className="flex items-center gap-1.5">
                      {k > 0 && <span className="text-(--label-3)">←</span>}
                      <span
                        dir="auto"
                        className={
                          s === "(exit)"
                            ? "text-muted-foreground"
                            : s.startsWith("⚑")
                              ? "rounded-full bg-(--viz-2)/12 px-2 py-0.5 font-medium"
                              : "rounded-full bg-muted px-2 py-0.5"
                        }
                      >
                        {stepLabel(s)}
                      </span>
                    </span>
                  ))}
                </span>
              </li>
            ))}
          </ol>
        ) : (
          <Unavailable icon={Route} title="مفيش زيارات في الفترة دي" className="py-12" />
        )}
      </Section>

      <div className="grid gap-4 lg:grid-cols-3">
        <Section title="أول صفحة" subtitle="الزيارات بدأت منين" flush>
          <BarList valueLabel="زيارات" items={j.entries.map((e) => ({ key: e.key, label: <span dir="auto">{pathLabel(e.key)}</span>, value: e.sessions }))} />
        </Section>
        <Section title="آخر صفحة قبل ما يمشوا" flush>
          <BarList valueLabel="زيارات" items={j.exits.map((e) => ({ key: e.key, label: <span dir="auto">{pathLabel(e.key)}</span>, value: e.sessions }))} />
        </Section>
        <Section title="بعد أول صفحة راحوا فين" subtitle="لأكتر ٣ صفحات دخول" flush>
          <div className="space-y-3 px-5 pb-5">
            {j.firstSteps.map((fs) => (
              <div key={fs.from} className="space-y-1">
                <p className="text-[13px] font-semibold" dir="auto">
                  {pathLabel(fs.from)} <span className="font-normal text-muted-foreground">({fmtNum(fs.sessions)})</span>
                </p>
                <ul className="space-y-0.5 text-[13px] text-muted-foreground">
                  {fs.next.map((n) => (
                    <li key={n.to} className="flex justify-between gap-2">
                      <span className="truncate" dir="auto">
                        ← {stepLabel(n.to)}
                      </span>
                      <span className="tabular-nums">{fmtNum(n.count)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Section>
      </div>

      <Section
        title="زيارات بعينها"
        subtitle={viewer.superAdmin ? "كل فتح لزيارة بيتسجل في سجل الأمان" : undefined}
        flush
        actions={
          viewer.superAdmin ? (
            <Segmented
              label="القائمة"
              param="list"
              basePath="/admin/analytics/journeys"
              searchParams={sp}
              segments={[
                { label: "كل الزيارات", value: undefined },
                { label: "اللي حوّلت", value: "converted" },
              ]}
            />
          ) : null
        }
      >
        {!viewer.superAdmin || !list ? (
          <Unavailable icon={Lock} title="للسوبر أدمن بس" description="الرحلات الفردية بيانات حساسة، فمتاحة للسوبر أدمن، وكل فتح بيتسجل." className="py-10" />
        ) : list.rows.length ? (
          <>
            <DataTable minWidth={900} head={["البداية", "دخل من", "خرج من", "صفحات", "تفاعل", "المصدر", "الجهاز", "المكان"]}>
              {list.rows.map((r) => (
                <tr key={r.id} className="hover:bg-muted/40">
                  <td className="whitespace-nowrap">
                    <Link href={`/admin/analytics/journeys/${r.id}${filterParams(f)}`} className="font-medium text-primary">
                      {fmtDateTime(r.startedAt)}
                    </Link>
                    {r.converted && <span className="ms-1.5 text-[11px] text-(--sys-green)">● حوّل</span>}
                    {r.storeName && <span className="block text-[12px] text-muted-foreground">{r.storeName}</span>}
                  </td>
                  <td className="max-w-48 truncate" dir="auto">
                    {pathLabel(r.entryPath)}
                  </td>
                  <td className="max-w-48 truncate" dir="auto">
                    {pathLabel(r.exitPath)}
                  </td>
                  <td>{fmtNum(r.pageviews)}</td>
                  <td>{fmtDuration(r.engagedMs)}</td>
                  <td className="whitespace-nowrap">
                    {channelLabel(r.channel)} · {r.source}
                  </td>
                  <td>{deviceLabel(r.device)}</td>
                  <td className="whitespace-nowrap">{r.country ? `${flagOf(r.country)} ${countryName(r.country)}` : "—"}</td>
                </tr>
              ))}
            </DataTable>
            <Pager page={page} pageSize={list.pageSize} total={list.total} basePath="/admin/analytics/journeys" searchParams={sp} noun="زيارة" />
          </>
        ) : (
          <p className="px-5 pb-6 text-[14px] text-muted-foreground">مفيش زيارات بالفلتر ده.</p>
        )}
      </Section>

      <Note className="px-1">
        الرحلات الفردية بتتمسح تلقائيًا بعد {fmtNum(settings.rawRetentionDays)} يوم (تفاصيل الصفحات والأحداث) و{fmtNum(settings.sessionRetentionDays)} يوم (ملخص الزيارة). الزائر رقم عشوائي — مفيش اسم ولا إيميل ولا IP.
      </Note>
    </div>
  );
}

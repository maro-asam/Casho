import Link from "next/link";
import { Filter, TriangleAlert } from "lucide-react";
import { Tag, Unavailable } from "@/components/saas-page";
import { canSeeStorefronts, readAnalyticsFilter } from "@/lib/analytics/access";
import { filterParams } from "@/lib/analytics/filters";
import { BUILT_IN_FUNNELS, VERIFIED_STEPS, readSteps, type FunnelDefinition } from "@/lib/analytics/funnels";
import { getFunnelReport, listCustomFunnels } from "@/lib/analytics/queries/funnels";
import { cn } from "@/lib/utils";
import { Toolbar } from "../_components/toolbar";
import { Note, Section } from "../_components/ui";
import { fmtDuration, fmtNum, fmtPct, eventLabel } from "../_lib/format";
import { FunnelBuilder } from "./funnel-builder";

export const dynamic = "force-dynamic";

function stepSource(step: FunnelDefinition["steps"][number]) {
  if (step.type === "verified") return `مؤكد: ${VERIFIED_STEPS[step.value].source}`;
  if (step.type === "event") return `حدث ${eventLabel(step.value)}${step.propKey ? ` (${step.propKey} = ${step.propValue})` : ""}`;
  return step.value === "*" ? "أي صفحة" : `صفحة ${step.value}`;
}

export default async function FunnelsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const { viewer, f } = await readAnalyticsFilter(sp);
  const custom = await listCustomFunnels();
  const all: FunnelDefinition[] = [
    ...BUILT_IN_FUNNELS,
    ...custom.map((c) => ({ id: c.id, name: c.name, description: c.description, scope: c.scope, steps: readSteps(c.steps), windowDays: c.windowDays, builtIn: false })),
  ].filter((d) => d.steps.length >= 2 && (d.scope !== "STOREFRONT" || canSeeStorefronts(viewer)));
  const selected = all.find((d) => d.id === sp.funnel) ?? all[0];
  const report = await getFunnelReport(selected, f);
  const first = report.steps[0]?.entered ?? 0;
  const editing = typeof sp.edit === "string" ? custom.find((c) => c.id === sp.edit) : undefined;

  return (
    <div className="space-y-6">
      <Toolbar filter={f} report={`funnel:${selected.id}`} hideScope={selected.scope !== "STOREFRONT"} />

      <div className="grid gap-4 xl:grid-cols-[280px_1fr]">
        <aside className="space-y-3">
          <nav aria-label="الـ funnels" className="apple-card overflow-hidden">
            <ol className="apple-rows py-1 [--row-inset:16px]">
              {all.map((d) => (
                <li key={d.id}>
                  <Link
                    href={`/admin/analytics/funnels${filterParams(f, { funnel: d.id })}`}
                    aria-current={d.id === selected.id ? "page" : undefined}
                    className={cn("apple-press block px-4 py-3 text-[14px] hover:bg-muted/50", d.id === selected.id && "bg-primary/8")}
                  >
                    <span className={cn("block font-medium", d.id === selected.id && "text-primary")}>{d.name}</span>
                    <span className="block text-[12px] text-muted-foreground">
                      {fmtNum(d.steps.length)} خطوات · {d.scope === "STOREFRONT" ? "المتاجر" : "كاشو"}
                      {d.builtIn ? " · جاهز" : ""}
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          </nav>
          {viewer.superAdmin ? (
            <FunnelBuilder
              key={editing?.id ?? "new"}
              editing={editing ? { id: editing.id, name: editing.name, description: editing.description, scope: editing.scope, windowDays: editing.windowDays, steps: readSteps(editing.steps) } : null}
            />
          ) : (
            <p className="px-1 text-[12px] text-muted-foreground">عمل funnels جديدة للسوبر أدمن.</p>
          )}
        </aside>

        <Section
          title={selected.name}
          subtitle={selected.description ?? undefined}
          info={
            <>
              <p>الدخول = كل زائر عمل الخطوة الأولى في الفترة اللي فوق.</p>
              <p>كل خطوة بتتحسب بالترتيب وبعد اللي قبلها، وخلال {fmtNum(selected.windowDays)} يوم من أول خطوة.</p>
              <p>الخطوات «المؤكدة» من سجلات كاشو نفسها (حسابات، متاجر، طلبات شحن، دفتر الرصيد، الطلبات) — مش من ضغطة في المتصفح. بتتربط بالزائر عن طريق ربط المتصفح بالحساب وقت التسجيل أو الدخول.</p>
            </>
          }
          actions={
            !selected.builtIn && viewer.superAdmin ? (
              <Link href={`/admin/analytics/funnels${filterParams(f, { funnel: selected.id, edit: selected.id })}`} className="text-[15px] text-primary">
                تعديل
              </Link>
            ) : null
          }
        >
          {first === 0 ? (
            <Unavailable icon={Filter} title="محدش دخل الـ funnel ده في الفترة دي" description="جرّب فترة أطول، أو اتأكد إن الخطوة الأولى بتحصل فعلًا." className="py-12" />
          ) : (
            <ol className="space-y-1">
              {selected.steps.map((step, i) => {
                const r = report.steps[i];
                const biggest = report.biggestDropStep === i;
                return (
                  <li key={i}>
                    {i > 0 && (
                      <div className="flex flex-wrap items-center gap-2 py-2 ps-10 text-[12px] text-muted-foreground">
                        <span className="tabular-nums">
                          ↓ كمّل {fmtPct(r.fromPrevious)} · خرج {fmtNum(r.dropped)} ({fmtPct(r.dropRate)})
                        </span>
                        {r.medianMsFromPrevious !== null && <span>· في الوسط بعد {fmtDuration(r.medianMsFromPrevious)}</span>}
                        {biggest && (
                          <Tag tone="warning">
                            <TriangleAlert className="size-3" /> أكبر نقطة خروج
                          </Tag>
                        )}
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <span className="grid size-7 shrink-0 place-items-center rounded-full bg-muted text-[12px] font-semibold tabular-nums">{fmtNum(i + 1)}</span>
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-baseline justify-between gap-3">
                          <p className="truncate text-[15px] font-medium">{step.label}</p>
                          <p className="shrink-0 tabular-nums">
                            <span className="text-[17px] font-semibold">{fmtNum(r.entered)}</span>
                            <span className="ms-2 text-[13px] text-muted-foreground">{fmtPct(r.fromStart)}</span>
                          </p>
                        </div>
                        <div className="h-3 overflow-hidden rounded-full bg-(--viz-track)" role="img" aria-label={`${step.label}: ${fmtPct(r.fromStart)} من البداية`}>
                          <div className="h-full rounded-full bg-(--viz-1) transition-[width] duration-700 ease-(--ease-apple)" style={{ width: `${Math.max(1, (r.fromStart ?? 0) * 100)}%` }} />
                        </div>
                        <p className="text-[12px] text-muted-foreground">{stepSource(step)}</p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
          {report.truncated && <Note className="mt-3">الـ funnel محسوب على أول {fmtNum(report.cohort)} زائر بس (الفترة كبيرة).</Note>}
        </Section>
      </div>

      <Note className="px-1">
        اختيار الباقة وقته = وقت ما اتسجل الاختيار، ولو قبل التتبع فأول خصم اشتراك، ولو مفيش فوقت إنشاء المتجر. الدفع الناجح = شحن رصيد اتقيد فعلًا في دفتر الرصيد (أونلاين أو تحويل اتوافق عليه).
      </Note>
    </div>
  );
}

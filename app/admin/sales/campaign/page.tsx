import { Gift, Pill, ShoppingCart, Sparkles, Users } from "lucide-react";
import { requireAdmin } from "@/actions/admin/admin-guard.actions";
import { KpiStrip } from "@/app/admin/_components/admin-ui";
import { Card, StatusText, Unavailable, initialOf } from "@/components/saas-page";
import { campaignDaysFromWindow, campaignDaysLeft } from "@/lib/sales/campaign";
import { getCampaignAdmin } from "@/lib/sales/campaign-queries";
import { fmtDayMonth, fmtMoney, fmtNum, fmtPounds } from "@/lib/sales/format";
import { formatRateBps } from "@/lib/sales/rules";
import { cn } from "@/lib/utils";
import { AddCampaignMember, EditCampaignDialog, RemoveCampaignMember } from "../_components/campaign-dialogs";

export default async function AdminSalesCampaignPage() {
  await requireAdmin();
  const data = await getCampaignAdmin();

  if (!data) {
    return (
      <div className="apple-card">
        <Unavailable icon={Sparkles} title="مفيش عرض متسجل" description="العرض بيتعمل من الـ migration بتاع عرض الإطلاق." />
      </div>
    );
  }

  const { campaign: c, members, candidates } = data;
  const now = new Date();
  const state = now < c.startsAt ? "upcoming" : now < c.endsAt ? "running" : "ended";
  const { firstDay, lastDay } = campaignDaysFromWindow(c);
  const seatsLeft = c.maxMembers - members.length;
  const daysLeft = campaignDaysLeft(c, now);

  return (
    <div className="space-y-5">
      <section className="apple-card relative isolate flex flex-col gap-4 overflow-hidden p-5 sm:flex-row sm:items-end sm:justify-between sm:p-6">
        <div aria-hidden className="pointer-events-none absolute -top-24 -start-16 -z-10 size-72 rounded-full bg-[#a855f7]/12 blur-3xl" />
        <div className="space-y-1.5">
          <StatusText tone={state === "running" ? "success" : state === "upcoming" ? "info" : "neutral"}>
            {state === "running" ? `شغال · فاضل ${fmtNum(daysLeft)} يوم` : state === "upcoming" ? "لسه مبدأش" : "خلص"}
          </StatusText>
          <h2 className="text-[28px] leading-[34px] font-bold">{c.name}</h2>
          <p className="text-[15px] text-muted-foreground">
            من {fmtDayMonth(c.startsAt)} لحد {fmtDayMonth(new Date(c.endsAt.getTime() - 1))} (توقيت القاهرة) · لأول {fmtNum(c.maxMembers)} مندوبين
          </p>
        </div>
        <EditCampaignDialog
          defaults={{
            campaignId: c.id,
            name: c.name,
            firstDay,
            lastDay,
            baseRate: c.baseRateBps / 100,
            pharmacyRate: c.pharmacyRateBps / 100,
            posRate: c.posRateBps / 100,
            bonusTarget: c.bonusTarget,
            bonusEgp: c.bonusAmount / 100,
            maxMembers: c.maxMembers,
          }}
        />
      </section>

      <KpiStrip
        items={[
          { icon: Sparkles, label: "أي عميل جديد", value: <span dir="ltr">{formatRateBps(c.baseRateBps)}</span>, hint: "على أول اشتراك للعميل جوه الشهر" },
          { icon: Pill, label: "صيدلية", value: <span dir="ltr">{formatRateBps(c.pharmacyRateBps)}</span>, hint: "التاجر اختار «صيدلية» وهو بيسجل" },
          { icon: ShoppingCart, label: "باقة بلاتينيوم (الكاشير)", value: <span dir="ltr">{formatRateBps(c.posRateBps)}</span>, hint: "أعلى نسبة بتغلب لو أكتر من واحدة" },
          { icon: Gift, label: "البونص", value: fmtPounds(c.bonusAmount), hint: `مرة واحدة لما ${fmtNum(c.bonusTarget)} عملاء جداد يدفعوا جوه الشهر` },
        ]}
      />

      <Card
        icon={Users}
        title={`المندوبين في العرض · ${fmtNum(members.length)} من ${fmtNum(c.maxMembers)}`}
        subtitle={seatsLeft > 0 ? `فاضل ${fmtNum(seatsLeft)} ${seatsLeft === 1 ? "مكان" : "أماكن"} — المندوب الجديد بيتضاف من «إضافة مندوب» أو من هنا` : "العرض كامل"}
        action={
          seatsLeft > 0 && state !== "ended" ? (
            <AddCampaignMember campaignId={c.id} candidates={candidates.map((r) => ({ id: r.id, label: r.user.name ?? r.user.email }))} />
          ) : null
        }
      >
        {members.length === 0 ? (
          <p className="px-5 pb-5 text-[15px] text-muted-foreground">مفيش مندوبين في العرض لسه.</p>
        ) : (
          <ul className="apple-rows pb-2 [--row-inset:72px]">
            {members.map((m) => {
              const name = m.salesRep.user.name ?? m.salesRep.user.email;
              const pct = c.bonusTarget > 0 ? Math.min(1, m.acquiredInWindow / c.bonusTarget) : 0;
              return (
                <li key={m.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3">
                  <span
                    aria-hidden
                    className="grid size-10 shrink-0 place-items-center rounded-full bg-linear-to-b from-primary/80 to-primary text-[15px] font-bold text-primary-foreground"
                  >
                    {initialOf(name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-semibold">
                      {name}
                      {m.salesRep.status === "DISABLED" && <StatusText tone="danger" className="ms-2 text-[12px]">موقوف</StatusText>}
                    </p>
                    <p className="text-[13px] text-muted-foreground">انضم {fmtDayMonth(m.createdAt)} · كسب من العرض {fmtMoney(m.campaignEarned)}</p>
                  </div>
                  <div className="w-full shrink-0 sm:w-56">
                    <div className="flex items-baseline justify-between text-[13px]">
                      <span className="text-muted-foreground">عملاء جداد دفعوا</span>
                      <span className="font-semibold tabular-nums">
                        {fmtNum(m.acquiredInWindow)} / {fmtNum(c.bonusTarget)}
                      </span>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-(--fill-3)">
                      <div className={cn("h-full rounded-full", m.bonusAwardedAt ? "bg-(--sys-green)" : "bg-primary")} style={{ width: `${pct * 100}%` }} />
                    </div>
                    <p className="mt-1 text-[12px] text-muted-foreground">{m.bonusAwardedAt ? `البونص اتحسب ${fmtDayMonth(m.bonusAwardedAt)}` : "البونص لسه"}</p>
                  </div>
                  <RemoveCampaignMember memberId={m.id} name={name} />
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Card title="إزاي العرض بيتحسب">
        <ul className="list-disc space-y-1.5 px-5 ps-10 pb-5 text-[15px] leading-6 text-muted-foreground">
          <li>أول اشتراك لأي عميل جديد بيجيبه المندوب جوه الشهر بياخد نسبة العرض بدل نسبة المستوى، لو أعلى منها.</li>
          <li>التجديد مش داخل في العرض: بيفضل بنسبة التجديد العادية (6%) لمدة الأهلية زي أي عميل.</li>
          <li>لو أكتر من نسبة تنفع (مثلًا صيدلية على بلاتينيوم) بتتحسب الأعلى. ولو نسبة مستوى المندوب أعلى من العرض، بتفضل نسبته.</li>
          <li>البونص بيتضاف مرة واحدة كعمولة «بونص» مع دفعة العميل اللي بيكمّل العدد، وبيتصرف مع باقي المستحق.</li>
          <li>بعد آخر يوم العرض بيقفل لوحده. العمولات اللي اتحسبت بيه بتفضل زي ما هي، وتقدر تراجعها أو تلغيها من «العمولات».</li>
        </ul>
      </Card>
    </div>
  );
}

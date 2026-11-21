import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, Trophy } from "lucide-react";
import { requireAdminPage } from "@/lib/admin/page-guard";
import { assertLeadAdmin } from "@/lib/leads/access";
import { BackLink, Fields, PanelEmpty } from "@/app/admin/_components/admin-ui";
import { Card, StatusText } from "@/components/saas-page";
import { AssignLeadsDialog, LeadAdminMenu, LinkAccountDialog, MatchActions } from "@/components/leads/admin-lead-actions";
import { LeadDetailView } from "@/components/leads/lead-detail";
import { LEAD_STATUSES, LINK_SOURCE_LABELS } from "@/lib/leads/constants";
import { MATCH_REASON_LABELS } from "@/lib/leads/conversion";
import { getLeadDetail, leadFilterOptions, possibleAccountsFor, repLabel } from "@/lib/leads/queries";
import { checkStatusChange } from "@/lib/leads/workflow";
import { SUBSCRIPTION_META, fmtDate, fmtDateTime, fmtMoney } from "@/lib/sales/format";

export async function generateMetadata({ params }: { params: Promise<{ leadId: string }> }) {
  const { leadId } = await params;
  return { title: `ليد ${leadId.slice(0, 6)}` };
}

export default async function AdminLeadPage({ params }: { params: Promise<{ leadId: string }> }) {
  const admin = assertLeadAdmin(await requireAdminPage());
  const { leadId } = await params;
  if (!/^[0-9a-f-]{36}$/.test(leadId)) notFound();

  const detail = await getLeadDetail(admin, leadId);
  if (!detail) notFound();
  const { lead, assignments, repNames, people, matches, firstCharge } = detail;
  const [{ reps }, possible] = await Promise.all([leadFilterOptions(), possibleAccountsFor(lead)]);
  const now = new Date();
  const statusTargets = LEAD_STATUSES.filter((s) => checkStatusChange(admin, lead, s).ok);
  const canWork = !lead.deletedAt;
  const attribution = lead.customerUser?.salesAttribution;
  const attributedRep = attribution ? repLabel(attribution.salesRep) : null;

  const conversion = lead.customerUser ? (
    <Card title={lead.convertedAt ? "اتحوّل لعميل" : "مربوط بحساب كاشو"} icon={Trophy} subtitle={lead.convertedAt ? undefined : "هيتحسب تحويل أول ما المتجر يدفع اشتراك"}>
      <div className="space-y-3 px-5 pb-5">
        <Fields
          rows={[
            {
              label: "الحساب",
              value: (
                <Link href={`/admin/users/${lead.customerUser.id}`} className="text-primary" dir="ltr">
                  {lead.customerUser.email}
                </Link>
              ),
            },
            {
              label: "المتجر",
              value: lead.customerStore ? (
                <Link href={`/admin/stores/${lead.customerStore.slug}`} className="text-primary">
                  {lead.customerStore.name}
                </Link>
              ) : null,
            },
            { label: "الاشتراك", value: lead.customerStore ? <StatusText tone={SUBSCRIPTION_META[lead.customerStore.subscriptionStatus].tone}>{SUBSCRIPTION_META[lead.customerStore.subscriptionStatus].label}</StatusText> : null },
            { label: "طريقة الربط", value: lead.linkSource ? LINK_SOURCE_LABELS[lead.linkSource] : null },
            { label: "اترابط", value: lead.linkedAt ? fmtDateTime(lead.linkedAt) : null },
            { label: "أول اشتراك مدفوع", value: firstCharge ? `${fmtDate(firstCharge.createdAt)} · ${fmtMoney(Math.abs(firstCharge.amount))}` : "لسه" },
            { label: "منسوب في العمولات لـ", value: attributedRep ?? "مش منسوب لمندوب" },
          ]}
        />
        {attribution && lead.assignedRepId && attribution.salesRepId !== lead.assignedRepId && (
          <p className="flex gap-2 rounded-[12px] bg-(--sys-orange)/10 px-3.5 py-2.5 text-[13px]">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-(--sys-orange)" />
            العميل منسوب لمندوب غير اللي ماسك الليد. العمولة بتروح للمنسوب (رابط الإحالة هو المرجع) — ولو محتاج تغيير، من{" "}
            <Link href={`/admin/sales/customers/${lead.customerUser.id}`} className="text-primary">
              صفحة العميل في المبيعات
            </Link>
            .
          </p>
        )}
      </div>
    </Card>
  ) : (
    <Card title="حساب كاشو" subtitle="الليد لسه مش مربوط بحساب تاجر">
      <div className="space-y-3 px-5 pb-5">
        {possible.length > 0 ? (
          <>
            <p className="text-[13px] text-muted-foreground">حسابات بنفس الرقم أو الإيميل:</p>
            <ul className="space-y-1.5 text-[14px]">
              {possible.map((u) => (
                <li key={u.id} className="flex items-center justify-between gap-2">
                  <Link href={`/admin/users/${u.id}`} className="min-w-0 truncate text-primary">
                    {u.stores[0]?.name ?? u.email}
                  </Link>
                  <span className="shrink-0 text-[12px] text-muted-foreground">{u.lead ? "مربوط بليد تاني" : u.emailVerified ? "إيميل متأكد" : ""}</span>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="text-[13px] text-muted-foreground">مفيش حساب بنفس الرقم أو الإيميل. أول ما صاحب الليد يسجّل ويدفع اشتراك، بيترابط لوحده.</p>
        )}
        {!lead.deletedAt && <LinkAccountDialog leadId={lead.id} />}
      </div>
    </Card>
  );

  const matchesCard =
    matches.length > 0 ? (
      <Card title="مطابقات محتاجة قرار" icon={AlertTriangle} subtitle="تجار دفعوا وممكن يكونوا الليد ده — مترابطوش لوحدهم عشان المطابقة مش أكيدة">
        <ul className="apple-rows px-5 pb-3 [--row-inset:0px]">
          {matches.map((m) => (
            <li key={m.id} className="flex items-center gap-3 py-3">
              <div className="min-w-0 flex-1 text-[14px]">
                <p className="truncate font-semibold">{m.user.stores[0]?.name ?? m.user.email}</p>
                <p className="text-[12px] text-muted-foreground">{MATCH_REASON_LABELS[m.reason] ?? m.reason}</p>
              </div>
              <MatchActions matchId={m.id} />
            </li>
          ))}
        </ul>
      </Card>
    ) : null;

  const history = (
    <Card title="سجل الإسناد" subtitle="مين اتسند له الليد، إمتى، ومين عمل كده">
      {assignments.length === 0 ? (
        <PanelEmpty>الليد عمره ما اتسند.</PanelEmpty>
      ) : (
        <ul className="apple-rows px-5 pb-3 [--row-inset:0px]">
          {assignments.map((a) => (
            <li key={a.id} className="space-y-0.5 py-3 text-[14px]">
              <p>
                <span className="text-muted-foreground">{a.fromRepId ? (repNames.get(a.fromRepId) ?? "—") : "مش متسند"}</span>
                <span className="mx-1.5 text-muted-foreground">←</span>
                <span className="font-medium">{a.toRepId ? (repNames.get(a.toRepId) ?? "—") : "مش متسند"}</span>
              </p>
              <p className="text-[12px] text-muted-foreground">
                {fmtDateTime(a.createdAt)} · {people.get(a.assignedById) ?? "—"}
                {a.reason && ` · ${a.reason}`}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );

  return (
    <div className="space-y-4">
      <BackLink href="/admin/leads/list">كل الليدز</BackLink>
      <LeadDetailView
        detail={detail}
        viewer="admin"
        now={now}
        statusTargets={statusTargets}
        canWork={canWork}
        greeting={`أهلًا${lead.ownerName ? ` ${lead.ownerName.split(/\s+/)[0]}` : ""}، معاك فريق كاشو.`}
        headerActions={
          <>
            {!lead.deletedAt && <AssignLeadsDialog leadIds={[lead.id]} reps={reps} currentRepId={lead.assignedRepId} />}
            <LeadAdminMenu lead={lead} />
          </>
        }
        sideTop={
          <>
            {matchesCard}
            {conversion}
          </>
        }
        adminPanels={history}
      />
    </div>
  );
}

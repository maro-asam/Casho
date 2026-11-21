import Link from "next/link";
import { Handshake } from "lucide-react";
import { requireAdminPage } from "@/lib/admin/page-guard";
import { assertLeadAdmin } from "@/lib/leads/access";
import { Card, Unavailable } from "@/components/saas-page";
import { MatchActions } from "@/components/leads/admin-lead-actions";
import { LeadStatusTag } from "@/components/leads/lead-ui";
import { MATCH_REASON_LABELS } from "@/lib/leads/conversion";
import { listOpenMatches, repLabel } from "@/lib/leads/queries";
import { fmtDate } from "@/lib/sales/format";

const MATCHED_BY: Record<string, string> = { PHONE: "الرقم", EMAIL: "الإيميل", PHONE_EMAIL: "الرقم والإيميل" };

export default async function LeadMatchesPage() {
  assertLeadAdmin(await requireAdminPage());
  const matches = await listOpenMatches();

  return (
    <div className="space-y-4">
      <Card
        title="تجار دفعوا وممكن يكونوا ليدز"
        subtitle="الربط التلقائي بيحصل بس لما المطابقة أكيدة (ليد واحد، ونفس الإيميل المتأكد منه أو رقم التسجيل). هنا اللي محتاج عينك: اربط لو هو، أو «مش هو» عشان ميتعرضش تاني."
      >
        {matches.length === 0 ? (
          <Unavailable icon={Handshake} title="مفيش مطابقات محتاجة قرار" description="أول ما تاجر يدفع ويبان إنه ممكن يكون ليد — بس مش أكيد — هيظهر هنا." />
        ) : (
          <ul className="apple-rows border-t-[0.5px] border-border">
            {matches.map((m) => (
              <li key={m.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center">
                <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-2">
                  <div className="min-w-0 space-y-0.5 text-[14px]">
                    <p className="text-[12px] text-muted-foreground">الليد</p>
                    <Link href={`/admin/leads/${m.lead.id}`} className="block truncate font-semibold hover:text-primary">
                      {m.lead.businessName}
                    </Link>
                    <p dir="ltr" className="truncate text-end text-[12px] text-muted-foreground sm:text-start">
                      {[m.lead.phone, m.lead.email].filter(Boolean).join(" · ")}
                    </p>
                    <div className="flex items-center gap-2">
                      <LeadStatusTag status={m.lead.status} quiet />
                      <span className="text-[12px] text-muted-foreground">{repLabel(m.lead.assignedRep) ?? "مش متسند"}</span>
                    </div>
                  </div>
                  <div className="min-w-0 space-y-0.5 text-[14px]">
                    <p className="text-[12px] text-muted-foreground">حساب التاجر</p>
                    <Link href={`/admin/users/${m.user.id}`} className="block truncate font-semibold hover:text-primary">
                      {m.user.stores[0]?.name ?? m.user.name ?? m.user.email}
                    </Link>
                    <p dir="ltr" className="truncate text-end text-[12px] text-muted-foreground sm:text-start">
                      {[m.user.phone_number, m.user.email].filter(Boolean).join(" · ")}
                    </p>
                    <p className="text-[12px] text-muted-foreground">
                      سجّل {fmtDate(m.user.createdAt)} · مطابق في {MATCHED_BY[m.matchedBy] ?? m.matchedBy} · {MATCH_REASON_LABELS[m.reason] ?? m.reason}
                    </p>
                  </div>
                </div>
                <MatchActions matchId={m.id} />
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

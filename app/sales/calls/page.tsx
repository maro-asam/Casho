import Link from "next/link";
import { PartyPopper, SearchX } from "lucide-react";
import { LargeTitle, Segmented, Unavailable, appleButton, readParam, type SearchParamsRecord } from "@/components/saas-page";
import type { CallReason } from "@/lib/sales/call-list";
import { listCallList } from "@/lib/sales/call-list-queries";
import { requireSalesRep } from "@/lib/sales/guard";
import { CallRows } from "../_components/call-rows";

const BASE_PATH = "/sales/calls";

/** Trials = the acquisition still to win; renewals = paid customers about to drop. */
const GROUPS = {
  trials: ["TRIAL_ENDING", "NEW_SIGNUP", "TRIAL_ENDED", "STALLED", "NO_STORE"],
  renewals: ["STORE_CLOSED", "RENEWAL_AT_RISK"],
} satisfies Record<string, CallReason[]>;
type Group = keyof typeof GROUPS;

export default async function SalesCallsPage({ searchParams }: { searchParams?: Promise<SearchParamsRecord> }) {
  const rep = await requireSalesRep();
  const params = await searchParams;
  const raw = readParam(params, "group");
  const group = (Object.keys(GROUPS) as Group[]).find((g) => g === raw);
  const repName = rep.name?.trim() || rep.email.split("@")[0];
  const now = new Date();

  // Scope comes from the session only — no rep id is read from the URL.
  const list = await listCallList(rep.salesRepId, { now });
  const count = (g: Group) => GROUPS[g].reduce((n, r) => n + list.counts[r], 0);
  const reasons: CallReason[] | null = group ? GROUPS[group] : null;
  const rows = reasons ? list.rows.filter((r) => reasons.includes(r.call.reason)) : list.rows;

  return (
    <div className="space-y-6">
      <LargeTitle
        title="المتابعة"
        subtitle="مين محتاج مكالمة النهارده: تجارب بتخلص، تسجيلات جديدة، ومتاجر اتقفلت أو تجديدها في خطر. الأهم الأول."
      />

      {list.total === 0 ? (
        <div className="apple-card">
          <Unavailable
            icon={PartyPopper}
            title="مفيش حد محتاج مكالمة دلوقتي"
            description="كل عملائك تمام. أول ما حد يسجّل أو تجربة تقرب تخلص أو اشتراك يبقى في خطر هيظهر هنا."
            action={
              <Link href="/sales" className={appleButton.tinted}>
                رابط الإحالة
              </Link>
            }
          />
        </div>
      ) : (
        <div className="space-y-4">
          <Segmented
            label="نوع المتابعة"
            param="group"
            basePath={BASE_PATH}
            searchParams={params}
            segments={[
              { label: "الكل", count: list.total },
              { label: "تجارب وتسجيلات", value: "trials", count: count("trials") },
              { label: "تجديدات", value: "renewals", count: count("renewals") },
            ]}
          />

          <section className="apple-card overflow-hidden pt-2">
            {rows.length === 0 ? (
              <Unavailable
                icon={SearchX}
                title="مفيش حد هنا"
                description="جرّب نوع تاني."
                action={
                  <Link href={BASE_PATH} className={appleButton.tinted}>
                    عرض الكل
                  </Link>
                }
              />
            ) : (
              <CallRows rows={rows} repName={repName} now={now} />
            )}
          </section>
        </div>
      )}
    </div>
  );
}

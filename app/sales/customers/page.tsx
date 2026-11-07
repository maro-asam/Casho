import Link from "next/link";
import { SearchX, Users } from "lucide-react";
import {
  LargeTitle,
  Pager,
  SearchInput,
  Segmented,
  Unavailable,
  appleButton,
  readPage,
  readParam,
  type SearchParamsRecord,
} from "@/components/saas-page";
import { requireSalesRep } from "@/lib/sales/guard";
import { PAGE_SIZE, countCustomersByState, listAttributedCustomers, type CustomerFilter } from "@/lib/sales/queries";
import { CustomerRows } from "../_components/customer-rows";

const BASE_PATH = "/sales/customers";
const FILTERS: CustomerFilter[] = ["signup", "eligible", "expired"];

export default async function SalesCustomersPage({ searchParams }: { searchParams?: Promise<SearchParamsRecord> }) {
  const rep = await requireSalesRep();
  const params = await searchParams;
  const q = readParam(params, "q");
  const rawState = readParam(params, "state");
  const state = FILTERS.find((f) => f === rawState);
  const repName = rep.name?.trim() || rep.email.split("@")[0];

  // Scope comes from the session only — no rep id is read from the URL.
  const scope = { salesRepId: rep.salesRepId };
  const [counts, list] = await Promise.all([
    countCustomersByState(scope, q),
    listAttributedCustomers(scope, { q, filter: state, page: readPage(params) }),
  ]);
  const hasFilters = Boolean(q || state);

  return (
    <div className="space-y-6">
      <LargeTitle title="عملائي" subtitle="التجار اللي سجلوا من رابطك. العميل بيتحسب ليك مع أول دفعة اشتراك." />

      {counts.all === 0 && !q ? (
        <div className="apple-card">
          <Unavailable
            icon={Users}
            title="مفيش عملاء لسه"
            description="ابعت رابط الإحالة بتاعك للتجار — أول ما حد يسجل هيظهر هنا."
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
            label="حالة العملاء"
            param="state"
            basePath={BASE_PATH}
            searchParams={params}
            segments={[
              { label: "الكل", count: counts.all },
              { label: "لسه مدفعوش", value: "signup", count: counts.signup },
              { label: "مؤهلين", value: "eligible", count: counts.eligible },
              { label: "انتهت أهليتهم", value: "expired", count: counts.expired },
            ]}
          />

          <section className="apple-card overflow-hidden">
            <div className="p-4 sm:px-5">
              <SearchInput
                placeholder="ابحث بالاسم أو البريد أو الموبايل أو المتجر"
                className="sm:max-w-md"
                inputClassName="h-10 rounded-[12px] border-0 bg-(--fill-3) text-[15px] focus-visible:ring-primary/40"
              />
            </div>

            {list.rows.length === 0 ? (
              <Unavailable
                icon={SearchX}
                title="مفيش عملاء بالفلاتر دي"
                description={q ? `مفيش نتايج لـ "${q}".` : "جرّب حالة تانية."}
                className="border-t-[0.5px] border-border"
                action={
                  hasFilters && (
                    <Link href={BASE_PATH} className={appleButton.tinted}>
                      مسح الفلاتر
                    </Link>
                  )
                }
              />
            ) : (
              <CustomerRows rows={list.rows} repName={repName} />
            )}

            {list.total > 0 && (
              <div className="border-t-[0.5px] border-border">
                <Pager page={list.page} pageSize={PAGE_SIZE} total={list.total} basePath={BASE_PATH} searchParams={params} noun="عميل" />
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

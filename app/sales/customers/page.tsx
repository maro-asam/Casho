import Link from "next/link";
import { SearchX, Users } from "lucide-react";
import {
  DataCard,
  EmptyState,
  FilterTabs,
  PageHeader,
  Pagination,
  SearchInput,
  readPage,
  readParam,
  type SearchParamsRecord,
} from "@/components/saas-page";
import { CustomersTable } from "@/components/sales/customers-table";
import { requireSalesRep } from "@/lib/sales/guard";
import { PAGE_SIZE, countCustomersByState, listAttributedCustomers, type CustomerFilter } from "@/lib/sales/queries";

const BASE_PATH = "/sales/customers";
const FILTERS: CustomerFilter[] = ["signup", "eligible", "expired"];

export default async function SalesCustomersPage({ searchParams }: { searchParams?: Promise<SearchParamsRecord> }) {
  const rep = await requireSalesRep();
  const params = await searchParams;
  const q = readParam(params, "q");
  const rawState = readParam(params, "state");
  const state = FILTERS.find((f) => f === rawState);

  // Scope comes from the session only — no rep id is read from the URL.
  const scope = { salesRepId: rep.salesRepId };
  const [counts, list] = await Promise.all([
    countCustomersByState(scope, q),
    listAttributedCustomers(scope, { q, filter: state, page: readPage(params) }),
  ]);

  return (
    <div className="space-y-4">
      <PageHeader title="عملائي" description="التجار اللي سجلوا من رابطك. العميل بيتحسب مكتسب مع أول دفعة اشتراك موثّقة." />

      <FilterTabs
        label="حالة العملاء"
        param="state"
        basePath={BASE_PATH}
        searchParams={params}
        tabs={[
          { label: "الكل", count: counts.all },
          { label: "سجّل ولم يدفع", value: "signup", count: counts.signup },
          { label: "مؤهل حاليًا", value: "eligible", count: counts.eligible },
          { label: "انتهت الأهلية", value: "expired", count: counts.expired },
        ]}
      />

      <DataCard
        toolbar={<SearchInput placeholder="ابحث بالاسم أو البريد أو الموبايل أو المتجر" />}
        footer={<Pagination page={list.page} pageSize={PAGE_SIZE} total={list.total} basePath={BASE_PATH} searchParams={params} noun="عميل" />}
      >
        {list.rows.length === 0 ? (
          q || state ? (
            <EmptyState
              icon={SearchX}
              title="مفيش عملاء بالفلاتر دي"
              action={
                <Link href={BASE_PATH} className="text-sm text-primary hover:underline">
                  مسح الفلاتر
                </Link>
              }
            />
          ) : (
            <EmptyState icon={Users} title="مفيش عملاء لسه" description="ابعت رابط الإحالة بتاعك للتجار — أول ما حد يسجل هيظهر هنا." />
          )
        ) : (
          <CustomersTable rows={list.rows} detailBase={BASE_PATH} />
        )}
      </DataCard>
    </div>
  );
}

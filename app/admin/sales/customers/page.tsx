import Link from "next/link";
import { SearchX, Users } from "lucide-react";
import { requireAdmin } from "@/actions/admin/admin-guard.actions";
import {
  DataCard,
  EmptyState,
  FilterTabs,
  Pagination,
  SearchInput,
  SelectFilter,
  readPage,
  readParam,
  type SearchParamsRecord,
} from "@/components/saas-page";
import { CustomersTable } from "@/components/sales/customers-table";
import { prisma } from "@/lib/prisma";
import { PAGE_SIZE, countCustomersByState, listAttributedCustomers, type CustomerFilter, type SalesScope } from "@/lib/sales/queries";
import { AssignCustomerDialog } from "../_components/sales-dialogs";

const BASE_PATH = "/admin/sales/customers";
const FILTERS: CustomerFilter[] = ["signup", "eligible", "expired"];

export default async function AdminSalesCustomersPage({ searchParams }: { searchParams?: Promise<SearchParamsRecord> }) {
  await requireAdmin();
  const params = await searchParams;
  const q = readParam(params, "q");
  const rawState = readParam(params, "state");
  const state = FILTERS.find((f) => f === rawState);

  const reps = await prisma.salesRep.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, status: true, user: { select: { name: true, email: true } } },
  });
  const repParam = readParam(params, "rep");
  const repId = reps.some((r) => r.id === repParam) ? repParam : undefined;
  const scope: SalesScope = repId ? { salesRepId: repId } : { all: true };

  const [counts, list] = await Promise.all([
    countCustomersByState(scope, q),
    listAttributedCustomers(scope, { q, filter: state, page: readPage(params) }),
  ]);

  const repOptions = reps.map((r) => ({ id: r.id, label: `${r.user.name ?? r.user.email}${r.status === "DISABLED" ? " (موقوف)" : ""}` }));
  const activeReps = repOptions.filter((_, i) => reps[i].status === "ACTIVE");
  const filtered = !!(q || state || repId);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">العميل = حساب التاجر. بيتحسب &quot;مكتسب&quot; مرة واحدة مع أول خصم اشتراك موثّق.</p>
        <AssignCustomerDialog reps={activeReps} triggerLabel="نسب عميل بالبريد" />
      </div>

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
        toolbar={
          <>
            <SearchInput placeholder="ابحث بالاسم أو البريد أو الموبايل أو المتجر" />
            <SelectFilter param="rep" allLabel="كل المندوبين" label="المندوب" options={repOptions.map((r) => ({ value: r.id, label: r.label }))} />
          </>
        }
        footer={<Pagination page={list.page} pageSize={PAGE_SIZE} total={list.total} basePath={BASE_PATH} searchParams={params} noun="عميل" />}
      >
        {list.rows.length === 0 ? (
          filtered ? (
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
            <EmptyState icon={Users} title="مفيش عملاء منسوبين لسه" description="أول ما تاجر يسجل من رابط مندوب هيظهر هنا." />
          )
        ) : (
          <CustomersTable
            rows={list.rows}
            detailBase={BASE_PATH}
            showRep
            actions={(row) => (
              <AssignCustomerDialog reps={activeReps} customerUserId={row.customer.id} currentRepId={row.salesRepId} triggerLabel="نقل" />
            )}
          />
        )}
      </DataCard>
    </div>
  );
}

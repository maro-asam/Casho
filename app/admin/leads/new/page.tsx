import { requireAdminPage } from "@/lib/admin/page-guard";
import { assertLeadAdmin } from "@/lib/leads/access";
import { BackLink } from "@/app/admin/_components/admin-ui";
import { LeadForm } from "@/components/leads/lead-form";
import { leadFilterOptions } from "@/lib/leads/queries";

export const metadata = { title: "ليد جديد" };

export default async function NewLeadPage() {
  assertLeadAdmin(await requireAdminPage());
  const { reps } = await leadFilterOptions();
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <BackLink href="/admin/leads/list">كل الليدز</BackLink>
      <div className="space-y-1">
        <h2 className="text-[22px] font-bold">ليد جديد</h2>
        <p className="text-[15px] text-muted-foreground">اسم النشاط والموبايل بس هما المطلوبين. لو الرقم أو الإيميل موجود في ليد تاني هنقولك بدل ما يتكرر.</p>
      </div>
      <LeadForm mode="create" reps={reps} />
    </div>
  );
}

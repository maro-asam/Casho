import { notFound } from "next/navigation";
import { requireAdminPage } from "@/lib/admin/page-guard";
import { assertLeadAdmin } from "@/lib/leads/access";
import { BackLink } from "@/app/admin/_components/admin-ui";
import { LeadForm } from "@/components/leads/lead-form";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "تعديل ليد" };

export default async function EditLeadPage({ params }: { params: Promise<{ leadId: string }> }) {
  assertLeadAdmin(await requireAdminPage());
  const { leadId } = await params;
  if (!/^[0-9a-f-]{36}$/.test(leadId)) notFound();
  const lead = await prisma.lead.findFirst({ where: { id: leadId, deletedAt: null } });
  if (!lead) notFound();
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <BackLink href={`/admin/leads/${lead.id}`}>{lead.businessName}</BackLink>
      <div className="space-y-1">
        <h2 className="text-[22px] font-bold">تعديل البيانات</h2>
        <p className="text-[15px] text-muted-foreground">كل تعديل بيتسجل في تاريخ الليد (قبل وبعد). المندوب مبيقدرش يعدّل البيانات دي.</p>
      </div>
      <LeadForm
        mode="edit"
        leadId={lead.id}
        initial={{
          businessName: lead.businessName,
          ownerName: lead.ownerName,
          phone: lead.phone,
          whatsapp: lead.whatsapp,
          email: lead.email,
          category: lead.category,
          city: lead.city,
          website: lead.website,
          instagram: lead.instagram,
          facebook: lead.facebook,
          businessSize: lead.businessSize,
          source: lead.source,
          sourceDetails: lead.sourceDetails,
        }}
      />
    </div>
  );
}

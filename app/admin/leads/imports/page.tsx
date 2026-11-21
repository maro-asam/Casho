import Link from "next/link";
import { requireAdminPage } from "@/lib/admin/page-guard";
import { assertLeadAdmin } from "@/lib/leads/access";
import { Card, StatusText } from "@/components/saas-page";
import { ImportWizard } from "@/components/leads/import-wizard";
import { IMPORT_STATUS_META } from "@/lib/leads/constants";
import { leadFilterOptions, listLeadImports } from "@/lib/leads/queries";
import { fmtDateTime, fmtNum } from "@/lib/sales/format";

export const metadata = { title: "استيراد ليدز" };

export default async function LeadImportsPage() {
  assertLeadAdmin(await requireAdminPage());
  const [{ reps }, imports] = await Promise.all([leadFilterOptions(), listLeadImports()]);

  return (
    <div className="space-y-6">
      <ImportWizard reps={reps} />
      <Card title="استيرادات سابقة" subtitle="كل ملف بنتيجته — افتحه عشان تكمّل استيراد وقف أو تنزّل تقرير الأخطاء">
        {imports.length === 0 ? (
          <p className="px-5 pb-5 text-[15px] text-muted-foreground">لسه مفيش ملفات اترفعت.</p>
        ) : (
          <ul className="apple-rows border-t-[0.5px] border-border">
            {imports.map((i) => (
              <li key={i.id}>
                <Link href={`/admin/leads/imports/${i.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-(--fill-3)/50">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-medium" dir="auto">
                      {i.fileName}
                    </p>
                    <p className="text-[12px] text-muted-foreground">
                      {fmtDateTime(i.createdAt)} · {i.uploadedBy} · {fmtNum(i.totalRows)} صف
                    </p>
                  </div>
                  <div className="shrink-0 text-end">
                    <StatusText tone={IMPORT_STATUS_META[i.status].tone}>{IMPORT_STATUS_META[i.status].label}</StatusText>
                    {i.status === "COMPLETED" && (
                      <p className="text-[12px] tabular-nums text-muted-foreground">
                        {fmtNum(i.importedRows)} اتضاف{i.updatedRows ? ` · ${fmtNum(i.updatedRows)} اتكمّل` : ""}
                      </p>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

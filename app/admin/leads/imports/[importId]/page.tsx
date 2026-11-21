import Link from "next/link";
import { notFound } from "next/navigation";
import { Download } from "lucide-react";
import { requireAdminPage } from "@/lib/admin/page-guard";
import { assertLeadAdmin } from "@/lib/leads/access";
import { BackLink, KpiStrip } from "@/app/admin/_components/admin-ui";
import { Card, StatusText, appleButton } from "@/components/saas-page";
import { ImportRunner } from "@/components/leads/import-runner";
import { DUPLICATE_MODE_LABELS, IMPORT_ROW_META, IMPORT_STATUS_META, SOURCE_LABELS } from "@/lib/leads/constants";
import { prisma } from "@/lib/prisma";
import { fmtDateTime, fmtNum } from "@/lib/sales/format";

export default async function LeadImportPage({ params }: { params: Promise<{ importId: string }> }) {
  assertLeadAdmin(await requireAdminPage());
  const { importId } = await params;
  if (!/^[0-9a-f-]{36}$/.test(importId)) notFound();
  const imp = await prisma.leadImport.findUnique({ where: { id: importId } });
  if (!imp) notFound();

  const pendingStatuses = imp.duplicateMode === "FILL_BLANKS" ? (["VALID", "DUPLICATE_EXISTING"] as const) : (["VALID"] as const);
  const [toProcess, problems, rep] = await Promise.all([
    prisma.leadImportRow.count({ where: { importId, status: { in: [...pendingStatuses] }, leadId: null } }),
    prisma.leadImportRow.findMany({
      where: { importId, status: { in: ["INVALID", "DUPLICATE_FILE", "DUPLICATE_EXISTING", "SKIPPED", "FAILED"] } },
      orderBy: { rowNumber: "asc" },
      take: 25,
      select: { id: true, rowNumber: true, status: true, errors: true, data: true, existingLeadId: true },
    }),
    imp.assignRepId ? prisma.salesRep.findUnique({ where: { id: imp.assignRepId }, select: { user: { select: { name: true, email: true } } } }) : null,
  ]);
  const open = imp.status === "READY" || imp.status === "RUNNING";
  const willUpdate = imp.duplicateMode === "FILL_BLANKS";

  return (
    <div className="space-y-4">
      <BackLink href="/admin/leads/imports">الاستيراد</BackLink>
      <section className="apple-card space-y-1 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <StatusText tone={IMPORT_STATUS_META[imp.status].tone}>{IMPORT_STATUS_META[imp.status].label}</StatusText>
          <span className="text-[13px] text-muted-foreground">{fmtDateTime(imp.createdAt)}</span>
        </div>
        <h2 className="text-[22px] font-bold wrap-break-word" dir="auto">
          {imp.fileName}
        </h2>
        <p className="text-[14px] text-muted-foreground">
          المكرر: {DUPLICATE_MODE_LABELS[imp.duplicateMode].label}
          {imp.defaultSource && ` · المصدر الافتراضي: ${SOURCE_LABELS[imp.defaultSource]}`}
          {rep && ` · بيتسند لـ${rep.user.name ?? rep.user.email}`}
        </p>
      </section>

      {imp.status === "DRAFT" ? (
        <Card title="الرفع موقفش لآخره" subtitle="الصفوف ماوصلتش كلها — ارفع الملف تاني من صفحة الاستيراد. الاستيراد ده هيتلغى لوحده.">
          <div className="px-5 pb-5">
            <Link href="/admin/leads/imports" className={appleButton.tinted}>
              ارفع تاني
            </Link>
          </div>
        </Card>
      ) : (
        <>
          <KpiStrip
            items={
              imp.status === "COMPLETED" || imp.status === "CANCELED"
                ? [
                    { label: "اتضافوا", value: fmtNum(imp.importedRows), hint: `من ${fmtNum(imp.totalRows)} صف` },
                    { label: "اتكمّلت بياناتهم", value: fmtNum(imp.updatedRows), hint: willUpdate ? "ليدز موجودة خدت خانات فاضية" : "الوضع: سيب المكرر" },
                    { label: "اتسابوا", value: fmtNum(imp.skippedRows), hint: "مكرر أو اتضاف من مكان تاني" },
                    { label: "فيهم غلط", value: fmtNum(imp.invalidRows + imp.failedRows), hint: "في تقرير الأخطاء" },
                  ]
                : [
                    { label: "هيتضافوا", value: fmtNum(imp.validRows), hint: `من ${fmtNum(imp.totalRows)} صف` },
                    { label: "موجودين قبل كده", value: fmtNum(imp.existingDuplicateRows), hint: willUpdate ? "هيتكمّل الفاضي عندهم بس" : "مش هيتلمسوا" },
                    { label: "متكررين في الملف", value: fmtNum(imp.fileDuplicateRows), hint: "أول صف بس اللي بيتحسب" },
                    { label: "فيهم غلط", value: fmtNum(imp.invalidRows), hint: "مش هيتضافوا" },
                  ]
            }
          />
          {open && (
            <section className="apple-card p-5">
              <ImportRunner importId={imp.id} toProcess={toProcess} canStart={open} />
            </section>
          )}
          <Card
            title="الصفوف اللي مش هتتضاف"
            subtitle={problems.length ? "أول ٢٥ — التقرير الكامل فيه كل صف بسببه وبياناته" : "مفيش — كل الصفوف سليمة"}
            action={
              problems.length > 0 ? (
                <a href={`/api/admin/leads/imports/${imp.id}/errors`} className={appleButton.plain}>
                  <Download className="size-4" />
                  تقرير الأخطاء
                </a>
              ) : undefined
            }
          >
            {problems.length > 0 && (
              <ul className="apple-rows border-t-[0.5px] border-border">
                {problems.map((r) => {
                  const d = r.data as Record<string, string | null>;
                  return (
                    <li key={r.id} className="flex items-start gap-3 px-5 py-2.5 text-[14px]">
                      <span className="w-14 shrink-0 text-[12px] tabular-nums text-muted-foreground">صف {fmtNum(r.rowNumber + 1)}</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium" dir="auto">
                          {d.businessName || "—"} <span className="font-normal text-muted-foreground" dir="ltr">{d.phone}</span>
                        </p>
                        <p className="text-[13px] text-muted-foreground">
                          <StatusText tone={IMPORT_ROW_META[r.status].tone}>{IMPORT_ROW_META[r.status].label}</StatusText> · {r.errors.join(" · ") || "—"}
                          {r.existingLeadId && (
                            <>
                              {" · "}
                              <Link href={`/admin/leads/${r.existingLeadId}`} className="text-primary">
                                افتح الموجود
                              </Link>
                            </>
                          )}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

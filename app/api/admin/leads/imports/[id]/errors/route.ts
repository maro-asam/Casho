/** An import's error report: every row that didn't become a lead or an update, with the reason and the row's data. */
import { NextResponse, type NextRequest } from "next/server";
import { getLeadActor } from "@/lib/leads/access";
import { attachment, errorReportRows, toCsv } from "@/lib/leads/export";
import { importProblemRows } from "@/lib/leads/import-server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const actor = await getLeadActor();
  if (actor?.kind !== "admin") return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) return NextResponse.json({ error: "not found" }, { status: 404 });
  const imp = await prisma.leadImport.findUnique({ where: { id }, select: { fileName: true } });
  if (!imp) return NextResponse.json({ error: "not found" }, { status: 404 });

  const rows = await importProblemRows(id);
  const name = `${imp.fileName.replace(/\.[a-z]+$/i, "")}-errors.csv`;
  return new NextResponse(toCsv(errorReportRows(rows)), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": attachment(name), "Cache-Control": "no-store" },
  });
}

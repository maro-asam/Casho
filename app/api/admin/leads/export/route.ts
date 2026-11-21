/**
 * Leads export — the admin list's current filters, as CSV or Excel. Super
 * admins only (reps can't export), capped per file and per hour, and every
 * export is written to the security log with its filters and row count.
 */
import { NextResponse, type NextRequest } from "next/server";
import * as XLSX from "xlsx";
import { getLeadActor } from "@/lib/leads/access";
import { auditLeads, exportsInLastHour } from "@/lib/leads/audit";
import { attachment, exportRows, toCsv, xlsxSafe } from "@/lib/leads/export";
import { buildLeadWhere, leadOrderBy, readLeadFilters } from "@/lib/leads/filters";
import { lostReasonLabel } from "@/lib/leads/constants";
import { repLabel } from "@/lib/leads/queries";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const MAX_ROWS = 20_000;
const MAX_EXPORTS_PER_HOUR = 20;

export async function GET(req: NextRequest) {
  const actor = await getLeadActor();
  if (actor?.kind !== "admin") return NextResponse.json({ error: "forbidden" }, { status: 403 });
  if ((await exportsInLastHour(actor.userId)) >= MAX_EXPORTS_PER_HOUR) {
    return NextResponse.json({ error: "too many exports — try again in an hour" }, { status: 429 });
  }

  const params = Object.fromEntries(req.nextUrl.searchParams);
  const filters = readLeadFilters(params);
  const format = params.format === "xlsx" ? "xlsx" : "csv";
  const where = buildLeadWhere(actor, filters);

  const total = await prisma.lead.count({ where });
  if (total > MAX_ROWS) return NextResponse.json({ error: `more than ${MAX_ROWS} rows — narrow the filters` }, { status: 413 });

  const leads = await prisma.lead.findMany({
    where,
    orderBy: leadOrderBy(filters),
    take: MAX_ROWS,
    select: {
      businessName: true,
      ownerName: true,
      phone: true,
      whatsapp: true,
      email: true,
      category: true,
      city: true,
      website: true,
      instagram: true,
      facebook: true,
      source: true,
      sourceDetails: true,
      status: true,
      priority: true,
      score: true,
      lastContactedAt: true,
      nextFollowUpAt: true,
      createdAt: true,
      convertedAt: true,
      lostReason: true,
      lostNote: true,
      assignedRep: { select: { status: true, user: { select: { name: true, email: true } } } },
    },
  });
  const rows = exportRows(
    leads.map((l) => ({ ...l, repName: repLabel(l.assignedRep), lostReason: l.status === "LOST" ? lostReasonLabel(l.lostReason, l.lostNote) : null })),
  );

  const filterMeta = Object.fromEntries(Object.entries(params).filter(([k]) => k !== "page" && k !== "format"));
  await auditLeads(actor.userId, "LEADS_EXPORTED", { format, rows: leads.length, filters: JSON.stringify(filterMeta).slice(0, 500) });

  const base = `casho-leads-${new Date().toISOString().slice(0, 10)}`;
  if (format === "xlsx") {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(xlsxSafe(rows));
    ws["!cols"] = rows[0].map((_, i) => ({ wch: i === 0 ? 30 : 18 }));
    XLSX.utils.book_append_sheet(wb, ws, "الليدز");
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": attachment(`${base}.xlsx`),
        "Cache-Control": "no-store",
      },
    });
  }
  return new NextResponse(toCsv(rows), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": attachment(`${base}.csv`), "Cache-Control": "no-store" },
  });
}

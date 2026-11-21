/** The Casho Lead Import Template: headers the importer maps on its own (+ a notes sheet in Excel). */
import { NextResponse, type NextRequest } from "next/server";
import * as XLSX from "xlsx";
import { getLeadActor } from "@/lib/leads/access";
import { attachment, templateRows, TEMPLATE_NOTES, toCsv } from "@/lib/leads/export";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const actor = await getLeadActor();
  if (actor?.kind !== "admin") return NextResponse.json({ error: "forbidden" }, { status: 403 });

  if (req.nextUrl.searchParams.get("format") === "csv") {
    return new NextResponse(toCsv(templateRows()), {
      headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": attachment("casho-lead-import-template.csv"), "Cache-Control": "no-store" },
    });
  }
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(templateRows());
  ws["!cols"] = templateRows()[0].map(() => ({ wch: 20 }));
  XLSX.utils.book_append_sheet(wb, ws, "الليدز");
  const notes = XLSX.utils.aoa_to_sheet(TEMPLATE_NOTES);
  notes["!cols"] = [{ wch: 22 }, { wch: 10 }, { wch: 70 }];
  XLSX.utils.book_append_sheet(wb, notes, "تعليمات");
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": attachment("casho-lead-import-template.xlsx"),
      "Cache-Control": "no-store",
    },
  });
}

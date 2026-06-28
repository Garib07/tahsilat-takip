import { buildStatementExportRows } from "@/lib/reports/statement-report";
import { csvResponse, rowsToCsv } from "@/lib/reports/spreadsheet";
import { formatIncludedYearsLabel, parseYearsParam } from "@/lib/reports/years";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = Number(searchParams.get("period"));
    const format = searchParams.get("format") ?? "excel";
    const customersParam = searchParams.get("customers");
    const customerIds = customersParam
      ? customersParam.split(",").map((value) => value.trim()).filter(Boolean)
      : undefined;
    const includedYears = parseYearsParam(searchParams.get("years"), period);

    if (!Number.isInteger(period) || period < 2000 || period > 2100) {
      return Response.json({ error: "Geçerli bir dönem seçiniz." }, { status: 400 });
    }

    const { rows } = await buildStatementExportRows(period, customerIds, includedYears);

    if (!rows.length) {
      return Response.json({ error: "Dışa aktarılacak ekstre bulunamadı." }, { status: 404 });
    }

    const csv = rowsToCsv(rows);
    const asExcel = format !== "csv";
    const extension = asExcel ? "xls" : "csv";
    const yearLabel = formatIncludedYearsLabel(includedYears ?? [period]).replace(/\s+/g, "");

    return csvResponse(csv, `cari-ekstre-${yearLabel}.${extension}`, asExcel);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Rapor oluşturulamadı." },
      { status: 500 }
    );
  }
}

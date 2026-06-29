import { buildStatementExportRows } from "@/lib/reports/statement-report";
import { buildStatementExcelHtml } from "@/lib/reports/statement-excel-html";
import { csvResponse, excelHtmlResponse, rowsToCsv } from "@/lib/reports/spreadsheet";
import { parseYearsParam } from "@/lib/reports/years";

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

    const { reports, office, rows } = await buildStatementExportRows(period, customerIds, includedYears);

    if (!reports.length) {
      return Response.json({ error: "Dışa aktarılacak ekstre bulunamadı." }, { status: 404 });
    }

    const years = includedYears ?? [period];
    const yearLabel =
      years.length === 1
        ? String(years[0])
        : `${years[0]}-${years[years.length - 1]}`;

    if (format === "csv") {
      if (!rows.length) {
        return Response.json({ error: "Dışa aktarılacak ekstre bulunamadı." }, { status: 404 });
      }
      return csvResponse(rowsToCsv(rows), `cari-ekstre-${yearLabel}.csv`, false);
    }

    const html = buildStatementExcelHtml(reports, office);
    return excelHtmlResponse(html, `cari-ekstre-${yearLabel}.xls`);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Rapor oluşturulamadı." },
      { status: 500 }
    );
  }
}

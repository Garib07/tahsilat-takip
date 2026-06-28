import { getExportRows } from "@/lib/store";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") ?? "summary";
  const year = searchParams.get("year");
  const month = searchParams.get("month");
  const rows = await getExportRows(type, { year, month });
  const csv = toCsv(rows);

  return new Response(`\uFEFF${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${type}.csv"`
    }
  });
}

function toCsv(rows: Record<string, unknown>[]) {
  if (!rows.length) return "";

  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(";"),
    ...rows.map((row) => headers.map((header) => escapeCell(row[header])).join(";"))
  ];

  return lines.join("\n");
}

function escapeCell(value: unknown) {
  const text = String(value ?? "");
  const escaped = text.replace(/"/g, "\"\"");
  return `"${escaped}"`;
}

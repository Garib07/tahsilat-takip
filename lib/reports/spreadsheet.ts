export function escapeSpreadsheetCell(value: unknown) {
  const text = String(value ?? "");
  const escaped = text.replace(/"/g, '""');
  return `"${escaped}"`;
}

export function formatSpreadsheetNumber(value: number) {
  return value.toFixed(2).replace(".", ",");
}

export function rowsToCsv(rows: Record<string, unknown>[]) {
  if (!rows.length) return "";

  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(";"),
    ...rows.map((row) => headers.map((header) => escapeSpreadsheetCell(row[header])).join(";"))
  ];

  return lines.join("\n");
}

function toAsciiFilename(filename: string) {
  return filename
    .replace(/\u2013|\u2014/g, "-")
    .replace(/[^\x20-\x7E]/g, "_");
}

export function csvResponse(csv: string, filename: string, asExcel = false) {
  const safeFilename = toAsciiFilename(filename);

  return new Response(`\uFEFF${csv}`, {
    headers: {
      "Content-Type": asExcel
        ? "application/vnd.ms-excel; charset=utf-8"
        : "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${safeFilename}"`
    }
  });
}

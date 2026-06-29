import {
  formatReportMoney,
  formatReportTimestamp
} from "@/lib/reports/format";
import { OfficeProfile, StatementReport } from "@/lib/types";

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatAmount(value: number, currency: string) {
  return value ? formatReportMoney(value, currency) : "";
}

function renderOfficeHeader(office: OfficeProfile) {
  const firmName = office.firmName || "";
  const phone = office.phone || office.mobile || "";
  const logo = office.logoDataUrl?.trim();

  if (!firmName && !phone && !logo) return "";

  const logoCell = logo
    ? `<td style="width:96px;text-align:right;vertical-align:top;"><img src="${escapeHtml(logo)}" alt="Logo" style="max-height:64px;max-width:96px;" /></td>`
    : `<td style="width:96px;"></td>`;

  return `
    <table style="width:100%;border-collapse:collapse;margin-bottom:12px;border-bottom:3px solid #334155;">
      <tr>
        <td style="vertical-align:top;padding-bottom:8px;">
          ${firmName ? `<div style="font-size:18px;font-weight:bold;color:#1e293b;">${escapeHtml(firmName)}</div>` : ""}
          ${phone ? `<div style="font-size:12px;color:#475569;margin-top:2px;">Tel: ${escapeHtml(phone)}</div>` : ""}
        </td>
        ${logoCell}
      </tr>
    </table>
  `;
}

function renderReportSection(
  report: StatementReport,
  currency: string,
  timestamp: { date: string; time: string },
  office: OfficeProfile | null
) {
  const lineRows = report.lines.length
    ? report.lines
        .map((line, index) => {
          const bg = index % 2 === 0 ? "#ffffff" : "#eef3f8";
          return `
            <tr style="background:${bg};">
              <td style="padding:6px 10px;border:1px solid #cbd5e1;white-space:nowrap;">${escapeHtml(line.dateLabel)}</td>
              <td style="padding:6px 10px;border:1px solid #cbd5e1;">${escapeHtml(line.description)}</td>
              <td style="padding:6px 10px;border:1px solid #cbd5e1;text-align:right;">${escapeHtml(formatAmount(line.debit, currency))}</td>
              <td style="padding:6px 10px;border:1px solid #cbd5e1;text-align:right;">${escapeHtml(formatAmount(line.credit, currency))}</td>
              <td style="padding:6px 10px;border:1px solid #cbd5e1;text-align:right;font-weight:600;">${escapeHtml(formatReportMoney(line.balance, currency))}</td>
            </tr>
          `;
        })
        .join("")
    : `
      <tr style="background:#ffffff;">
        <td colspan="5" style="padding:24px 10px;border:1px solid #cbd5e1;text-align:center;color:#64748b;">
          Bu dönemde hareket bulunmuyor.
        </td>
      </tr>
    `;

  return `
    <div style="margin-bottom:28px;">
      ${office ? renderOfficeHeader(office) : ""}

      <table style="width:100%;border-collapse:collapse;margin-bottom:12px;">
        <tr>
          <td colspan="5" style="background:#5f5f5f;color:#ffffff;text-align:center;font-size:15px;font-weight:bold;padding:8px 12px;">
            Cari Hesap Dökümü
          </td>
        </tr>
      </table>

      <table style="width:100%;border-collapse:collapse;margin-bottom:12px;font-size:12px;">
        <tr>
          <td style="width:34%;padding:2px 0;vertical-align:top;"><strong>Unvan</strong> ${escapeHtml(report.customerName)}</td>
          <td style="width:32%;padding:2px 0;text-align:center;vertical-align:top;"><strong>Dönem:</strong> ${escapeHtml(report.periodLabel)}</td>
          <td style="width:34%;padding:2px 0;text-align:right;vertical-align:top;"><strong>Tarih:</strong> ${escapeHtml(timestamp.date)}</td>
        </tr>
        <tr>
          <td style="padding:2px 0;vertical-align:top;"><strong>Telefon</strong> ${escapeHtml(report.customerPhone || "")}</td>
          <td style="padding:2px 0;text-align:center;vertical-align:top;"></td>
          <td style="padding:2px 0;text-align:right;vertical-align:top;"><strong>Saat:</strong> ${escapeHtml(timestamp.time)}</td>
        </tr>
        <tr>
          <td colspan="2" style="padding:2px 0;vertical-align:top;"><strong>Adres</strong> ${escapeHtml(report.customerAddress || "")}</td>
          <td style="padding:2px 0;text-align:right;vertical-align:top;"><strong>Son Bakiye:</strong> ${escapeHtml(formatReportMoney(report.closingBalance, currency))}</td>
        </tr>
      </table>

      <table style="width:100%;border-collapse:collapse;font-size:12px;">
        <thead>
          <tr style="background:#8ec5e8;color:#ffffff;">
            <th style="padding:8px 10px;border:1px solid #7ab6df;text-align:left;">Tarih</th>
            <th style="padding:8px 10px;border:1px solid #7ab6df;text-align:left;">Açıklama</th>
            <th style="padding:8px 10px;border:1px solid #7ab6df;text-align:right;">Borç</th>
            <th style="padding:8px 10px;border:1px solid #7ab6df;text-align:right;">Tahsilat</th>
            <th style="padding:8px 10px;border:1px solid #7ab6df;text-align:right;">Bakiye</th>
          </tr>
        </thead>
        <tbody>
          ${lineRows}
        </tbody>
      </table>

      <table style="width:320px;border-collapse:collapse;font-size:12px;margin-top:12px;margin-left:auto;">
        <thead>
          <tr style="background:#8ec5e8;color:#ffffff;">
            <th style="padding:8px 12px;border:1px solid #7ab6df;text-align:right;">Toplam Borç</th>
            <th style="padding:8px 12px;border:1px solid #7ab6df;text-align:right;">Toplam Tahsilat</th>
            <th style="padding:8px 12px;border:1px solid #7ab6df;text-align:right;">Bakiye</th>
          </tr>
        </thead>
        <tbody>
          <tr style="background:#ffffff;">
            <td style="padding:8px 12px;border:1px solid #cbd5e1;text-align:right;font-weight:600;">${escapeHtml(formatReportMoney(report.totalDebit, currency))}</td>
            <td style="padding:8px 12px;border:1px solid #cbd5e1;text-align:right;font-weight:600;">${escapeHtml(formatReportMoney(report.totalCredit, currency))}</td>
            <td style="padding:8px 12px;border:1px solid #cbd5e1;text-align:right;font-weight:600;">${escapeHtml(formatReportMoney(report.closingBalance, currency))}</td>
          </tr>
        </tbody>
      </table>
    </div>
  `;
}

export function buildStatementExcelHtml(reports: StatementReport[], office: OfficeProfile) {
  const timestamp = formatReportTimestamp();
  const currency = office.currency || "TL";

  const sections = reports.map((report) =>
    renderReportSection(report, currency, timestamp, office)
  );

  return `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
<head>
  <meta charset="utf-8" />
  <style>
    body { font-family: "Segoe UI", Arial, sans-serif; color: #0f172a; }
    table { mso-displayed-decimal-separator: ","; mso-displayed-thousand-separator: "."; }
  </style>
</head>
<body>
  ${sections.join('<div style="height:24px;"></div>')}
</body>
</html>`;
}

import {
  formatReportMoney,
  formatReportTimestamp
} from "@/lib/reports/format";
import { StatementOfficeHeader } from "@/components/statement-office-header";
import { StatementReport } from "@/lib/types";
import { OfficeProfile } from "@/lib/types";

function formatCell(value: number, currency: string) {
  return value ? formatReportMoney(value, currency) : "";
}

export function StatementPrintDocument({
  reports,
  office
}: {
  reports: StatementReport[];
  office: OfficeProfile;
}) {
  const timestamp = formatReportTimestamp();
  const currency = office.currency || "TL";

  return (
    <div className="print-document mx-auto max-w-[920px] bg-white text-[13px] text-slate-900">
      {reports.map((report, index) => (
        <section
          key={report.customerId}
          className={`statement-sheet px-6 pb-5 pt-3 ${index < reports.length - 1 ? "print-page-break" : ""}`}
        >
          <StatementOfficeHeader office={office} className="mb-3" />

          <div className="statement-title-bar mb-4 rounded-sm bg-[#5f5f5f] px-4 py-2 text-center text-base font-semibold text-white">
            Cari Hesap Dökümü
          </div>

          <div className="statement-meta mb-4 grid grid-cols-[1fr_auto_1fr] gap-x-6 gap-y-1 text-sm">
            <p>
              <span className="inline-block w-24 font-semibold">Unvan</span>
              <span className="font-medium text-slate-900">{report.customerName}</span>
            </p>
            <div aria-hidden="true" />
            <p className="text-right">
              <span className="font-semibold">Tarih:</span> {timestamp.date}
            </p>

            <p>
              <span className="inline-block w-24 font-semibold">Telefon</span>
              <span>{report.customerPhone || ""}</span>
            </p>
            <div aria-hidden="true" />
            <p className="text-right">
              <span className="font-semibold">Saat:</span> {timestamp.time}
            </p>

            <p>
              <span className="inline-block w-24 align-top font-semibold">Adres</span>
              <span>{report.customerAddress || ""}</span>
            </p>
            <p className="statement-meta-center self-center text-center whitespace-nowrap">
              <span className="font-semibold">Dönem:</span> {report.periodLabel}
            </p>
            <p className="text-right">
              <span className="font-semibold">Son Bakiye:</span>{" "}
              {formatReportMoney(report.closingBalance, currency)}
            </p>
          </div>

          <table className="statement-table w-full border-collapse">
            <thead>
              <tr className="statement-table-head text-left text-white">
                <th className="px-3 py-2 font-semibold">Tarih</th>
                <th className="px-3 py-2 font-semibold">Açıklama</th>
                <th className="px-3 py-2 text-right font-semibold">Borç</th>
                <th className="px-3 py-2 text-right font-semibold">Tahsilat</th>
                <th className="px-3 py-2 text-right font-semibold">Bakiye</th>
              </tr>
            </thead>
            <tbody>
              {report.lines.length ? (
                report.lines.map((line, lineIndex) => (
                  <tr
                    key={`${report.customerId}-${lineIndex}`}
                    className={lineIndex % 2 === 0 ? "statement-row-even" : "statement-row-odd"}
                  >
                    <td className="px-3 py-2 whitespace-nowrap">{line.dateLabel}</td>
                    <td className="px-3 py-2">{line.description}</td>
                    <td className="px-3 py-2 text-right">{formatCell(line.debit, currency)}</td>
                    <td className="px-3 py-2 text-right">{formatCell(line.credit, currency)}</td>
                    <td className="px-3 py-2 text-right font-medium">
                      {formatReportMoney(line.balance, currency)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr className="statement-row-even">
                  <td colSpan={5} className="px-3 py-8 text-center text-slate-500">
                    Bu dönemde hareket bulunmuyor.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="statement-summary-wrap mt-4 flex justify-end">
            <table className="statement-summary border-collapse text-sm">
              <thead>
                <tr className="statement-table-head text-white">
                  <th className="px-4 py-2 text-right font-semibold">Toplam Borç</th>
                  <th className="px-4 py-2 text-right font-semibold">Toplam Tahsilat</th>
                  <th className="px-4 py-2 text-right font-semibold">Bakiye</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border border-slate-300 bg-white">
                  <td className="px-4 py-2 text-right font-semibold">
                    {formatReportMoney(report.totalDebit, currency)}
                  </td>
                  <td className="px-4 py-2 text-right font-semibold">
                    {formatReportMoney(report.totalCredit, currency)}
                  </td>
                  <td className="px-4 py-2 text-right font-semibold">
                    {formatReportMoney(report.closingBalance, currency)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  );
}

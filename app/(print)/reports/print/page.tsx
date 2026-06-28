import { StatementPrintView } from "@/components/statement-print-view";
import { buildStatementReports } from "@/lib/reports/statement-report";
import { parseYearsParam } from "@/lib/reports/years";
import { getOfficeProfile } from "@/lib/store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function ReportsPrintPage({
  searchParams
}: {
  searchParams: Promise<{ period?: string; customers?: string; print?: string; years?: string }>;
}) {
  const params = await searchParams;
  const period = Number(params.period);
  const autoPrint = params.print === "1";
  const customerIds = params.customers
    ? params.customers.split(",").map((value) => value.trim()).filter(Boolean)
    : undefined;
  const includedYears = parseYearsParam(params.years, period);

  if (!Number.isInteger(period) || period < 2000 || period > 2100) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-sm text-slate-600">
        Geçerli bir dönem seçiniz.
      </div>
    );
  }

  try {
    const [reports, office] = await Promise.all([
      buildStatementReports(period, customerIds, includedYears),
      getOfficeProfile()
    ]);

    if (!reports.length) {
      return (
        <div className="flex min-h-screen items-center justify-center p-6 text-sm text-slate-600">
          Yazdırılacak ekstre bulunamadı. Cari seçili dönemde aktif mi kontrol edin.
        </div>
      );
    }

    return <StatementPrintView reports={reports} office={office} autoPrint={autoPrint} />;
  } catch (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-sm text-rose-700">
        {error instanceof Error ? error.message : "Döküm oluşturulamadı."}
      </div>
    );
  }
}

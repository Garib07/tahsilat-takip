import { CustomerCreateButton } from "@/components/customer-create-button";
import { DashboardMonthSummary } from "@/components/dashboard-month-summary";
import { DashboardReceivablePanel } from "@/components/dashboard-receivable-panel";
import { PeriodBadge } from "@/components/period-badge";
import { PageHeader } from "@/components/ui";
import { monthNames } from "@/lib/format";
import { formatPeriodLabel, parseDashboardMonth } from "@/lib/period";
import { getNextCustomerCode, getPeriodContext, getSummary } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { period } = await getPeriodContext();
  const params = await searchParams;
  const month = parseDashboardMonth(params.month, period);
  const [summary, nextCode] = await Promise.all([
    getSummary({ year: period, month }),
    getNextCustomerCode()
  ]);
  const totalCollectible = summary.reduce((total, row) => total + row.collectibleReceivable, 0);
  const totalDoubtful = summary.reduce((total, row) => total + row.doubtfulReceivable, 0);
  const totalCharges = summary.reduce((total, row) => total + row.totalCharges, 0);
  const totalPayments = summary.reduce((total, row) => total + row.totalPayments, 0);
  const monthlyCharges = summary.reduce((total, row) => total + row.selectedMonthCharge, 0);
  const monthlyPayments = summary.reduce((total, row) => total + row.selectedMonthPayments, 0);

  return (
    <>
      <PageHeader
        title="Gösterge Paneli"
        description={`${formatPeriodLabel(period)} · ${monthNames[month - 1]} özeti`}
        action={
          <div className="flex flex-wrap items-center gap-3">
            <PeriodBadge period={period} />
            <CustomerCreateButton period={period} nextCode={nextCode} label="Cari Kart" />
          </div>
        }
      />

      <DashboardMonthSummary
        period={period}
        month={month}
        monthlyCharges={monthlyCharges}
        monthlyPayments={monthlyPayments}
      />

      <DashboardReceivablePanel
        period={period}
        summary={summary}
        totalCollectible={totalCollectible}
        totalDoubtful={totalDoubtful}
        totalCharges={totalCharges}
        totalPayments={totalPayments}
      />
    </>
  );
}

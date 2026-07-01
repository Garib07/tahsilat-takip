import { DashboardMonthSelector } from "@/components/dashboard-month-selector";
import { Card, StatCard } from "@/components/ui";
import { formatCurrency, monthNames } from "@/lib/format";

export function DashboardMonthSummary({
  period,
  month,
  monthlyCharges,
  monthlyPayments
}: {
  period: number;
  month: number;
  monthlyCharges: number;
  monthlyPayments: number;
}) {
  const monthLabel = monthNames[month - 1];

  return (
    <Card className="mb-8">
      <div className="border-b border-slate-100 px-6 py-4">
        <h2 className="text-lg font-semibold text-slate-900">Aylık Özet</h2>
        <p className="mt-1 text-sm text-slate-500">
          {period} döneminde görüntülenecek ayı seçin.
        </p>
      </div>
      <div className="space-y-5 px-6 py-5">
        <DashboardMonthSelector period={period} selectedMonth={month} />
        <div className="grid gap-4 sm:grid-cols-2">
          <StatCard
            title={`${monthLabel} Tahakkuk`}
            value={formatCurrency(monthlyCharges)}
          />
          <StatCard
            title={`${monthLabel} Tahsilat`}
            value={formatCurrency(monthlyPayments)}
            tone="success"
          />
        </div>
      </div>
    </Card>
  );
}

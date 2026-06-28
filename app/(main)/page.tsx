import Link from "next/link";
import { CustomerCreateButton } from "@/components/customer-create-button";
import { PeriodBadge } from "@/components/period-badge";
import { Card, PageHeader, StatCard } from "@/components/ui";
import { formatCurrency, monthNames } from "@/lib/format";
import { formatPeriodLabel } from "@/lib/period";
import { getNextCustomerCode, getPeriodContext, getSummary } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { period, month } = await getPeriodContext();
  const [summary, nextCode] = await Promise.all([
    getSummary({ year: period, month }),
    getNextCustomerCode()
  ]);
  const totalReceivable = summary.reduce(
    (total, row) => total + (row.balance > 0 ? row.balance : 0),
    0
  );
  const totalCharges = summary.reduce((total, row) => total + row.totalCharges, 0);
  const totalPayments = summary.reduce((total, row) => total + row.totalPayments, 0);

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
        }      />

      <section className="mb-8 grid gap-4 md:grid-cols-3">
        <StatCard title="Toplam Alacak" value={formatCurrency(totalReceivable)} tone="danger" />
        <StatCard title="Toplam Tahsilat" value={formatCurrency(totalPayments)} tone="success" />
        <StatCard title="Toplam Tahakkuk" value={formatCurrency(totalCharges)} />
      </section>

      <Card>
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">Cari Özet</h2>
          <p className="text-sm text-slate-500">
            {period} dönemi carileri · borçlular hafif kırmızı ile vurgulanır.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-6 py-3 font-medium">Cari</th>
                <th className="px-6 py-3 font-medium">Aylık Ücret</th>
                <th className="px-6 py-3 font-medium">Toplam Tahakkuk</th>
                <th className="px-6 py-3 font-medium">Toplam Tahsilat</th>
                <th className="px-6 py-3 font-medium">Bakiye</th>
              </tr>
            </thead>
            <tbody>
              {summary.map((row) => (
                <tr
                  key={row.customerId}
                  className={`border-t border-slate-100 ${row.balance > 0 ? "bg-rose-50/70" : ""}`}
                >
                  <td className="px-6 py-3">
                    <Link
                      href={`/customers/${row.customerId}`}
                      className="font-medium text-slate-900 hover:underline"
                    >
                      {row.customerName}
                    </Link>
                    {row.title ? <p className="text-xs text-slate-500">{row.title}</p> : null}
                  </td>
                  <td className="px-6 py-3">{formatCurrency(row.monthlyFee)}</td>
                  <td className="px-6 py-3">{formatCurrency(row.totalCharges)}</td>
                  <td className="px-6 py-3">{formatCurrency(row.totalPayments)}</td>
                  <td
                    className={`px-6 py-3 font-medium ${row.balance > 0 ? "text-rose-700" : "text-slate-700"}`}
                  >
                    {formatCurrency(row.balance)}
                  </td>
                </tr>
              ))}
              {!summary.length ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    {period} döneminde cari kaydı yok.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}

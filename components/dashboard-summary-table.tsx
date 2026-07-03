"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CustomerSearchInput } from "@/components/customer-search-input";
import { ReceivableStatusBadge } from "@/components/receivable-status-badge";
import { ReceivableStatusFilter } from "@/components/receivable-status-filter";
import { Card } from "@/components/ui";
import { formatCurrency } from "@/lib/format";
import { matchesSummaryRowSearch } from "@/lib/customer-search";
import { ReceivableStatus } from "@/lib/receivables";
import { SummaryRow } from "@/lib/types";

export function DashboardSummaryTable({
  period,
  summary
}: {
  period: number;
  summary: SummaryRow[];
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | ReceivableStatus>("all");

  const filteredSummary = useMemo(() => {
    return summary.filter((row) => {
      if (statusFilter !== "all" && row.receivableStatus !== statusFilter) return false;
      return matchesSummaryRowSearch(row, search);
    });
  }, [summary, search, statusFilter]);

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Cari Özet</h2>
          <p className="text-sm text-slate-500">
            {period} dönemi carileri · şüpheli alacaklar amber ile vurgulanır.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <ReceivableStatusFilter value={statusFilter} onChange={setStatusFilter} />
          <CustomerSearchInput
            value={search}
            onChange={setSearch}
            className="w-full min-w-[14rem] sm:w-64"
          />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-6 py-3 font-medium">Cari</th>
              <th className="px-6 py-3 font-medium">Alacak</th>
              <th className="px-6 py-3 font-medium">Aylık Ücret</th>
              <th className="px-6 py-3 font-medium">Toplam Tahakkuk</th>
              <th className="px-6 py-3 font-medium">Toplam Tahsilat</th>
              <th className="px-6 py-3 font-medium">Bakiye</th>
            </tr>
          </thead>
          <tbody>
            {filteredSummary.map((row) => (
              <tr
                key={row.customerId}
                className={`border-t border-slate-100 ${
                  row.receivableStatus === "doubtful" && row.balance > 0
                    ? "bg-amber-50/80"
                    : row.balance > 0
                      ? "bg-rose-50/70"
                      : ""
                }`}
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
                <td className="px-6 py-3">
                  <ReceivableStatusBadge status={row.receivableStatus} />
                </td>
                <td className="px-6 py-3">{formatCurrency(row.monthlyFee)}</td>
                <td className="px-6 py-3">{formatCurrency(row.totalCharges)}</td>
                <td className="px-6 py-3">{formatCurrency(row.totalPayments)}</td>
                <td
                  className={`px-6 py-3 font-medium ${row.balance > 0 ? "text-rose-700" : "text-slate-700"}`}
                >
                  <div>{formatCurrency(row.balance)}</div>
                  {row.doubtfulReceivable > 0 ? (
                    <p className="mt-0.5 text-xs font-normal text-amber-800">
                      Şüpheli: {formatCurrency(row.doubtfulReceivable)}
                    </p>
                  ) : null}
                </td>
              </tr>
            ))}
            {!summary.length ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                  {period} döneminde cari kaydı yok.
                </td>
              </tr>
            ) : !filteredSummary.length ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                  Aramanızla eşleşen cari bulunamadı.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

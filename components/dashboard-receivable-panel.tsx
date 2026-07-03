"use client";

import { useState } from "react";
import { DashboardSummaryTable } from "@/components/dashboard-summary-table";
import { StatCard } from "@/components/ui";
import { formatCurrency } from "@/lib/format";
import { SummaryRow } from "@/lib/types";

export function DashboardReceivablePanel({
  period,
  summary,
  totalCollectible,
  totalDoubtful,
  totalCharges,
  totalPayments
}: {
  period: number;
  summary: SummaryRow[];
  totalCollectible: number;
  totalDoubtful: number;
  totalCharges: number;
  totalPayments: number;
}) {
  const [showDoubtful, setShowDoubtful] = useState(false);
  const totalReceivable = totalCollectible + totalDoubtful;
  const doubtfulCount = summary.filter((row) => row.doubtfulReceivable > 0).length;

  return (
    <>
      <section className="mb-8">
        <div className="mb-4 flex flex-wrap items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => setShowDoubtful((value) => !value)}
            className={`rounded-lg border px-4 py-2.5 text-sm font-medium transition ${
              showDoubtful
                ? "border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            {showDoubtful
              ? "Şüpheli Alacakları Gizle"
              : doubtfulCount > 0
                ? `Şüpheli Alacaklar (${doubtfulCount})`
                : "Şüpheli Alacaklar"}
          </button>
        </div>

        <div
          className={`grid gap-4 ${showDoubtful ? "md:grid-cols-2 xl:grid-cols-4" : "md:grid-cols-3"}`}
        >
          {showDoubtful ? (
            <>
              <StatCard
                title="Takip Edilebilir Alacak"
                value={formatCurrency(totalCollectible)}
                tone="danger"
              />
              <StatCard
                title="Şüpheli Alacak"
                value={formatCurrency(totalDoubtful)}
                tone="warning"
              />
            </>
          ) : (
            <StatCard title="Toplam Alacak" value={formatCurrency(totalReceivable)} tone="danger" />
          )}
          <StatCard title="Toplam Tahsilat" value={formatCurrency(totalPayments)} tone="success" />
          <StatCard title="Toplam Tahakkuk" value={formatCurrency(totalCharges)} />
        </div>
      </section>

      <DashboardSummaryTable period={period} summary={summary} showDoubtful={showDoubtful} />
    </>
  );
}

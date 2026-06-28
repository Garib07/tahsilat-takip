"use client";

import { useState } from "react";
import { StatementYearSelector } from "@/components/statement-year-selector";
import {
  buildStatementExportUrl,
  buildStatementPrintUrl
} from "@/lib/reports/urls";
import { resolveIncludedYears } from "@/lib/reports/years";

const buttonClass =
  "rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50";

export function CustomerReportActions({
  customerId,
  period,
  activePeriods,
  compact = false
}: {
  customerId: string;
  period: number;
  activePeriods?: number[];
  compact?: boolean;
}) {
  const customerIds = [customerId];
  const [selectedYears, setSelectedYears] = useState<number[]>(() => [period]);
  const [showYearPicker, setShowYearPicker] = useState(false);
  const years = resolveIncludedYears(period, selectedYears, activePeriods);

  function openPrint() {
    window.open(buildStatementPrintUrl(period, customerIds, years), "_blank", "noopener,noreferrer");
  }

  if (compact) {
    return (
      <>
        <div className="flex flex-wrap items-center gap-1">
          <button
            type="button"
            onClick={() => setShowYearPicker(true)}
            className={buttonClass}
          >
            Excel
          </button>
          <button type="button" onClick={() => setShowYearPicker(true)} className={buttonClass}>
            Döküm
          </button>
        </div>

        {showYearPicker ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
            <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
              <h3 className="text-base font-semibold text-slate-900">Döküm Yılları</h3>
              <p className="mt-1 text-sm text-slate-500">Hangi yılların dahil edileceğini seçin.</p>
              <div className="mt-4">
                <StatementYearSelector
                  period={period}
                  activePeriods={activePeriods}
                  selectedYears={selectedYears}
                  onChange={setSelectedYears}
                />
              </div>
              <div className="mt-4 flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowYearPicker(false)}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
                >
                  İptal
                </button>
                <a
                  href={buildStatementExportUrl(period, customerIds, "excel", years)}
                  className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-800 hover:bg-emerald-100"
                  onClick={() => setShowYearPicker(false)}
                >
                  Excel
                </a>
                <button
                  type="button"
                  onClick={() => {
                    setShowYearPicker(false);
                    openPrint();
                  }}
                  className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
                >
                  Döküm
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </>
    );
  }

  return (
    <div className="space-y-3">
      <StatementYearSelector
        period={period}
        activePeriods={activePeriods}
        selectedYears={selectedYears}
        onChange={setSelectedYears}
      />
      <div className="flex flex-wrap gap-2">
        <a
          href={buildStatementExportUrl(period, customerIds, "excel", years)}
          className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-800 hover:bg-emerald-100"
        >
          Excel İndir
        </a>
        <a
          href={buildStatementExportUrl(period, customerIds, "csv", years)}
          className={buttonClass}
        >
          CSV
        </a>
        <button
          type="button"
          onClick={openPrint}
          className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800"
        >
          Cari Hesap Dökümü
        </button>
      </div>
    </div>
  );
}

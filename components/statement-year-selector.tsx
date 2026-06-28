"use client";

import {
  availableReportYears,
  formatIncludedYearsLabel,
  resolveIncludedYears,
  toggleYearInList
} from "@/lib/reports/years";

export function StatementYearSelector({
  period,
  activePeriods,
  selectedYears,
  onChange,
  scope = "customer"
}: {
  period: number;
  activePeriods?: number[];
  selectedYears: number[];
  onChange: (years: number[]) => void;
  scope?: "customer" | "customers";
}) {
  const years = availableReportYears(period, activePeriods);
  const resolvedYears = resolveIncludedYears(period, selectedYears, activePeriods);

  function handleChange(next: number[]) {
    onChange(resolveIncludedYears(period, next, activePeriods));
  }

  function selectOnlyCurrent() {
    handleChange([period]);
  }

  function selectAll() {
    handleChange(years);
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">Dahil Edilecek Yıllar</h3>
          <p className="text-xs text-slate-500">
            Seçili: <strong>{formatIncludedYearsLabel(resolvedYears)}</strong>
          </p>
        </div>
        <div className="flex gap-2 text-xs">
          <button
            type="button"
            onClick={selectOnlyCurrent}
            className="rounded-md border border-slate-200 bg-white px-2 py-1 text-slate-600 hover:bg-slate-50"
          >
            Sadece {period}
          </button>
          <button
            type="button"
            onClick={selectAll}
            className="rounded-md border border-slate-200 bg-white px-2 py-1 text-slate-600 hover:bg-slate-50"
          >
            {activePeriods?.length ? "Tüm aktif yıllar" : "Tüm yıllar"}
          </button>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {years.map((year) => {
          const checked = resolvedYears.includes(year);
          return (
            <label
              key={year}
              className={`cursor-pointer rounded-lg border px-3 py-1.5 text-sm transition ${
                checked
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => {
                  const next = toggleYearInList(resolvedYears, year);
                  handleChange(next.length ? next : [period]);
                }}
                className="sr-only"
              />
              {year}
            </label>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-slate-500">
        {activePeriods?.length
          ? scope === "customers"
            ? "Listedeki yıllar carilerin aktif olduğu dönemlerdir. Seçili aralıktaki hareketler tek ekstrede listelenir."
            : "Listedeki yıllar carinin aktif olduğu dönemlerdir. Seçili aralıktaki hareketler tek ekstrede listelenir."
          : "Önceki yılları işaretlerseniz dökümde seçili aralıktaki tüm yılların hareketleri tek ekstrede listelenir (ara yıllar otomatik dahil edilir)."}
      </p>
    </div>
  );
}

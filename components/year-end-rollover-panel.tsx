"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  fetchYearEndRolloverPreviewAction,
  performYearEndRolloverAction
} from "@/lib/actions";
import { formatCurrency } from "@/lib/format";
import { periodYearOptions } from "@/lib/period";
import { YearEndRolloverPreviewRow } from "@/lib/types";

export function YearEndRolloverPanel({ currentPeriod }: { currentPeriod: number }) {
  const router = useRouter();
  const years = periodYearOptions();
  const [fromYear, setFromYear] = useState(currentPeriod - 1);
  const [toYear, setToYear] = useState(currentPeriod);
  const [rows, setRows] = useState<YearEndRolloverPreviewRow[]>([]);
  const [message, setMessage] = useState("");
  const [previewPending, startPreviewTransition] = useTransition();
  const [submitPending, startSubmitTransition] = useTransition();

  function loadPreview(nextFromYear = fromYear, nextToYear = toYear) {
    setMessage("");
    startPreviewTransition(async () => {
      try {
        const preview = await fetchYearEndRolloverPreviewAction(nextFromYear, nextToYear);
        setRows(preview.rows);
      } catch (error) {
        setRows([]);
        setMessage(error instanceof Error ? error.message : "Önizleme yüklenemedi.");
      }
    });
  }

  useEffect(() => {
    loadPreview(fromYear, toYear);
  }, [fromYear, toYear]);

  function handleFromYearChange(value: number) {
    setFromYear(value);
    setToYear(value + 1);
  }

  function handleSubmit() {
    setMessage("");
    startSubmitTransition(async () => {
      try {
        const result = await performYearEndRolloverAction({ fromYear, toYear });
        const parts = [
          `${result.created} yeni devir`,
          result.updated ? `${result.updated} güncelleme` : "",
          result.skipped ? `${result.skipped} sıfır bakiye atlandı` : "",
          result.activated ? `${result.activated} cari ${toYear} dönemine aktif edildi` : ""
        ].filter(Boolean);
        setMessage(`Devir tamamlandı: ${parts.join(" · ")}.`);
        router.refresh();
        loadPreview(fromYear, toYear);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Devir işlemi başarısız.");
      }
    });
  }

  const totalBalance = rows.reduce((total, row) => total + row.closingBalance, 0);

  return (
    <div className="mt-8 rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-6 py-5">
        <h2 className="text-lg font-semibold text-slate-900">Yıl Sonu Devir</h2>
        <p className="mt-1 text-sm text-slate-500">
          Seçilen yılın kapanış bakiyesi sonraki yıla devir bakiyesi olarak aktarılır. Hedef yılda
          ekstrenin ilk satırında görünür.
        </p>
      </div>

      <div className="space-y-5 px-6 py-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Kaynak Yıl (kapanış)</span>
            <select
              value={fromYear}
              onChange={(event) => handleFromYearChange(Number(event.target.value))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-slate-400"
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Hedef Yıl (devir)</span>
            <input
              readOnly
              value={String(toYear)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700"
            />
          </label>
        </div>

        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Kod</th>
                <th className="px-4 py-3 font-medium">Unvan</th>
                <th className="px-4 py-3 font-medium">{fromYear} Kapanış</th>
                <th className="px-4 py-3 font-medium">Durum</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.customerId} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-mono text-xs text-slate-600">
                    {row.customerCode || "—"}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900">{row.customerName}</td>
                  <td
                    className={`px-4 py-3 font-medium ${
                      row.closingBalance > 0
                        ? "text-rose-700"
                        : row.closingBalance < 0
                          ? "text-emerald-700"
                          : "text-slate-700"
                    }`}
                  >
                    {formatCurrency(row.closingBalance)}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {row.alreadyCarried ? (
                      <>
                        Devir var
                        {row.existingBalance !== null && row.existingBalance !== row.closingBalance
                          ? " · güncellenecek"
                          : ""}
                      </>
                    ) : (
                      "Yeni devir"
                    )}
                  </td>
                </tr>
              ))}
              {!rows.length && !previewPending ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-slate-500">
                    {fromYear} döneminde devredilecek bakiye bulunmuyor.
                  </td>
                </tr>
              ) : null}
              {previewPending ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-slate-500">
                    Önizleme yükleniyor...
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        {rows.length ? (
          <p className="text-sm text-slate-600">
            Toplam devir bakiyesi: <strong>{formatCurrency(totalBalance)}</strong>
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-5">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitPending || previewPending || !rows.length}
            className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {submitPending ? "Devrediliyor..." : `${fromYear} → ${toYear} Devir Yap`}
          </button>
        </div>

        {message ? <p className="text-sm text-slate-600">{message}</p> : null}
      </div>
    </div>
  );
}

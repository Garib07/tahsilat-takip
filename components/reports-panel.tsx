"use client";

import { useMemo, useState } from "react";
import { PeriodBadge } from "@/components/period-badge";
import { Card, PageHeader } from "@/components/ui";
import { getCustomerFeeForYear } from "@/lib/fees";
import { formatCurrency } from "@/lib/format";
import { formatPeriodLabel } from "@/lib/period";
import { Customer } from "@/lib/types";
import {
  buildStatementExportUrl,
  buildStatementPrintUrl
} from "@/lib/reports/urls";
import { resolveIncludedYears, collectActivePeriods } from "@/lib/reports/years";
import { StatementYearSelector } from "@/components/statement-year-selector";
export function ReportsPanel({
  period,
  customers
}: {
  period: number;
  customers: Customer[];
}) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(customers.map((customer) => customer.id))
  );
  const [search, setSearch] = useState("");
  const [selectedYears, setSelectedYears] = useState<number[]>(() => [period]);
  const filteredCustomers = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("tr-TR");
    if (!query) return customers;

    return customers.filter((customer) => {
      const haystack = [customer.code, customer.name, customer.authorizedPerson]
        .join(" ")
        .toLocaleLowerCase("tr-TR");
      return haystack.includes(query);
    });
  }, [customers, search]);

  const activePeriods = useMemo(
    () => collectActivePeriods(customers, period),
    [customers, period]
  );

  const selectedCustomerIds = customers
    .filter((customer) => selectedIds.has(customer.id))
    .map((customer) => customer.id);
  const years = resolveIncludedYears(period, selectedYears, activePeriods);
  const allFilteredSelected =
    filteredCustomers.length > 0 &&
    filteredCustomers.every((customer) => selectedIds.has(customer.id));

  function toggleCustomer(id: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAllFiltered() {
    setSelectedIds((current) => {
      const next = new Set(current);
      for (const customer of filteredCustomers) {
        next.add(customer.id);
      }
      return next;
    });
  }

  function clearAllFiltered() {
    setSelectedIds((current) => {
      const next = new Set(current);
      for (const customer of filteredCustomers) {
        next.delete(customer.id);
      }
      return next;
    });
  }

  function openPrintPreview() {
    if (!selectedCustomerIds.length) return;
    window.open(
      buildStatementPrintUrl(period, selectedCustomerIds, years),
      "_blank",
      "noopener,noreferrer"
    );
  }
  return (
    <>
      <PageHeader
        title="Raporlar"
        description={`${formatPeriodLabel(period)} · cari ekstre dökümü, Excel ve yazdırma`}
        action={<PeriodBadge period={period} />}
      />

      <Card className="mb-6">
        <div className="border-b border-slate-100 px-6 py-5">
          <h2 className="text-lg font-semibold text-slate-900">Cari Hesap Dökümü</h2>
          <p className="mt-1 text-sm text-slate-500">
            Seçili carilerin dönem ekstresini Excel dosyası olarak indirebilir veya yazdırıp PDF
            alabilirsiniz.
          </p>
        </div>

        <div className="space-y-5 px-6 py-5">
          <StatementYearSelector
            period={period}
            activePeriods={activePeriods}
            selectedYears={selectedYears}
            onChange={setSelectedYears}
            scope="customers"
          />

          <div className="flex flex-wrap gap-3">
            <a
              href={buildStatementExportUrl(period, selectedCustomerIds, "excel", years)}              className={`rounded-lg px-4 py-2.5 text-sm font-medium text-white ${
                selectedCustomerIds.length
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "pointer-events-none bg-slate-300"
              }`}
            >
              Excel İndir
            </a>
            <a
              href={buildStatementExportUrl(period, selectedCustomerIds, "csv", years)}              className={`rounded-lg border px-4 py-2.5 text-sm font-medium ${
                selectedCustomerIds.length
                  ? "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  : "pointer-events-none border-slate-100 bg-slate-100 text-slate-400"
              }`}
            >
              CSV İndir
            </a>
          <button
            type="button"
            onClick={openPrintPreview}
            disabled={!selectedCustomerIds.length}
            className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            Cari Hesap Dökümü
          </button>
          </div>

          <p className="text-xs text-slate-500">
            PDF için <strong>Yazdır / PDF</strong> butonuna tıklayın; açılan pencerede yazıcı
            seçiminden &quot;Microsoft Print to PDF&quot; veya &quot;PDF olarak kaydet&quot; seçeneğini
            kullanın.
          </p>
        </div>
      </Card>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-4">
          <div>
            <h3 className="font-semibold text-slate-900">Cariler</h3>
            <p className="text-sm text-slate-500">
              {selectedCustomerIds.length} / {customers.length} seçili
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Kod veya unvan ara..."
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-slate-400"
            />
            <button
              type="button"
              onClick={allFilteredSelected ? clearAllFiltered : selectAllFiltered}
              className="rounded-md border border-slate-200 px-2 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
            >
              {allFilteredSelected ? "Listeyi temizle" : "Listeyi seç"}
            </button>
          </div>
        </div>

        <div className="max-h-[28rem] overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="sticky top-0 bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-6 py-3 font-medium">
                  <span className="sr-only">Seç</span>
                </th>
                <th className="px-6 py-3 font-medium">Kod</th>
                <th className="px-6 py-3 font-medium">Unvan</th>
                <th className="px-6 py-3 font-medium">Aylık Ücret</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((customer) => {
                const checked = selectedIds.has(customer.id);
                const fee = getCustomerFeeForYear(customer, period);

                return (
                  <tr
                    key={customer.id}
                    className={`border-t border-slate-100 ${checked ? "bg-white" : "bg-slate-50/60"}`}
                  >
                    <td className="px-6 py-3">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleCustomer(customer.id)}
                        className="rounded border-slate-300"
                      />
                    </td>
                    <td className="px-6 py-3 font-mono text-xs text-slate-600">
                      {customer.code || "—"}
                    </td>
                    <td className="px-6 py-3 font-medium text-slate-900">{customer.name}</td>
                    <td className="px-6 py-3 text-slate-600">{formatCurrency(fee)}</td>
                  </tr>
                );
              })}
              {!filteredCustomers.length ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                    {customers.length
                      ? "Aramanızla eşleşen cari bulunamadı."
                      : `${period} döneminde aktif cari yok.`}
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

"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { generateMonthlyChargesAction } from "@/lib/actions";
import { isMonthlyCharge } from "@/lib/charges";
import { isMonthlyChargeAllowed } from "@/lib/customer-closure";
import { getCustomerFeeForYear } from "@/lib/fees";
import { formatCurrency, monthNames, formatDateLabel } from "@/lib/format";
import { Charge, Customer } from "@/lib/types";

function toggleInList<T>(list: T[], value: T) {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

export function GenerateChargesPanel({
  initialMonth,
  period,
  customers,
  charges
}: {
  initialMonth: number;
  period: number;
  customers: Customer[];
  charges: Charge[];
}) {
  const router = useRouter();
  const [selectedMonths, setSelectedMonths] = useState<number[]>([initialMonth]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(customers.map((customer) => customer.id))
  );
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  const chargeKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const charge of charges) {
      if (isMonthlyCharge(charge)) {
        keys.add(`${charge.customerId}-${charge.month}`);
      }
    }
    return keys;
  }, [charges]);

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

  const allFilteredSelected =
    filteredCustomers.length > 0 &&
    filteredCustomers.every((customer) => selectedIds.has(customer.id));

  function toggleMonth(month: number) {
    setSelectedMonths((current) => toggleInList(current, month).sort((a, b) => a - b));
  }

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

  function selectAllMonths() {
    setSelectedMonths(Array.from({ length: 12 }, (_, index) => index + 1));
  }

  function clearAllMonths() {
    setSelectedMonths([]);
  }

  function pendingCountForCustomer(customer: Customer) {
    return selectedMonths.filter(
      (month) =>
        isMonthlyChargeAllowed(customer.closedAt, period, month) &&
        !chargeKeys.has(`${customer.id}-${month}`)
    ).length;
  }

  function blockedMonthsForCustomer(customer: Customer) {
    return selectedMonths.filter(
      (month) => !isMonthlyChargeAllowed(customer.closedAt, period, month)
    ).length;
  }

  function handleGenerate() {
    setMessage("");

    if (!selectedMonths.length) {
      setMessage("En az bir ay seçiniz.");
      return;
    }

    const customerIds = customers.filter((customer) => selectedIds.has(customer.id)).map((c) => c.id);
    if (!customerIds.length) {
      setMessage("En az bir mükellef seçiniz.");
      return;
    }

    startTransition(async () => {
      try {
        const result = await generateMonthlyChargesAction({
          year: period,
          months: selectedMonths,
          customerIds
        });

        const parts = [`${result.created.length} tahakkuk oluşturuldu.`];
        if (result.skipped > 0) {
          parts.push(`${result.skipped} kayıt zaten vardı, atlandı.`);
        }
        if (result.skippedClosed > 0) {
          parts.push(`${result.skippedClosed} kayıt kapanış tarihi nedeniyle atlandı.`);
        }
        setMessage(parts.join(" "));
        router.refresh();
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Tahakkuk oluşturulamadı.");
      }
    });
  }

  const selectedCustomerCount = customers.filter((customer) => selectedIds.has(customer.id)).length;

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-6 py-5">
        <h2 className="text-lg font-semibold text-slate-900">Toplu Tahakkuk</h2>
        <p className="mt-1 text-sm text-slate-500">
          {period} dönemi için istediğiniz mükellefleri ve ayları seçerek tahakkuk oluşturun. Tek bir
          firmaya birden fazla ay da seçebilirsiniz.
        </p>
      </div>

      <div className="space-y-6 px-6 py-5">
        <section>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-slate-800">Aylar</h3>
            <div className="flex gap-2 text-xs">
              <button
                type="button"
                onClick={selectAllMonths}
                className="rounded-md border border-slate-200 px-2 py-1 text-slate-600 hover:bg-slate-50"
              >
                Tüm aylar
              </button>
              <button
                type="button"
                onClick={clearAllMonths}
                className="rounded-md border border-slate-200 px-2 py-1 text-slate-600 hover:bg-slate-50"
              >
                Temizle
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {monthNames.map((name, index) => {
              const month = index + 1;
              const checked = selectedMonths.includes(month);
              return (
                <label
                  key={name}
                  className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
                    checked
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleMonth(month)}
                    className="sr-only"
                  />
                  {name}
                </label>
              );
            })}
          </div>
        </section>

        <section>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-800">Mükellefler</h3>
              <p className="text-xs text-slate-500">
                {selectedCustomerCount} / {customers.length} seçili
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

          <div className="max-h-72 overflow-auto rounded-lg border border-slate-200">
            <table className="min-w-full text-sm">
              <thead className="sticky top-0 bg-slate-50 text-left text-slate-500">
                <tr>
                  <th className="px-4 py-2 font-medium">
                    <span className="sr-only">Seç</span>
                  </th>
                  <th className="px-4 py-2 font-medium">Kod</th>
                  <th className="px-4 py-2 font-medium">Unvan</th>
                  <th className="px-4 py-2 font-medium">Aylık Ücret</th>
                  <th className="px-4 py-2 font-medium">Seçili aylarda</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer) => {
                  const checked = selectedIds.has(customer.id);
                  const pendingMonths = pendingCountForCustomer(customer);
                  const blockedMonths = blockedMonthsForCustomer(customer);
                  const allowedMonths = selectedMonths.filter((month) =>
                    isMonthlyChargeAllowed(customer.closedAt, period, month)
                  ).length;
                  const existingMonths = allowedMonths - pendingMonths;

                  return (
                    <tr
                      key={customer.id}
                      className={`border-t border-slate-100 ${checked ? "bg-white" : "bg-slate-50/60"}`}
                    >
                      <td className="px-4 py-2">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleCustomer(customer.id)}
                          className="rounded border-slate-300"
                        />
                      </td>
                      <td className="px-4 py-2 font-mono text-xs text-slate-600">
                        {customer.code || "—"}
                      </td>
                      <td className="px-4 py-2 font-medium text-slate-900">
                        <div>{customer.name}</div>
                        {customer.closedAt ? (
                          <div className="text-xs font-normal text-amber-700">
                            Kapanış: {formatDateLabel(customer.closedAt)}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-4 py-2 text-slate-600">
                        {formatCurrency(getCustomerFeeForYear(customer, period))}
                      </td>
                      <td className="px-4 py-2 text-xs text-slate-500">
                        {!selectedMonths.length ? (
                          "Ay seçin"
                        ) : blockedMonths && !allowedMonths ? (
                          <span className="text-amber-700">Kapanış tarihi nedeniyle yok</span>
                        ) : pendingMonths ? (
                          <>
                            <span className="text-emerald-700">{pendingMonths} yeni</span>
                            {existingMonths ? (
                              <span className="text-slate-400"> · {existingMonths} mevcut</span>
                            ) : null}
                            {blockedMonths ? (
                              <span className="text-amber-700"> · {blockedMonths} kapanış</span>
                            ) : null}
                          </>
                        ) : blockedMonths ? (
                          <span className="text-slate-400">
                            Tümü mevcut · {blockedMonths} kapanış
                          </span>
                        ) : (
                          <span className="text-slate-400">Tümü mevcut</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {!filteredCustomers.length ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                      {customers.length
                        ? "Aramanızla eşleşen mükellef bulunamadı."
                        : `${period} döneminde aktif cari yok.`}
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>

        <div className="flex flex-wrap items-center gap-4 border-t border-slate-100 pt-5">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={pending || !selectedMonths.length || !selectedCustomerCount}
            className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {pending ? "Oluşturuluyor..." : "Seçili Cariler İçin Tahakkuk Oluştur"}
          </button>
          <p className="text-sm text-slate-500">
            {selectedCustomerCount} mükellef · {selectedMonths.length} ay
          </p>
        </div>

        {message ? <p className="text-sm text-slate-600">{message}</p> : null}
      </div>
    </div>
  );
}

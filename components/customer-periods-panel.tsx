"use client";

import { useMemo, useState } from "react";
import { ActivateCustomerModal } from "@/components/activate-customer-modal";
import { formatActivePeriods } from "@/lib/customer-periods";
import { Customer } from "@/lib/types";

function periodYears() {
  const current = new Date().getFullYear();
  return Array.from({ length: 16 }, (_, index) => current - 10 + index);
}

export function CustomerPeriodsPanel({
  customer,
  viewPeriod,
  embedded = false
}: {
  customer: Customer;
  viewPeriod: number;
  embedded?: boolean;
}) {
  const [targetYear, setTargetYear] = useState<number | "">("");
  const [showModal, setShowModal] = useState(false);

  const availableYears = useMemo(
    () => periodYears().filter((year) => !customer.activePeriods.includes(year)),
    [customer.activePeriods]
  );

  function openModal() {
    if (!targetYear) return;
    setShowModal(true);
  }

  return (
    <div
      className={
        embedded
          ? "mt-6 border-t border-slate-100 pt-6"
          : "mb-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
      }
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Aktif Dönemler</h2>
          <p className="mt-1 text-sm text-slate-500">
            Bu cari şu dönemlerde görünür:{" "}
            <strong>{formatActivePeriods(customer.activePeriods)}</strong>
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Şu an {viewPeriod} dönemi ekstresine bakıyorsunuz.
          </p>
        </div>

        {availableYears.length ? (
          <div className="flex flex-wrap items-end gap-2">
            <label className="text-sm">
              <span className="mb-1 block font-medium text-slate-700">Dönem ekle</span>
              <select
                value={targetYear}
                onChange={(event) =>
                  setTargetYear(event.target.value ? Number(event.target.value) : "")
                }
                className="rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-slate-400"
              >
                <option value="">Yıl seçin</option>
                {availableYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              disabled={!targetYear}
              onClick={openModal}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              Döneme Aktif Et
            </button>
          </div>
        ) : null}
      </div>

      {showModal && targetYear ? (
        <ActivateCustomerModal
          customer={customer}
          period={Number(targetYear)}
          onClose={() => {
            setShowModal(false);
            setTargetYear("");
          }}
        />
      ) : null}
    </div>
  );
}

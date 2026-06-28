"use client";

import { useState } from "react";
import { ActivateCustomerModal } from "@/components/activate-customer-modal";
import { Card } from "@/components/ui";
import { formatActivePeriods } from "@/lib/customer-periods";
import { Customer } from "@/lib/types";

export function ActivateCustomerPanel({
  customers,
  period
}: {
  customers: Customer[];
  period: number;
}) {
  const [selected, setSelected] = useState<Customer | null>(null);

  if (!customers.length) return null;

  return (
    <>
      <Card className="mb-6">
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">Önceki Dönem Carileri</h2>
          <p className="text-sm text-slate-500">
            Başka yıllarda açılmış carileri {period} dönemine aktif edebilirsiniz.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-6 py-3 font-medium">Kod</th>
                <th className="px-6 py-3 font-medium">Unvan</th>
                <th className="px-6 py-3 font-medium">Aktif Dönemler</th>
                <th className="px-6 py-3 font-medium">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id} className="border-t border-slate-100">
                  <td className="px-6 py-3 font-mono text-xs">{customer.code || "—"}</td>
                  <td className="px-6 py-3 font-medium text-slate-900">{customer.name}</td>
                  <td className="px-6 py-3 text-slate-600">
                    {formatActivePeriods(customer.activePeriods)}
                  </td>
                  <td className="px-6 py-3">
                    <button
                      type="button"
                      onClick={() => setSelected(customer)}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      {period} Dönemine Aktif Et
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {selected ? (
        <ActivateCustomerModal
          customer={selected}
          period={period}
          onClose={() => setSelected(null)}
        />
      ) : null}
    </>
  );
}

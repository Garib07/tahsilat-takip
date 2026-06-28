"use client";

import Link from "next/link";
import { ChargeActions } from "@/components/charge-actions";
import { Card } from "@/components/ui";
import { formatCurrency, formatDateLabel, monthNames } from "@/lib/format";
import { normalizeCharge } from "@/lib/charges";
import { Charge } from "@/lib/types";

export function ChargesTable({
  charges,
  period,
  customerMap
}: {
  charges: Charge[];
  period: number;
  customerMap: Record<string, string>;
}) {
  return (
    <Card>
      <div className="border-b border-slate-100 px-6 py-4">
        <h2 className="text-lg font-semibold text-slate-900">Tahakkuk Dökümü</h2>
        <p className="text-sm text-slate-500">{period} dönemine ait aylık borçlandırmalar</p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-6 py-3 font-medium">Cari</th>
              <th className="px-6 py-3 font-medium">Tarih</th>
              <th className="px-6 py-3 font-medium">Ay</th>
              <th className="px-6 py-3 font-medium">Tutar</th>
              <th className="px-6 py-3 font-medium">Açıklama</th>
              <th className="px-6 py-3 font-medium">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {charges.map((charge) => {
              const normalized = normalizeCharge(charge);
              return (
              <tr key={charge.id} className="border-t border-slate-100">
                <td className="px-6 py-3">
                  <Link
                    href={`/customers/${charge.customerId}`}
                    className="font-medium text-slate-900 hover:underline"
                  >
                    {customerMap[charge.customerId] ?? "—"}
                  </Link>
                </td>
                <td className="px-6 py-3 text-slate-600">{formatDateLabel(normalized.date)}</td>
                <td className="px-6 py-3 text-slate-600">{monthNames[charge.month - 1]}</td>
                <td className="px-6 py-3 font-medium text-slate-800">
                  {formatCurrency(charge.amount)}
                </td>
                <td className="px-6 py-3 text-slate-600">{charge.description || "—"}</td>
                <td className="px-6 py-3">
                  <ChargeActions charge={charge} period={period} customerId={charge.customerId} />
                </td>
              </tr>
            );
            })}
            {!charges.length ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                  {period} döneminde tahakkuk kaydı yok.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

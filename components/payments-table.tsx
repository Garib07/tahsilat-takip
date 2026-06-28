"use client";

import Link from "next/link";
import { PaymentActions } from "@/components/payment-actions";
import { Card } from "@/components/ui";
import { formatCurrency, formatDateLabel } from "@/lib/format";
import { Payment } from "@/lib/types";

export function PaymentsTable({
  payments,
  period,
  customerMap
}: {
  payments: Payment[];
  period: number;
  customerMap: Record<string, string>;
}) {
  return (
    <Card>
      <div className="border-b border-slate-100 px-6 py-4">
        <h2 className="text-lg font-semibold text-slate-900">Tahsilat Dökümü</h2>
        <p className="text-sm text-slate-500">
          {period} yılına ait tahsilat kayıtları (Kasa ve cari detayından girilenler)
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-6 py-3 font-medium">Tarih</th>
              <th className="px-6 py-3 font-medium">Cari</th>
              <th className="px-6 py-3 font-medium">Tutar</th>
              <th className="px-6 py-3 font-medium">Ödeme Tipi</th>
              <th className="px-6 py-3 font-medium">Açıklama</th>
              <th className="px-6 py-3 font-medium">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((payment) => (
              <tr key={payment.id} className="border-t border-slate-100">
                <td className="px-6 py-3 whitespace-nowrap text-slate-700">
                  {formatDateLabel(payment.date)}
                </td>
                <td className="px-6 py-3">
                  <Link
                    href={`/customers/${payment.customerId}`}
                    className="font-medium text-slate-900 hover:underline"
                  >
                    {customerMap[payment.customerId] ?? "—"}
                  </Link>
                </td>
                <td className="px-6 py-3 font-medium text-emerald-700">
                  {formatCurrency(payment.amount)}
                </td>
                <td className="px-6 py-3 text-slate-600">{payment.method}</td>
                <td className="px-6 py-3 text-slate-600">{payment.description || "—"}</td>
                <td className="px-6 py-3">
                  <PaymentActions
                    payment={payment}
                    period={period}
                    customerId={payment.customerId}
                  />
                </td>
              </tr>
            ))}
            {!payments.length ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                  {period} yılında tahsilat kaydı yok.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

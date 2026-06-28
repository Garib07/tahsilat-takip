"use client";

import Link from "next/link";
import { CustomerEditButton } from "@/components/customer-edit-button";
import { CustomerReportActions } from "@/components/customer-report-actions";
import { Card } from "@/components/ui";
import { formatCurrency } from "@/lib/format";
import { formatActivePeriods } from "@/lib/customer-periods";
import { getCustomerFeeForYear } from "@/lib/fees";
import { Customer } from "@/lib/types";

export function CustomersTable({
  customers,
  period
}: {
  customers: Customer[];
  period: number;
}) {
  return (
    <Card>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-6 py-3 font-medium">Kod</th>
              <th className="px-6 py-3 font-medium">Unvan</th>
              <th className="px-6 py-3 font-medium">Yetkili</th>
              <th className="px-6 py-3 font-medium">Telefon</th>
                <th className="px-6 py-3 font-medium">Aktif Dönemler</th>
                <th className="px-6 py-3 font-medium">Aylık Ücret ({period})</th>
              <th className="px-6 py-3 font-medium">Durum</th>
              <th className="px-6 py-3 font-medium">İşlem</th>
              <th className="px-6 py-3 font-medium">Ekstre</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr key={customer.id} className="border-t border-slate-100 hover:bg-slate-50/80">
                <td className="px-6 py-3 font-mono text-xs text-slate-600">{customer.code || "—"}</td>
                <td className="px-6 py-3">
                  <Link
                    href={`/customers/${customer.id}`}
                    className="font-medium text-slate-900 hover:underline"
                  >
                    {customer.name}
                  </Link>
                  {customer.specialCode ? (
                    <p className="text-xs text-slate-500">Özel Kod: {customer.specialCode}</p>
                  ) : null}
                </td>
                <td className="px-6 py-3 text-slate-600">{customer.authorizedPerson || "—"}</td>
                  <td className="px-6 py-3 text-slate-600">{customer.mobile || customer.phone || "—"}</td>
                  <td className="px-6 py-3 text-xs text-slate-600">
                    {formatActivePeriods(customer.activePeriods)}
                  </td>
                  <td className="px-6 py-3">
                  {formatCurrency(getCustomerFeeForYear(customer, period))}
                </td>
                <td className="px-6 py-3">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      customer.active
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {customer.active ? "Aktif" : "Pasif"}
                  </span>
                </td>
                <td className="px-6 py-3">
                  <CustomerEditButton customer={customer} period={period} compact />
                </td>
                <td className="px-6 py-3">
                  <CustomerReportActions
                    customerId={customer.id}
                    period={period}
                    activePeriods={customer.activePeriods}
                    compact
                  />
                </td>
              </tr>
            ))}
            {!customers.length ? (
              <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-slate-500">
                  {period} döneminde cari kaydı yok. Firma Yönetimi&apos;nden dönemi kontrol edin veya yeni
                  cari ekleyin.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

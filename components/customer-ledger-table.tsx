"use client";

import { useMemo } from "react";
import { CarryForwardActions } from "@/components/carry-forward-actions";
import { ChargeActions } from "@/components/charge-actions";
import { CustomerChargeCreateButton } from "@/components/customer-charge-create-button";
import { CustomerPaymentCreateButton } from "@/components/customer-payment-create-button";
import { PaymentActions } from "@/components/payment-actions";
import { Card } from "@/components/ui";
import { formatCurrency, formatDateLabel, monthNames } from "@/lib/format";
import { isMonthlyCharge, normalizeCharge } from "@/lib/charges";
import { CarryForward, Charge, Payment } from "@/lib/types";

type LedgerRow =
  | { kind: "carryforward"; sortDate: string; carryForward: CarryForward }
  | { kind: "charge"; sortDate: string; charge: Charge }
  | { kind: "payment"; sortDate: string; payment: Payment };

export function CustomerLedgerTable({
  customerId,
  period,
  charges,
  payments,
  defaultMonthlyFee,
  carryForward,
  openingBalance
}: {
  customerId: string;
  period: number;
  charges: Charge[];
  payments: Payment[];
  defaultMonthlyFee: number;
  carryForward: CarryForward | null;
  openingBalance: number;
}) {
  const existingMonthlyMonths = useMemo(
    () => charges.filter((charge) => isMonthlyCharge(charge)).map((charge) => charge.month),
    [charges]
  );

  const rows: LedgerRow[] = useMemo(
    () =>
      [
        ...(carryForward
          ? [
              {
                kind: "carryforward" as const,
                sortDate: `${period}-00-00`,
                carryForward
              }
            ]
          : []),
        ...charges.map((charge) => {
          const normalized = normalizeCharge(charge);
          return {
            kind: "charge" as const,
            sortDate: normalized.date,
            charge: normalized
          };
        }),
        ...payments.map((payment) => ({
          kind: "payment" as const,
          sortDate: payment.date,
          payment
        }))
      ].sort((a, b) => a.sortDate.localeCompare(b.sortDate)),
    [carryForward, charges, payments, period]
  );

  let runningBalance = 0;

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Ekstre</h2>
          <p className="text-sm text-slate-500">Yalnızca {period} dönemi hareketleri</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <CustomerChargeCreateButton
            customerId={customerId}
            period={period}
            defaultAmount={defaultMonthlyFee}
            existingMonthlyMonths={existingMonthlyMonths}
          />
          <CustomerPaymentCreateButton customerId={customerId} period={period} />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-6 py-3 font-medium">Tarih</th>
              <th className="px-6 py-3 font-medium">Açıklama</th>
              <th className="px-6 py-3 font-medium">Borç</th>
              <th className="px-6 py-3 font-medium">Alacak</th>
              <th className="px-6 py-3 font-medium">Bakiye</th>
              <th className="px-6 py-3 font-medium">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const balance =
                row.kind === "carryforward" ? row.carryForward.balance : 0;
              const debit =
                row.kind === "carryforward"
                  ? balance > 0
                    ? balance
                    : 0
                  : row.kind === "charge"
                    ? row.charge.amount
                    : 0;
              const credit =
                row.kind === "carryforward"
                  ? balance < 0
                    ? Math.abs(balance)
                    : 0
                  : row.kind === "payment"
                    ? row.payment.amount
                    : 0;
              runningBalance = Math.round((runningBalance + debit - credit) * 100) / 100;

              const label =
                row.kind === "carryforward"
                  ? "Devir"
                  : row.kind === "charge"
                    ? formatDateLabel(row.charge.date)
                    : formatDateLabel(row.payment.date);

              const description =
                row.kind === "carryforward"
                  ? `${row.carryForward.fromYear} Yılı Devir Bakiyesi`
                  : row.kind === "charge"
                    ? row.charge.description || (isMonthlyCharge(row.charge) ? "Aylık Ücret" : "Hizmet Tahakkuku")
                    : row.payment.description || row.payment.method || "Tahsilat";

              const rowKey =
                row.kind === "carryforward"
                  ? `carryforward-${row.carryForward.id}`
                  : row.kind === "charge"
                    ? `charge-${row.charge.id}`
                    : `payment-${row.payment.id}`;

              return (
                <tr
                  key={rowKey}
                  className={`border-t border-slate-100 ${
                    row.kind === "carryforward" ? "bg-amber-50/60" : ""
                  }`}
                >
                  <td className="px-6 py-3 whitespace-nowrap font-medium text-slate-800">{label}</td>
                  <td className="px-6 py-3 text-slate-600">{description}</td>
                  <td className="px-6 py-3 text-rose-700">{debit ? formatCurrency(debit) : "—"}</td>
                  <td className="px-6 py-3 text-emerald-700">{credit ? formatCurrency(credit) : "—"}</td>
                  <td
                    className={`px-6 py-3 font-medium ${
                      runningBalance > 0 ? "text-rose-700" : "text-slate-700"
                    }`}
                  >
                    {formatCurrency(runningBalance)}
                  </td>
                  <td className="px-6 py-3">
                    {row.kind === "carryforward" ? (
                      <CarryForwardActions
                        carryForward={row.carryForward}
                        customerId={customerId}
                      />
                    ) : null}
                    {row.kind === "charge" ? (
                      <ChargeActions charge={row.charge} period={period} customerId={customerId} />
                    ) : null}
                    {row.kind === "payment" ? (
                      <PaymentActions payment={row.payment} period={period} customerId={customerId} />
                    ) : null}
                  </td>
                </tr>
              );
            })}
            {!rows.length ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                  Bu cariye ait {period} dönemi hareketi bulunmuyor.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

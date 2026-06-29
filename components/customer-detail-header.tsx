"use client";

import Link from "next/link";
import { useState } from "react";
import { CustomerEditButton } from "@/components/customer-edit-button";
import { CustomerInfoModal } from "@/components/customer-info-modal";
import { CustomerReportActions } from "@/components/customer-report-actions";
import { PeriodBadge } from "@/components/period-badge";
import { Customer } from "@/lib/types";

export function CustomerDetailHeader({
  customer,
  period,
  description
}: {
  customer: Customer;
  period: number;
  description: string;
}) {
  const [infoOpen, setInfoOpen] = useState(false);

  return (
    <>
      <div className="mb-6 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <button
              type="button"
              onClick={() => setInfoOpen(true)}
              className="text-left text-2xl font-semibold text-slate-900 transition hover:text-slate-700 hover:underline"
              title="Cari bilgilerini görüntüle"
            >
              {customer.name}
            </button>
            <p className="mt-1 text-sm text-slate-500">{description}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <PeriodBadge period={period} />
            <CustomerEditButton customer={customer} period={period} />
            <Link
              href="/customers"
              className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              ← Carilere dön
            </Link>
          </div>
        </div>

        <CustomerReportActions
          customerId={customer.id}
          period={period}
          activePeriods={customer.activePeriods}
        />
      </div>

      {infoOpen ? (
        <CustomerInfoModal
          customer={customer}
          viewPeriod={period}
          onClose={() => setInfoOpen(false)}
        />
      ) : null}
    </>
  );
}

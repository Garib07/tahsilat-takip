"use client";

import { useState } from "react";
import { CustomerCardForm, customerToCardInput } from "@/components/customer-card-form";
import { Customer } from "@/lib/types";

export function CustomerEditButton({
  customer,
  period,
  compact = false
}: {
  customer: Customer;
  period: number;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          compact
            ? "rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            : "rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        }
      >
        Düzenle
      </button>

      {open ? (
        <CustomerCardForm
          mode="edit"
          period={period}
          customerId={customer.id}
          initialForm={customerToCardInput(customer, period)}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </>
  );
}

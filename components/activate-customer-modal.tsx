"use client";

import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/modal";
import { activateCustomerForPeriodAction } from "@/lib/actions";
import { getCustomerFeeForYear } from "@/lib/fees";
import { formatAmountInput, formatAmountWithCents } from "@/lib/format";
import { Customer } from "@/lib/types";

export function ActivateCustomerModal({
  customer,
  period,
  onClose
}: {
  customer: Customer;
  period: number;
  onClose: () => void;
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const defaultFee = formatAmountWithCents(
    String(getCustomerFeeForYear(customer, customer.activePeriods.at(-1) ?? period))
  );
  const [monthlyFee, setMonthlyFee] = useState(defaultFee);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setMessage("");

    startTransition(async () => {
      try {
        await activateCustomerForPeriodAction(customer.id, { year: period, monthlyFee });
        router.refresh();
        onClose();
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Dönem aktif edilemedi.");
      }
    });
  }

  return (
    <Modal open onClose={onClose} title="Cariyi Döneme Aktif Et">
      <form className="space-y-4" onSubmit={handleSubmit}>
        <p className="text-sm text-slate-600">
          <strong>{customer.code}</strong> · {customer.name} carisi{" "}
          <strong>{period}</strong> dönemine eklenecek.
        </p>

        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">Dönem</span>
          <input
            readOnly
            value={String(period)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700"
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">Aylık Ücret ({period})</span>
          <input
            required
            inputMode="decimal"
            value={monthlyFee}
            onChange={(event) => setMonthlyFee(formatAmountInput(event.target.value))}
            onBlur={() => setMonthlyFee(formatAmountWithCents(monthlyFee))}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-slate-400"
          />
        </label>

        {message ? <p className="text-sm text-rose-600">{message}</p> : null}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {pending ? "Kaydediliyor..." : "Bu Döneme Aktif Et"}
        </button>
      </form>
    </Modal>
  );
}

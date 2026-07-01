"use client";

import { FormEvent, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createPaymentAction } from "@/lib/actions";
import { Modal } from "@/components/modal";
import { formatAmountInput, formatAmountWithCents } from "@/lib/format";
import { getDefaultPaymentDescription, paymentMethods } from "@/lib/payments";
import { resolvePeriodMonth } from "@/lib/period";

function defaultPaymentDate(period: number) {
  const today = new Date();
  if (today.getFullYear() === period) {
    return today.toISOString().slice(0, 10);
  }
  const month = String(resolvePeriodMonth(period)).padStart(2, "0");
  return `${period}-${month}-01`;
}

export function CustomerPaymentCreateButton({
  customerId,
  period,
  open: controlledOpen,
  onOpenChange
}: {
  customerId: string;
  period: number;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({
    date: defaultPaymentDate(period),
    amount: "",
    method: "Banka",
    description: getDefaultPaymentDescription("Banka")
  });

  function setOpen(next: boolean) {
    if (onOpenChange) onOpenChange(next);
    else setInternalOpen(next);
  }

  useEffect(() => {
    if (!open) return;
    setForm({
      date: defaultPaymentDate(period),
      amount: "",
      method: "Banka",
      description: getDefaultPaymentDescription("Banka")
    });
    setMessage("");
  }, [open, period]);

  function openModal() {
    setForm({
      date: defaultPaymentDate(period),
      amount: "",
      method: "Banka",
      description: getDefaultPaymentDescription("Banka")
    });
    setMessage("");
    setOpen(true);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setMessage("");

    startTransition(async () => {
      try {
        await createPaymentAction({ customerId, ...form });
        setOpen(false);
        router.refresh();
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Tahsilat kaydedilemedi.");
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800 hover:bg-emerald-100"
      >
        Tahsilat Ekle <span className="text-xs font-normal text-emerald-700">(F3)</span>
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Tahsilat Ekle">
        <p className="mb-4 text-sm text-slate-500">
          Tahsilat tarihi <strong>{period}</strong> yılı içinde olmalıdır.
        </p>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Tarih</span>
            <input
              required
              type="date"
              min={`${period}-01-01`}
              max={`${period}-12-31`}
              value={form.date}
              onChange={(event) => setForm({ ...form, date: event.target.value })}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-slate-400"
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Tutar</span>
            <input
              required
              inputMode="decimal"
              value={form.amount}
              onChange={(event) =>
                setForm({ ...form, amount: formatAmountInput(event.target.value) })
              }
              onBlur={() => setForm({ ...form, amount: formatAmountWithCents(form.amount) })}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-slate-400"
              placeholder="5.000,00"
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Ödeme Tipi</span>
            <select
              value={form.method}
              onChange={(event) => {
                const method = event.target.value;
                setForm({
                  ...form,
                  method,
                  description: getDefaultPaymentDescription(method)
                });
              }}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-slate-400"
            >
              {paymentMethods.map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Açıklama</span>
            <input
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-slate-400"
            />
          </label>

          {message ? <p className="text-sm text-rose-600">{message}</p> : null}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {pending ? "Kaydediliyor..." : "Tahsilatı Kaydet"}
          </button>
        </form>
      </Modal>
    </>
  );
}

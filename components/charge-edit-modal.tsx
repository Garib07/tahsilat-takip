"use client";

import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/modal";
import { updateChargeAction } from "@/lib/actions";
import { formatAmountInput, formatAmountWithCents, monthNames } from "@/lib/format";
import { getDefaultChargeDate } from "@/lib/period";
import { Charge } from "@/lib/types";

export function ChargeEditModal({
  charge,
  period,
  customerId,
  onClose
}: {
  charge: Charge;
  period: number;
  customerId: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({
    month: charge.month,
    date: charge.date || getDefaultChargeDate(charge.year, charge.month),
    amount: formatAmountWithCents(String(charge.amount)),
    description: charge.description
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setMessage("");

    startTransition(async () => {
      try {
        await updateChargeAction(charge.id, customerId, form);
        router.refresh();
        onClose();
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Tahakkuk güncellenemedi.");
      }
    });
  }

  return (
    <Modal open onClose={onClose} title="Tahakkuk Düzenle">
      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">Dönem</span>
          <input
            readOnly
            value={String(period)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700"
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">Ay</span>
          <select
            value={form.month}
            onChange={(event) => {
              const month = Number(event.target.value);
              setForm({
                ...form,
                month,
                date: getDefaultChargeDate(period, month)
              });
            }}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-slate-400"
          >
            {monthNames.map((name, index) => (
              <option key={name} value={index + 1}>
                {name}
              </option>
            ))}
          </select>
        </label>

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
            onChange={(event) => setForm({ ...form, amount: formatAmountInput(event.target.value) })}
            onBlur={() => setForm({ ...form, amount: formatAmountWithCents(form.amount) })}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-slate-400"
          />
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
          {pending ? "Kaydediliyor..." : "Kaydet"}
        </button>
      </form>
    </Modal>
  );
}

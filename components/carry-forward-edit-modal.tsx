"use client";

import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateCarryForwardAction } from "@/lib/actions";
import { Modal } from "@/components/modal";
import { formatAmountInput, formatAmountWithCents, formatCurrency } from "@/lib/format";
import { CarryForward } from "@/lib/types";

function parseFormAmount(value: string) {
  const amount = Number(value.trim().replace(/\./g, "").replace(",", "."));
  return Number.isFinite(amount) ? amount : 0;
}

export function CarryForwardEditModal({
  carryForward,
  customerId,
  onClose
}: {
  carryForward: CarryForward;
  customerId: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({
    direction: carryForward.balance < 0 ? "alacak" : "borc",
    amount: formatAmountWithCents(String(Math.abs(carryForward.balance)))
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setMessage("");

    startTransition(async () => {
      try {
        await updateCarryForwardAction(carryForward.id, customerId, {
          amount: form.amount,
          direction: form.direction as "borc" | "alacak"
        });
        router.refresh();
        onClose();
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Devir bakiyesi güncellenemedi.");
      }
    });
  }

  return (
    <Modal open onClose={onClose} title="Devir Bakiyesi Düzenle">
      <form className="space-y-4" onSubmit={handleSubmit}>
        <p className="text-sm text-slate-600">
          <strong>{carryForward.fromYear}</strong> yılı kapanış bakiyesi,{" "}
          <strong>{carryForward.toYear}</strong> dönemine devredilmiştir.
        </p>

        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">Kaynak Yıl</span>
          <input
            readOnly
            value={String(carryForward.fromYear)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700"
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">Hedef Yıl</span>
          <input
            readOnly
            value={String(carryForward.toYear)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700"
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">Bakiye Yönü</span>
          <select
            value={form.direction}
            onChange={(event) => setForm({ ...form, direction: event.target.value })}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-slate-400"
          >
            <option value="borc">Borç (cari borçlu)</option>
            <option value="alacak">Alacak (cari alacaklı / fazla ödeme)</option>
          </select>
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

        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
          Yeni devir bakiyesi:{" "}
          <strong>
            {formatCurrency(
              form.direction === "borc"
                ? parseFormAmount(form.amount)
                : -parseFormAmount(form.amount)
            )}
          </strong>
        </p>

        {message ? <p className="text-sm text-rose-600">{message}</p> : null}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
        >
          {pending ? "Kaydediliyor..." : "Devir Bakiyesini Güncelle"}
        </button>
      </form>
    </Modal>
  );
}

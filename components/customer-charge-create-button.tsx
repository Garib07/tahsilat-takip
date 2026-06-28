"use client";

import { FormEvent, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createChargeAction } from "@/lib/actions";
import { Modal } from "@/components/modal";
import { serviceChargePresets } from "@/lib/charges";
import {
  formatAmountInput,
  formatAmountWithCents,
  getAccountingFeeDescription,
  monthNames
} from "@/lib/format";
import { resolvePeriodMonth } from "@/lib/period";

type ChargeMode = "monthly" | "service";

function toggleInList(list: number[], value: number) {
  return list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value].sort((a, b) => a - b);
}

export function CustomerChargeCreateButton({
  customerId,
  period,
  defaultAmount,
  existingMonthlyMonths
}: {
  customerId: string;
  period: number;
  defaultAmount: number;
  existingMonthlyMonths: number[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<ChargeMode>("monthly");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const defaultMonth = resolvePeriodMonth(period);
  const [selectedMonths, setSelectedMonths] = useState<number[]>([defaultMonth]);
  const [amount, setAmount] = useState(formatAmountWithCents(String(defaultAmount)));
  const [description, setDescription] = useState(serviceChargePresets[0]);
  const [customDescription, setCustomDescription] = useState("");

  const existingMonthSet = useMemo(
    () => new Set(existingMonthlyMonths),
    [existingMonthlyMonths]
  );
  const newMonthCount = selectedMonths.filter((month) => !existingMonthSet.has(month)).length;
  const updateMonthCount = selectedMonths.filter((month) => existingMonthSet.has(month)).length;

  function openModal() {
    const month = resolvePeriodMonth(period);
    setMode("monthly");
    setSelectedMonths([month]);
    setAmount(formatAmountWithCents(String(defaultAmount)));
    setDescription(serviceChargePresets[0]);
    setCustomDescription("");
    setMessage("");
    setOpen(true);
  }

  function switchMode(nextMode: ChargeMode) {
    setMode(nextMode);
    setMessage("");
    if (nextMode === "monthly") {
      const month = resolvePeriodMonth(period);
      setSelectedMonths([month]);
      setAmount(formatAmountWithCents(String(defaultAmount)));
    } else {
      setSelectedMonths([resolvePeriodMonth(period)]);
      setAmount("");
      setDescription(serviceChargePresets[0]);
      setCustomDescription("");
    }
  }

  function toggleMonth(month: number) {
    setSelectedMonths((current) => toggleInList(current, month));
  }

  function selectAllMonths() {
    setSelectedMonths(Array.from({ length: 12 }, (_, index) => index + 1));
  }

  function clearAllMonths() {
    setSelectedMonths([]);
  }

  function resolveServiceDescription() {
    if (description === "Diğer Hizmet") {
      return customDescription.trim();
    }
    return description.trim();
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setMessage("");

    if (!selectedMonths.length) {
      setMessage("En az bir ay seçiniz.");
      return;
    }

    if (mode === "service") {
      const serviceDescription = resolveServiceDescription();
      if (!serviceDescription) {
        setMessage("Hizmet açıklaması giriniz.");
        return;
      }
    }

    startTransition(async () => {
      try {
        for (const month of selectedMonths) {
          if (mode === "monthly") {
            await createChargeAction({
              customerId,
              year: period,
              month,
              amount,
              description: getAccountingFeeDescription(month),
              kind: "monthly"
            });
          } else {
            await createChargeAction({
              customerId,
              year: period,
              month,
              amount,
              description: resolveServiceDescription(),
              kind: "service"
            });
          }
        }

        setOpen(false);
        router.refresh();
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Tahakkuk kaydedilemedi.");
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-800 hover:bg-rose-100"
      >
        Tahakkuk Ekle
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Tahakkuk Ekle" wide>
        <div className="mb-4 flex gap-2 rounded-lg bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => switchMode("monthly")}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition ${
              mode === "monthly"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Aylık Ücret
          </button>
          <button
            type="button"
            onClick={() => switchMode("service")}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition ${
              mode === "service"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Diğer Hizmet
          </button>
        </div>

        <p className="mb-4 text-sm text-slate-500">
          {mode === "monthly" ? (
            <>
              <strong>{period}</strong> dönemi aylık muhasebe ücreti tahakkuku. Her ay için yalnızca
              bir aylık ücret kaydı tutulur.
            </>
          ) : (
            <>
              Danışmanlık, defter tasdik gibi ek hizmetler için tahakkuk. Aynı aya birden fazla
              hizmet eklenebilir.
            </>
          )}
        </p>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Dönem</span>
            <input
              readOnly
              value={String(period)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700"
            />
          </label>

          {mode === "service" ? (
            <>
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-slate-700">Hizmet Türü</span>
                <select
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-slate-400"
                >
                  {serviceChargePresets.map((preset) => (
                    <option key={preset} value={preset}>
                      {preset}
                    </option>
                  ))}
                </select>
              </label>

              {description === "Diğer Hizmet" ? (
                <label className="block text-sm">
                  <span className="mb-1 block font-medium text-slate-700">Açıklama</span>
                  <input
                    required
                    value={customDescription}
                    onChange={(event) => setCustomDescription(event.target.value)}
                    placeholder="Örn: SGK bordro düzenleme"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-slate-400"
                  />
                </label>
              ) : null}
            </>
          ) : null}

          <section>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-medium text-slate-700">Aylar</span>
              <div className="flex gap-2 text-xs">
                <button
                  type="button"
                  onClick={selectAllMonths}
                  className="rounded-md border border-slate-200 px-2 py-1 text-slate-600 hover:bg-slate-50"
                >
                  Tüm aylar
                </button>
                <button
                  type="button"
                  onClick={clearAllMonths}
                  className="rounded-md border border-slate-200 px-2 py-1 text-slate-600 hover:bg-slate-50"
                >
                  Temizle
                </button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {monthNames.map((name, index) => {
                const month = index + 1;
                const checked = selectedMonths.includes(month);
                const hasMonthlyFee = existingMonthSet.has(month);

                return (
                  <label
                    key={name}
                    className={`flex cursor-pointer flex-col rounded-lg border px-2 py-2 text-sm transition ${
                      checked
                        ? mode === "monthly"
                          ? "border-rose-600 bg-rose-50 text-rose-900"
                          : "border-violet-600 bg-violet-50 text-violet-900"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleMonth(month)}
                        className="rounded border-slate-300"
                      />
                      {name}
                    </span>
                    {mode === "monthly" && hasMonthlyFee ? (
                      <span className="mt-1 pl-6 text-xs text-slate-400">Aylık ücret var — güncellenir</span>
                    ) : null}
                  </label>
                );
              })}
            </div>
            {mode === "monthly" && selectedMonths.length ? (
              <p className="mt-2 text-xs text-slate-500">
                {newMonthCount ? `${newMonthCount} yeni tahakkuk` : null}
                {newMonthCount && updateMonthCount ? " · " : null}
                {updateMonthCount ? `${updateMonthCount} aylık ücret güncellenir` : null}
              </p>
            ) : null}
          </section>

          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">
              {mode === "monthly" ? "Aylık Tutar" : "Tutar"}
            </span>
            <input
              required
              inputMode="decimal"
              value={amount}
              onChange={(event) => setAmount(formatAmountInput(event.target.value))}
              onBlur={() => setAmount(formatAmountWithCents(amount))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-slate-400"
            />
            {mode === "monthly" ? (
              <span className="mt-1 block text-xs text-slate-400">
                Seçili tüm aylar için aynı tutar uygulanır.
              </span>
            ) : null}
          </label>

          {message ? <p className="text-sm text-rose-600">{message}</p> : null}

          <button
            type="submit"
            disabled={pending || !selectedMonths.length}
            className={`w-full rounded-lg px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50 ${
              mode === "monthly"
                ? "bg-rose-600 hover:bg-rose-700"
                : "bg-violet-600 hover:bg-violet-700"
            }`}
          >
            {pending
              ? "Kaydediliyor..."
              : mode === "service"
                ? selectedMonths.length > 1
                  ? `${selectedMonths.length} Ay İçin Hizmet Tahakkuku`
                  : "Hizmet Tahakkuku Kaydet"
                : selectedMonths.length > 1
                  ? `${selectedMonths.length} Ay İçin Tahakkuk Oluştur`
                  : "Tahakkuku Kaydet"}
          </button>
        </form>
      </Modal>
    </>
  );
}

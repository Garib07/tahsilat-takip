"use client";

import {
  ChangeEvent,
  FormEvent,
  memo,
  MutableRefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition
} from "react";
import { useRouter } from "next/navigation";
import { createChargeAction, upsertCarryForwardAction } from "@/lib/actions";
import { Modal } from "@/components/modal";
import { isDevirService, serviceChargePresets } from "@/lib/charges";
import {
  formatAmountWithCents,
  getAccountingFeeDescription,
  monthNames,
  sanitizeAmountTyping
} from "@/lib/format";
import { resolvePeriodMonth, getDefaultChargeDate } from "@/lib/period";

type ChargeMode = "monthly" | "service";

function toggleInList(list: number[], value: number) {
  return list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value].sort((a, b) => a - b);
}

const MonthSelector = memo(function MonthSelector({
  mode,
  selectedMonths,
  existingMonthSet,
  onToggleMonth,
  onSelectAll,
  onClearAll,
  newMonthCount,
  updateMonthCount
}: {
  mode: ChargeMode;
  selectedMonths: number[];
  existingMonthSet: Set<number>;
  onToggleMonth: (month: number) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
  newMonthCount: number;
  updateMonthCount: number;
}) {
  return (
    <section>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-medium text-slate-700">Aylar</span>
        <div className="flex gap-2 text-xs">
          <button
            type="button"
            onClick={onSelectAll}
            className="rounded-md border border-slate-200 px-2 py-1 text-slate-600 hover:bg-slate-50"
          >
            Tüm aylar
          </button>
          <button
            type="button"
            onClick={onClearAll}
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
                  onChange={() => onToggleMonth(month)}
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
  );
});

const AmountInput = memo(function AmountInput({
  label,
  initialValue,
  hint,
  amountRef
}: {
  label: string;
  initialValue: string;
  hint?: string;
  amountRef: MutableRefObject<string>;
}) {
  const [displayValue, setDisplayValue] = useState(initialValue);

  useEffect(() => {
    amountRef.current = initialValue;
    setDisplayValue(initialValue);
  }, [amountRef, initialValue]);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const next = sanitizeAmountTyping(event.target.value);
    amountRef.current = next;
    setDisplayValue(next);
  }

  function handleBlur() {
    const formatted = formatAmountWithCents(amountRef.current);
    amountRef.current = formatted;
    setDisplayValue(formatted);
  }

  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-slate-700">{label}</span>
      <input
        required
        inputMode="decimal"
        autoComplete="off"
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-slate-400"
      />
      {hint ? <span className="mt-1 block text-xs text-slate-400">{hint}</span> : null}
    </label>
  );
});

function ChargeCreateModal({
  customerId,
  period,
  defaultAmount,
  existingMonthlyMonths,
  onClose
}: {
  customerId: string;
  period: number;
  defaultAmount: number;
  existingMonthlyMonths: number[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<ChargeMode>("monthly");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const [selectedMonths, setSelectedMonths] = useState<number[]>([resolvePeriodMonth(period)]);
  const [amountSeed, setAmountSeed] = useState(() => formatAmountWithCents(String(defaultAmount)));
  const amountRef = useRef(amountSeed);
  const [description, setDescription] = useState(serviceChargePresets[0]);
  const [customDescription, setCustomDescription] = useState("");
  const [devirFromYear, setDevirFromYear] = useState(period - 1);
  const [devirDirection, setDevirDirection] = useState<"borc" | "alacak">("borc");
  const [serviceDates, setServiceDates] = useState<Record<number, string>>({});

  const isDevirMode = mode === "service" && isDevirService(description);

  const existingMonthSet = useMemo(
    () => new Set(existingMonthlyMonths),
    [existingMonthlyMonths]
  );
  const newMonthCount = selectedMonths.filter((month) => !existingMonthSet.has(month)).length;
  const updateMonthCount = selectedMonths.filter((month) => existingMonthSet.has(month)).length;

  const handleToggleMonth = useCallback(
    (month: number) => setSelectedMonths((current) => toggleInList(current, month)),
    []
  );
  const handleSelectAll = useCallback(
    () => setSelectedMonths(Array.from({ length: 12 }, (_, index) => index + 1)),
    []
  );
  const handleClearAll = useCallback(() => setSelectedMonths([]), []);

  useEffect(() => {
    if (mode !== "service" || isDevirService(description)) return;

    setServiceDates((current) => {
      const next: Record<number, string> = {};
      for (const month of selectedMonths) {
        next[month] = current[month] ?? getDefaultChargeDate(period, month);
      }
      return next;
    });
  }, [description, mode, period, selectedMonths]);

  function updateServiceDate(month: number, date: string) {
    setServiceDates((current) => ({ ...current, [month]: date }));
  }

  function resetAmount(nextValue: string) {
    amountRef.current = nextValue;
    setAmountSeed(nextValue);
  }

  function switchMode(nextMode: ChargeMode) {
    setMode(nextMode);
    setMessage("");
    if (nextMode === "monthly") {
      setSelectedMonths([resolvePeriodMonth(period)]);
      resetAmount(formatAmountWithCents(String(defaultAmount)));
    } else {
      setSelectedMonths([resolvePeriodMonth(period)]);
      resetAmount("");
      setDescription(serviceChargePresets[0]);
      setCustomDescription("");
    }
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

    if (!selectedMonths.length && !isDevirMode) {
      setMessage("En az bir ay seçiniz.");
      return;
    }

    if (mode === "service") {
      if (isDevirService(description)) {
        if (!formatAmountWithCents(amountRef.current)) {
          setMessage("Devir tutarı giriniz.");
          return;
        }
      } else {
        const serviceDescription = resolveServiceDescription();
        if (!serviceDescription) {
          setMessage("Hizmet açıklaması giriniz.");
          return;
        }
      }
    }

    const normalizedAmount = formatAmountWithCents(amountRef.current);

    startTransition(async () => {
      try {
        if (mode === "service" && isDevirService(description)) {
          await upsertCarryForwardAction(customerId, {
            fromYear: devirFromYear,
            toYear: period,
            amount: normalizedAmount,
            direction: devirDirection
          });
        } else {
          for (const month of selectedMonths) {
            if (mode === "monthly") {
              await createChargeAction({
                customerId,
                year: period,
                month,
                amount: normalizedAmount,
                description: getAccountingFeeDescription(month),
                kind: "monthly"
              });
            } else {
              await createChargeAction({
                customerId,
                year: period,
                month,
                amount: normalizedAmount,
                description: resolveServiceDescription(),
                kind: "service",
                date: serviceDates[month] ?? getDefaultChargeDate(period, month)
              });
            }
          }
        }

        onClose();
        router.refresh();
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Kayıt oluşturulamadı.");
      }
    });
  }

  return (
    <Modal open onClose={onClose} title="Tahakkuk Ekle" wide>
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
            <strong>{period}</strong> dönemi aylık muhasebe ücreti tahakkuku. Her ay için yalnızca bir
            aylık ücret kaydı tutulur.
          </>
        ) : (
          <>
            Danışmanlık, defter tasdik gibi ek hizmetler için tahakkuk. Aynı aya birden fazla hizmet
            eklenebilir. <strong>Devir</strong> ile cariye manuel devir bakiyesi de girebilirsiniz.
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
                onChange={(event) => {
                  const next = event.target.value;
                  setDescription(next);
                  if (isDevirService(next)) {
                    setDevirFromYear(period - 1);
                    resetAmount("");
                  }
                }}
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

            {isDevirMode ? (
              <>
                <label className="block text-sm">
                  <span className="mb-1 block font-medium text-slate-700">Kaynak Yıl</span>
                  <input
                    required
                    type="number"
                    min={2000}
                    max={period - 1}
                    value={devirFromYear}
                    onChange={(event) => setDevirFromYear(Number(event.target.value))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-slate-400"
                  />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block font-medium text-slate-700">Bakiye Yönü</span>
                  <select
                    value={devirDirection}
                    onChange={(event) =>
                      setDevirDirection(event.target.value === "alacak" ? "alacak" : "borc")
                    }
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-slate-400"
                  >
                    <option value="borc">Borç (cari borçlu)</option>
                    <option value="alacak">Alacak (cari alacaklı)</option>
                  </select>
                </label>
                <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                  {period} dönemi için devir bakiyesi eklenir veya güncellenir. Yıl sonu toplu devir
                  için Firma Yönetimi → Yıl Sonu Devir kullanılabilir.
                </p>
              </>
            ) : null}
          </>
        ) : null}

        {!isDevirMode ? (
        <MonthSelector
          mode={mode}
          selectedMonths={selectedMonths}
          existingMonthSet={existingMonthSet}
          onToggleMonth={handleToggleMonth}
          onSelectAll={handleSelectAll}
          onClearAll={handleClearAll}
          newMonthCount={newMonthCount}
          updateMonthCount={updateMonthCount}
        />
        ) : null}

        {mode === "service" && !isDevirMode && selectedMonths.length > 0 ? (
          <section>
            <span className="mb-2 block text-sm font-medium text-slate-700">Tahakkuk Tarihleri</span>
            <div className="overflow-hidden rounded-lg border border-slate-200">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-left text-slate-500">
                  <tr>
                    <th className="px-3 py-2 font-medium">Ay</th>
                    <th className="px-3 py-2 font-medium">Tarih</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedMonths.map((month) => (
                    <tr key={month} className="border-t border-slate-100">
                      <td className="px-3 py-2 font-medium text-slate-800">{monthNames[month - 1]}</td>
                      <td className="px-3 py-2">
                        <input
                          required
                          type="date"
                          min={`${period}-01-01`}
                          max={`${period}-12-31`}
                          value={serviceDates[month] ?? getDefaultChargeDate(period, month)}
                          onChange={(event) => updateServiceDate(month, event.target.value)}
                          className="w-full rounded-md border border-slate-200 px-2 py-1.5 outline-none focus:border-slate-400"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        <AmountInput
          key={`${mode}-${description}-${amountSeed}`}
          label={
            isDevirMode ? "Devir Tutarı" : mode === "monthly" ? "Aylık Tutar" : "Tutar"
          }
          initialValue={amountSeed}
          amountRef={amountRef}
          hint={mode === "monthly" ? "Seçili tüm aylar için aynı tutar uygulanır." : undefined}
        />

        {message ? <p className="text-sm text-rose-600">{message}</p> : null}

        <button
          type="submit"
          disabled={pending || (!isDevirMode && !selectedMonths.length)}
          className={`w-full rounded-lg px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50 ${
            isDevirMode
              ? "bg-amber-600 hover:bg-amber-700"
              : mode === "monthly"
                ? "bg-rose-600 hover:bg-rose-700"
                : "bg-violet-600 hover:bg-violet-700"
          }`}
        >
          {pending
            ? "Kaydediliyor..."
            : isDevirMode
              ? "Devir Bakiyesini Kaydet"
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
  );
}

export function CustomerChargeCreateButton({
  customerId,
  period,
  defaultAmount,
  existingMonthlyMonths,
  open: controlledOpen,
  onOpenChange
}: {
  customerId: string;
  period: number;
  defaultAmount: number;
  existingMonthlyMonths: number[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;

  function setOpen(next: boolean) {
    if (onOpenChange) onOpenChange(next);
    else setInternalOpen(next);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-800 hover:bg-rose-100"
      >
        Tahakkuk Ekle <span className="text-xs font-normal text-rose-600">(F2)</span>
      </button>

      {open ? (
        <ChargeCreateModal
          customerId={customerId}
          period={period}
          defaultAmount={defaultAmount}
          existingMonthlyMonths={existingMonthlyMonths}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </>
  );
}

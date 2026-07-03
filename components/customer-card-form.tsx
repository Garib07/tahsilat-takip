"use client";

import { FormEvent, ReactNode, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createCustomerAction, updateCustomerAction } from "@/lib/actions";
import { getCustomerFeeForYear } from "@/lib/fees";
import { formatAmountInput, formatAmountWithCents } from "@/lib/format";
import { Customer, CustomerCardInput } from "@/lib/types";

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-slate-400";

function FormRow({
  label,
  children,
  className = ""
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`grid grid-cols-[88px_1fr] items-center gap-3 ${className}`}>
      <span className="text-right text-sm text-slate-600">{label}</span>
      {children}
    </div>
  );
}

function emptyForm(nextCode: string): CustomerCardInput {
  return {
    code: nextCode,
    specialCode: "",
    name: "",
    authorizedPerson: "",
    mobile: "",
    phone: "",
    fax: "",
    address: "",
    city: "",
    district: "",
    taxOffice: "",
    taxNumber: "",
    email: "",
    website: "",
    monthlyFee: "",
    openedAt: "",
    closedAt: "",
    receivableStatus: "normal",
    doubtfulAmount: "",
    doubtfulNote: ""
  };
}

export function customerToCardInput(customer: Customer, period: number): CustomerCardInput {
  return {
    code: customer.code,
    specialCode: customer.specialCode,
    name: customer.name,
    authorizedPerson: customer.authorizedPerson,
    mobile: customer.mobile,
    phone: customer.phone,
    fax: customer.fax,
    address: customer.address,
    city: customer.city,
    district: customer.district,
    taxOffice: customer.taxOffice,
    taxNumber: customer.taxNumber,
    email: customer.email,
    website: customer.website,
    monthlyFee: formatAmountWithCents(String(getCustomerFeeForYear(customer, period))),
    openedAt: customer.openedAt ?? "",
    closedAt: customer.closedAt ?? "",
    receivableStatus: customer.receivableStatus ?? "normal",
    doubtfulAmount:
      customer.doubtfulAmount > 0 ? formatAmountWithCents(String(customer.doubtfulAmount)) : "",
    doubtfulNote: customer.doubtfulNote ?? ""
  };
}

export function CustomerCardForm({
  mode,
  period,
  nextCode = "",
  customerId,
  initialForm,
  onClose
}: {
  mode: "create" | "edit";
  period: number;
  nextCode?: string;
  customerId?: string;
  initialForm?: CustomerCardInput;
  onClose: () => void;
}) {
  const router = useRouter();
  const isEdit = mode === "edit";
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState(() => initialForm ?? emptyForm(nextCode));

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setMessage("");

    startTransition(async () => {
      try {
        if (isEdit) {
          if (!customerId) throw new Error("Cari bulunamadı.");
          await updateCustomerAction(customerId, form);
        } else {
          await createCustomerAction(form);
        }
        router.refresh();
        onClose();
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "İşlem tamamlanamadı.");
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/30 p-4">
      <div className="mx-auto max-w-3xl rounded-2xl bg-[#eceff3] shadow-xl">
        <div className="flex items-center justify-between px-4 py-4 md:px-6">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-white/70"
            aria-label="Menü"
          >
            ☰
          </button>
          <h1 className="text-lg font-semibold text-slate-800">
            {isEdit ? "Cari Kart Düzenle" : "Cari Kart Ekle"}
          </h1>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-xl leading-none text-slate-500 hover:bg-white/70"
            aria-label="Kapat"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 px-4 pb-4 md:px-6">
          <p className="text-center text-xs text-slate-500">
            {isEdit ? `${period} dönemi cari kartı` : `${period} dönemine kaydedilecek`}
          </p>

          <div className="grid gap-3 md:grid-cols-2">
            <FormRow label="Kod">
              <input
                value={form.code}
                onChange={(event) => setForm({ ...form, code: event.target.value })}
                className={inputClass}
              />
            </FormRow>

            <FormRow label="Özel Kod">
              <input
                value={form.specialCode}
                onChange={(event) => setForm({ ...form, specialCode: event.target.value })}
                className={inputClass}
              />
            </FormRow>
          </div>

          <FormRow label="Unvan">
            <input
              required
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              className={inputClass}
            />
          </FormRow>

          <div className="grid gap-3 md:grid-cols-2">
            <FormRow label="Yetkili">
              <input
                value={form.authorizedPerson}
                onChange={(event) => setForm({ ...form, authorizedPerson: event.target.value })}
                className={inputClass}
              />
            </FormRow>

            <FormRow label="Gsm">
              <input
                value={form.mobile}
                onChange={(event) => setForm({ ...form, mobile: event.target.value })}
                className={inputClass}
              />
            </FormRow>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <FormRow label="Telefon">
              <input
                value={form.phone}
                onChange={(event) => setForm({ ...form, phone: event.target.value })}
                className={inputClass}
              />
            </FormRow>

            <FormRow label="Faks">
              <input
                value={form.fax}
                onChange={(event) => setForm({ ...form, fax: event.target.value })}
                className={inputClass}
              />
            </FormRow>
          </div>

          <FormRow label="Adres">
            <input
              value={form.address}
              onChange={(event) => setForm({ ...form, address: event.target.value })}
              className={inputClass}
            />
          </FormRow>

          <div className="grid gap-3 md:grid-cols-2">
            <FormRow label="İl">
              <input
                value={form.city}
                onChange={(event) => setForm({ ...form, city: event.target.value })}
                className={inputClass}
              />
            </FormRow>

            <FormRow label="İlçe">
              <input
                value={form.district}
                onChange={(event) => setForm({ ...form, district: event.target.value })}
                className={inputClass}
              />
            </FormRow>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <FormRow label="V. Daire">
              <input
                value={form.taxOffice}
                onChange={(event) => setForm({ ...form, taxOffice: event.target.value })}
                className={inputClass}
              />
            </FormRow>

            <FormRow label="TC - V.No">
              <input
                value={form.taxNumber}
                onChange={(event) => setForm({ ...form, taxNumber: event.target.value })}
                className={inputClass}
              />
            </FormRow>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <FormRow label="E-Posta">
              <input
                type="email"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                className={inputClass}
              />
            </FormRow>

            <FormRow label="Web">
              <input
                value={form.website}
                onChange={(event) => setForm({ ...form, website: event.target.value })}
                className={inputClass}
              />
            </FormRow>
          </div>

          <FormRow label="Aylık Ücret">
            <input
              required
              inputMode="decimal"
              value={form.monthlyFee}
              onChange={(event) =>
                setForm({ ...form, monthlyFee: formatAmountInput(event.target.value) })
              }
              onBlur={() =>
                setForm({ ...form, monthlyFee: formatAmountWithCents(form.monthlyFee) })
              }
              className={inputClass}
              placeholder="5.000,00"
            />
          </FormRow>

          <div className="mt-2 border-t border-slate-100 pt-4">
            <p className="mb-3 text-sm font-medium text-slate-700">Alacak takibi</p>
            <FormRow label="Durum">
              <select
                value={form.receivableStatus}
                onChange={(event) =>
                  setForm({
                    ...form,
                    receivableStatus: event.target.value === "doubtful" ? "doubtful" : "normal"
                  })
                }
                className={inputClass}
              >
                <option value="normal">Normal</option>
                <option value="doubtful">Şüpheli alacak</option>
              </select>
            </FormRow>

            {form.receivableStatus === "doubtful" ? (
              <>
                <FormRow label="Şüpheli tutar" className="mt-3">
                  <div>
                    <input
                      inputMode="decimal"
                      value={form.doubtfulAmount}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          doubtfulAmount: formatAmountInput(event.target.value)
                        })
                      }
                      onBlur={() =>
                        setForm({
                          ...form,
                          doubtfulAmount: form.doubtfulAmount.trim()
                            ? formatAmountWithCents(form.doubtfulAmount)
                            : ""
                        })
                      }
                      className={inputClass}
                      placeholder="Boş bırakılırsa tüm pozitif bakiye"
                    />
                    <p className="mt-1 text-xs text-slate-500">
                      Kısmi şüpheli alacak için tutar girin; boşsa carinin tüm borcu şüpheli sayılır.
                    </p>
                  </div>
                </FormRow>
                <FormRow label="Not" className="mt-3">
                  <textarea
                    value={form.doubtfulNote}
                    onChange={(event) => setForm({ ...form, doubtfulNote: event.target.value })}
                    className={`${inputClass} min-h-[72px] resize-y`}
                    placeholder="Şüpheli alacak gerekçesi (isteğe bağlı)"
                  />
                </FormRow>
              </>
            ) : null}
          </div>

          <FormRow label="Açılış">
            <div>
              <input
                type="date"
                value={form.openedAt}
                onChange={(event) => setForm({ ...form, openedAt: event.target.value })}
                className={inputClass}
              />
              <p className="mt-1 text-xs text-slate-500">
                Sözleşme başlangıç veya açılış tarihi. Girilirse bu tarihten önceki aylar için toplu
                tahakkuk oluşturulmaz.
              </p>
            </div>
          </FormRow>

          <FormRow label="Kapanış">
            <div>
              <input
                type="date"
                value={form.closedAt}
                onChange={(event) => setForm({ ...form, closedAt: event.target.value })}
                className={inputClass}
              />
              <p className="mt-1 text-xs text-slate-500">
                Sözleşme bitiş veya kapanış tarihi. Girilirse bu tarihten sonraki aylar için toplu
                tahakkuk oluşturulmaz.
              </p>
            </div>
          </FormRow>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-400 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-500"
            >
              ← Geri
            </button>

            <button
              type="submit"
              disabled={pending}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-50"
            >
              ✓ {pending ? "Kaydediliyor..." : "Onayla"}
            </button>
          </div>

          {message ? <p className="text-center text-sm text-rose-600">{message}</p> : null}
        </form>
      </div>
    </div>
  );
}

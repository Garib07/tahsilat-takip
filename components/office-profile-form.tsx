"use client";

import { FormEvent, ReactNode, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateOfficeProfileAction } from "@/lib/actions";
import { OfficeProfile } from "@/lib/types";

const currencyOptions = [
  { value: "TL", label: "TL - Türk Lirası" },
  { value: "USD", label: "USD - ABD Doları" },
  { value: "EUR", label: "EUR - Euro" }
];

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-slate-400";

function periodYears() {
  const current = new Date().getFullYear();
  return Array.from({ length: 11 }, (_, index) => current - 5 + index);
}

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

function toFormState(office: OfficeProfile) {
  return {
    period: office.period,
    currency: office.currency,
    firmName: office.firmName,
    authorizedPerson: office.authorizedPerson,
    mobile: office.mobile,
    phone: office.phone,
    fax: office.fax,
    address: office.address,
    city: office.city,
    district: office.district,
    taxOffice: office.taxOffice,
    taxNumber: office.taxNumber,
    email: office.email,
    website: office.website,
    logoDataUrl: office.logoDataUrl
  };
}

export function OfficeProfileForm({ office }: { office: OfficeProfile }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState(toFormState(office));

  function handleLogoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setMessage("Logo için yalnızca görsel dosyası seçebilirsiniz.");
      return;
    }

    if (file.size > 512 * 1024) {
      setMessage("Logo dosyası en fazla 512 KB olabilir.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setForm((current) => ({ ...current, logoDataUrl: String(reader.result ?? "") }));
      setMessage("");
    };
    reader.readAsDataURL(file);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setMessage("");

    startTransition(async () => {
      try {
        await updateOfficeProfileAction(form);
        setMessage("Firma bilgileri kaydedildi.");
        router.refresh();
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Kayıt güncellenemedi.");
      }
    });
  }

  return (
    <div className="-mx-2 rounded-2xl bg-[#eceff3] p-4 md:p-6">
      <div className="mx-auto max-w-3xl overflow-hidden rounded-2xl bg-[#eceff3] shadow-sm">
        <div className="flex items-center justify-between px-4 py-4 md:px-6">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="rounded-lg p-2 text-slate-500 hover:bg-white/70"
            aria-label="Menü"
          >
            ☰
          </button>
          <h1 className="text-lg font-semibold text-slate-800">Firma Yönetimi</h1>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="rounded-lg p-2 text-xl leading-none text-slate-500 hover:bg-white/70"
            aria-label="Kapat"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 px-4 pb-4 md:px-6">
          <div className="grid gap-3 md:grid-cols-2">
            <FormRow label="Dönem">
              <div>
                <select
                  value={form.period}
                  onChange={(event) => setForm({ ...form, period: Number(event.target.value) })}
                  className={inputClass}
                >
                  {periodYears().map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-slate-500">
                  Her dönem 12 aylıktır (Ocak–Aralık). Cariler seçili döneme göre listelenir; aynı cariyi önceki yıllara da aktif edebilirsiniz.
                </p>
              </div>
            </FormRow>

            <FormRow label="P.Birim">
              <select
                value={form.currency}
                onChange={(event) => setForm({ ...form, currency: event.target.value })}
                className={inputClass}
              >
                {currencyOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </FormRow>
          </div>

          <FormRow label="Unvan">
            <input
              value={form.firmName}
              onChange={(event) => setForm({ ...form, firmName: event.target.value })}
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

          <div className="flex flex-wrap items-center justify-between gap-3 pt-4">
            <button
              type="button"
              onClick={() => router.push("/")}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-400 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-500"
            >
              ← Geri
            </button>

            <div className="flex items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoChange}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-orange-500 text-white hover:bg-orange-600"
                title="Logo yükle"
              >
                {form.logoDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={form.logoDataUrl} alt="Logo" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-lg">🖼</span>
                )}
              </button>

              <button
                type="submit"
                disabled={pending}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-50"
              >
                ✓ {pending ? "Kaydediliyor..." : "Onayla"}
              </button>
            </div>
          </div>

          {message ? (
            <p
              className={`text-center text-sm ${
                message.includes("kaydedildi") ? "text-emerald-600" : "text-rose-600"
              }`}
            >
              {message}
            </p>
          ) : null}
        </form>
      </div>
    </div>
  );
}

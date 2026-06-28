"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Charge, Customer, Payment, SummaryRow } from "@/lib/types";
import { normalizeCharge } from "@/lib/charges";
import { getCustomerFeeForYear } from "@/lib/fees";

const paymentMethods = ["Nakit", "Banka", "Kredi Kartı", "Diğer"];
const monthNames = [
  "Ocak",
  "Şubat",
  "Mart",
  "Nisan",
  "Mayıs",
  "Haziran",
  "Temmuz",
  "Ağustos",
  "Eylül",
  "Ekim",
  "Kasım",
  "Aralık"
];
const menuItems = [
  { id: "dashboard", label: "Ana Sayfa", icon: "A" },
  { id: "customers", label: "Mükellefler", icon: "M" },
  { id: "charges", label: "Tahakkuklar", icon: "T" },
  { id: "payments", label: "Tahsilatlar", icon: "H" },
  { id: "reports", label: "Raporlar", icon: "R" },
  { id: "settings", label: "Yedekleme & Ayarlar", icon: "Y" }
] as const;

type ActiveSection = (typeof menuItems)[number]["id"];

type YearlyFeeFormRow = {
  year: string;
  amount: string;
};

function createEmptyYearlyFeeRow(year = new Date().getFullYear()): YearlyFeeFormRow {
  return { year: String(year), amount: "" };
}

function currentPeriod() {
  const today = new Date();
  return {
    year: today.getFullYear(),
    month: today.getMonth() + 1,
    date: today.toISOString().slice(0, 10)
  };
}

export default function AccountingApp() {
  const initialPeriod = useMemo(() => currentPeriod(), []);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [charges, setCharges] = useState<Charge[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [summary, setSummary] = useState<SummaryRow[]>([]);
  const [year, setYear] = useState(initialPeriod.year);
  const [month, setMonth] = useState(initialPeriod.month);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<ActiveSection>("dashboard");
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<string[]>([]);
  const [selectedChargeCustomerIds, setSelectedChargeCustomerIds] = useState<string[]>([]);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null);
  const [ledgerCustomerId, setLedgerCustomerId] = useState<string | null>(null);

  const [customerForm, setCustomerForm] = useState({
    name: "",
    title: "",
    phone: "",
    yearlyFees: [createEmptyYearlyFeeRow(initialPeriod.year)]
  });

  const [chargeForm, setChargeForm] = useState({
    customerId: "",
    amount: "",
    description: getAccountingFeeDescription(initialPeriod.month)
  });

  const [paymentForm, setPaymentForm] = useState({
    customerId: "",
    date: initialPeriod.date,
    amount: "",
    method: "Banka",
    description: ""
  });

  async function loadData() {
    setLoading(true);
    const [customerResult, chargeResult, paymentResult, summaryResult] = await Promise.all([
      fetch("/api/customers"),
      fetch("/api/charges"),
      fetch("/api/payments"),
      fetch(`/api/reports/summary?year=${year}&month=${month}`)
    ]);

    setCustomers(await customerResult.json());
    setCharges(await chargeResult.json());
    setPayments(await paymentResult.json());
    setSummary(await summaryResult.json());
    setLoading(false);
  }

  useEffect(() => {
    loadData().catch((error) => setMessage(getErrorMessage(error)));
  }, [year, month]);

  useEffect(() => {
    setChargeForm((current) => ({
      ...current,
      description: getAccountingFeeDescription(month)
    }));
  }, [month]);

  const activeCustomers = customers.filter((customer) => customer.active);
  const ledgerCustomer = customers.find((customer) => customer.id === ledgerCustomerId) ?? null;
  const totals = summary.reduce(
    (result, row) => ({
      totalCharges: result.totalCharges + row.totalCharges,
      totalPayments: result.totalPayments + row.totalPayments,
      balance: result.balance + row.balance,
      selectedMonthCharge: result.selectedMonthCharge + row.selectedMonthCharge,
      selectedMonthPayments: result.selectedMonthPayments + row.selectedMonthPayments
    }),
    {
      totalCharges: 0,
      totalPayments: 0,
      balance: 0,
      selectedMonthCharge: 0,
      selectedMonthPayments: 0
    }
  );

  async function handleCustomerSubmit(event: FormEvent) {
    event.preventDefault();
    await runAction(async () => {
      if (editingCustomerId) {
        await patchJson("/api/customers", { id: editingCustomerId, ...customerForm });
      } else {
        await postJson("/api/customers", customerForm);
      }

      setCustomerForm({ name: "", title: "", phone: "", yearlyFees: [createEmptyYearlyFeeRow(year)] });
      setEditingCustomerId(null);
      setMessage(editingCustomerId ? "Mükellef güncellendi." : "Mükellef kaydedildi.");
      setShowCustomerModal(false);
      await loadData();
    });
  }

  async function handleGenerateCharges() {
    await runAction(async () => {
      const created = await postJson<Charge[]>("/api/charges", { year, month, generate: true });
      setMessage(`${created.length} müşteri için tahakkuk oluşturuldu.`);
      await loadData();
    });
  }

  async function handleGenerateSelectedCharges() {
    if (!selectedChargeCustomerIds.length) {
      setMessage("Tahakkuk için en az bir mükellef seçiniz.");
      return;
    }

    await runAction(async () => {
      const created = await postJson<Charge[]>("/api/charges", {
        year,
        month,
        generate: true,
        ids: selectedChargeCustomerIds
      });
      setMessage(`${created.length} seçili mükellef için tahakkuk oluşturuldu.`);
      await loadData();
    });
  }

  async function handleDeleteSelectedCharges() {
    if (!selectedChargeCustomerIds.length) {
      setMessage("Silmek için en az bir mükellef seçiniz.");
      return;
    }

    const confirmed = window.confirm(
      `${monthNames[month - 1]} ${year} tahakkukları seçili ${selectedChargeCustomerIds.length} mükellef için silinsin mi?`
    );

    if (!confirmed) return;

    await runAction(async () => {
      const result = await deleteJson<{ deletedCount: number }>("/api/charges", {
        year,
        month,
        ids: selectedChargeCustomerIds
      });
      setMessage(`${result.deletedCount} tahakkuk silindi.`);
      await loadData();
    });
  }

  async function handleChargeSubmit(event: FormEvent) {
    event.preventDefault();
    await runAction(async () => {
      await postJson("/api/charges", { ...chargeForm, year, month });
      setChargeForm({
        customerId: "",
        amount: "",
        description: getAccountingFeeDescription(month)
      });
      setMessage("Tahakkuk kaydedildi.");
      await loadData();
    });
  }

  async function handleLedgerChargeSubmit(input: {
    customerId: string;
    year: number;
    month: number;
    amount: string;
    description: string;
  }) {
    await runAction(async () => {
      await postJson("/api/charges", input);
      setMessage("Cari ekrandan tahakkuk kaydedildi.");
      await loadData();
    });
  }

  async function handlePaymentSubmit(event: FormEvent) {
    event.preventDefault();
    await runAction(async () => {
      await postJson("/api/payments", paymentForm);
      setPaymentForm({
        customerId: "",
        date: initialPeriod.date,
        amount: "",
        method: "Banka",
        description: ""
      });
      setMessage("Tahsilat kaydedildi.");
      await loadData();
    });
  }

  async function toggleCustomer(customer: Customer) {
    await runAction(async () => {
      await patchJson("/api/customers", { id: customer.id, active: !customer.active });
      setMessage(customer.active ? "Müşteri pasife alındı." : "Müşteri aktife alındı.");
      await loadData();
    });
  }

  function openNewCustomerModal() {
    setEditingCustomerId(null);
    setCustomerForm({ name: "", title: "", phone: "", yearlyFees: [createEmptyYearlyFeeRow(year)] });
    setShowCustomerModal(true);
  }

  function openEditCustomerModal(customer: Customer) {
    setEditingCustomerId(customer.id);
    setCustomerForm({
      name: customer.name,
      title: customer.specialCode,
      phone: customer.phone,
      yearlyFees: (customer.yearlyFees?.length ? customer.yearlyFees : [{ year, amount: customer.monthlyFee }]).map(
        (fee) => ({
          year: String(fee.year),
          amount: formatAmountWithCents(String(fee.amount))
        })
      )
    });
    setShowCustomerModal(true);
  }

  function closeCustomerModal() {
    setShowCustomerModal(false);
    setEditingCustomerId(null);
    setCustomerForm({ name: "", title: "", phone: "", yearlyFees: [createEmptyYearlyFeeRow(year)] });
  }

  async function deleteSelectedCustomers() {
    if (!selectedCustomerIds.length) {
      setMessage("Silmek için en az bir mükellef seçiniz.");
      return;
    }

    const confirmed = window.confirm(
      `${selectedCustomerIds.length} mükellef ve ilgili tahakkuk/tahsilat kayıtları silinsin mi?`
    );

    if (!confirmed) return;

    await runAction(async () => {
      const result = await deleteJson<{ deletedCount: number }>("/api/customers", {
        ids: selectedCustomerIds
      });
      setSelectedCustomerIds([]);
      setMessage(`${result.deletedCount} mükellef silindi.`);
      await loadData();
    });
  }

  function selectChargeCustomer(customerId: string) {
    const customer = customers.find((item) => item.id === customerId);
    setChargeForm((current) => ({
      ...current,
      customerId,
      amount: customer ? formatAmountWithCents(String(getCustomerFeeForYear(customer, year))) : current.amount
    }));
  }

  async function runAction(action: () => Promise<void>) {
    try {
      await action();
    } catch (error) {
      setMessage(getErrorMessage(error));
    }
  }

  return (
    <main className="app-layout">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">BT</div>
          <div>
            <strong>Tahsilat Takip</strong>
            <span>v2.0</span>
          </div>
        </div>

        <nav className="side-menu" aria-label="Uygulama bölümleri">
          {menuItems.map((item) => (
            <button
              className={activeSection === item.id ? "menu-item active" : "menu-item"}
              key={item.id}
              type="button"
              onClick={() => setActiveSection(item.id)}
            >
              <span className="menu-icon">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      <section className="content-shell">
        <header className="topbar">
          <div>
            <span className="eyebrow">Yerel kullanım</span>
            <h1>{menuItems.find((item) => item.id === activeSection)?.label}</h1>
          </div>
          <PeriodSelector
            year={year}
            month={month}
            setYear={setYear}
            setMonth={setMonth}
            onGenerate={handleGenerateCharges}
          />
        </header>

        {message ? <div className="notice">{message}</div> : null}

        {activeSection === "dashboard" ? (
          <>
            <DashboardStats customers={customers} totals={totals} />
            <section className="two-columns">
              <RecentTransactions customers={customers} payments={payments} charges={charges} />
              <CustomerList
                customers={customers}
                selectedCustomerIds={selectedCustomerIds}
                setSelectedCustomerIds={setSelectedCustomerIds}
                onDeleteSelected={deleteSelectedCustomers}
                onEdit={openEditCustomerModal}
                onOpenLedger={setLedgerCustomerId}
                onToggle={toggleCustomer}
                year={year}
              />
            </section>
          </>
        ) : null}

        {activeSection === "customers" ? (
          <>
            <div className="page-actions">
              <div>
                <h2>Mükellef Listesi</h2>
                <p>Mükellefleri buradan seçebilir, pasife alabilir veya silebilirsiniz.</p>
              </div>
              <button type="button" onClick={openNewCustomerModal}>
                Mükellef Ekle
              </button>
            </div>
            <CustomerList
              customers={customers}
              selectedCustomerIds={selectedCustomerIds}
              setSelectedCustomerIds={setSelectedCustomerIds}
              onDeleteSelected={deleteSelectedCustomers}
              onEdit={openEditCustomerModal}
              onOpenLedger={setLedgerCustomerId}
              onToggle={toggleCustomer}
              year={year}
            />
          </>
        ) : null}

        {activeSection === "charges" ? (
          <>
            <section className="two-columns align-start">
              <MultiChargeForm
                activeCustomers={activeCustomers}
                selectedCustomerIds={selectedChargeCustomerIds}
                setSelectedCustomerIds={setSelectedChargeCustomerIds}
                onGenerate={handleGenerateSelectedCharges}
                onDelete={handleDeleteSelectedCharges}
                description={getAccountingFeeDescription(month)}
                year={year}
              />
              <ChargeForm
                activeCustomers={activeCustomers}
                chargeForm={chargeForm}
                setChargeForm={setChargeForm}
                onSubmit={handleChargeSubmit}
                onSelectCustomer={selectChargeCustomer}
              />
            </section>
            <section className="single-section">
              <ChargeList customers={customers} charges={charges} />
            </section>
          </>
        ) : null}

        {activeSection === "payments" ? (
          <section className="two-columns align-start">
            <PaymentForm
              customers={customers}
              paymentForm={paymentForm}
              setPaymentForm={setPaymentForm}
              onSubmit={handlePaymentSubmit}
            />
            <PaymentList customers={customers} payments={payments} />
          </section>
        ) : null}

        {activeSection === "reports" ? (
          <>
            <DashboardStats customers={customers} totals={totals} />
            <ReportTable
              summary={summary}
              year={year}
              month={month}
              loading={loading}
              onOpenLedger={setLedgerCustomerId}
            />
          </>
        ) : null}

        {activeSection === "settings" ? (
          <section className="settings-grid">
            <div className="card">
              <h2>Yedekleme</h2>
              <p>
                Veriler bu bilgisayarda <strong>data/app-data.json</strong> dosyasında saklanır.
                Bu dosyayı harici diske veya bulut klasörüne kopyalayarak yedek alabilirsiniz.
              </p>
            </div>
            <div className="card">
              <h2>Dışa Aktarım</h2>
              <div className="exports vertical">
                <a href={`/api/export?type=summary&year=${year}&month=${month}`}>Rapor CSV indir</a>
                <a href="/api/export?type=customers">Mükellef CSV indir</a>
                <a href="/api/export?type=payments">Tahsilat CSV indir</a>
              </div>
            </div>
          </section>
        ) : null}
      </section>

      {showCustomerModal ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Mükellef ekle">
          <div className="modal-card">
            <div className="modal-header">
              <div>
                <h2>{editingCustomerId ? "Mükellef Güncelle" : "Mükellef Ekle"}</h2>
                <p>
                  {editingCustomerId
                    ? "Mükellef bilgilerini güncelleyiniz."
                    : "Yeni mükellef bilgilerini giriniz."}
                </p>
              </div>
              <button type="button" className="ghost close-button" onClick={closeCustomerModal}>
                Kapat
              </button>
            </div>
            <CustomerForm
              customerForm={customerForm}
              setCustomerForm={setCustomerForm}
              onSubmit={handleCustomerSubmit}
              compact
              submitLabel={editingCustomerId ? "Güncelle" : "Kaydet"}
            />
          </div>
        </div>
      ) : null}

      {ledgerCustomer ? (
        <LedgerModal
          customer={ledgerCustomer}
          charges={charges}
          payments={payments}
          year={year}
          month={month}
          onAddCharge={handleLedgerChargeSubmit}
          onClose={() => setLedgerCustomerId(null)}
        />
      ) : null}
    </main>
  );
}

function PeriodSelector({
  year,
  month,
  setYear,
  setMonth,
  onGenerate
}: {
  year: number;
  month: number;
  setYear: (value: number) => void;
  setMonth: (value: number) => void;
  onGenerate: () => void;
}) {
  return (
    <div className="period-card compact-period">
      <label>
        Ay
        <select value={month} onChange={(event) => setMonth(Number(event.target.value))}>
          {Array.from({ length: 12 }, (_, index) => index + 1).map((item) => (
            <option value={item} key={item}>
              {item}
            </option>
          ))}
        </select>
      </label>
      <label>
        Yıl
        <input type="number" value={year} onChange={(event) => setYear(Number(event.target.value))} />
      </label>
      <button type="button" onClick={onGenerate}>
        Bu ay tahakkuk oluştur
      </button>
    </div>
  );
}

function DashboardStats({
  customers,
  totals
}: {
  customers: Customer[];
  totals: {
    totalCharges: number;
    totalPayments: number;
    balance: number;
    selectedMonthCharge: number;
    selectedMonthPayments: number;
  };
}) {
  return (
    <section className="stats">
      <StatCard title="Mükellef" value={customers.length.toString()} />
      <StatCard title="Seçili Ay Tahakkuk" value={formatCurrency(totals.selectedMonthCharge)} />
      <StatCard title="Seçili Ay Tahsilat" value={formatCurrency(totals.selectedMonthPayments)} />
      <StatCard title="Toplam Bakiye" value={formatCurrency(totals.balance)} highlight />
    </section>
  );
}

function CustomerForm({
  customerForm,
  setCustomerForm,
  onSubmit,
  compact = false,
  submitLabel = "Mükellefi kaydet"
}: {
  customerForm: { name: string; title: string; phone: string; yearlyFees: YearlyFeeFormRow[] };
  setCustomerForm: (value: { name: string; title: string; phone: string; yearlyFees: YearlyFeeFormRow[] }) => void;
  onSubmit: (event: FormEvent) => void;
  compact?: boolean;
  submitLabel?: string;
}) {
  function updateYearlyFee(index: number, patch: Partial<YearlyFeeFormRow>) {
    setCustomerForm({
      ...customerForm,
      yearlyFees: customerForm.yearlyFees.map((row, rowIndex) =>
        rowIndex === index ? { ...row, ...patch } : row
      )
    });
  }

  function addYearlyFeeRow() {
    const nextYear =
      customerForm.yearlyFees.reduce((max, row) => Math.max(max, Number(row.year) || 0), new Date().getFullYear()) + 1;
    setCustomerForm({
      ...customerForm,
      yearlyFees: [...customerForm.yearlyFees, createEmptyYearlyFeeRow(nextYear)]
    });
  }

  function removeYearlyFeeRow(index: number) {
    if (customerForm.yearlyFees.length === 1) return;
    setCustomerForm({
      ...customerForm,
      yearlyFees: customerForm.yearlyFees.filter((_, rowIndex) => rowIndex !== index)
    });
  }

  return (
    <form className={compact ? "form-card modal-form" : "card form-card"} onSubmit={onSubmit}>
      {!compact ? <h2>Mükellef Ekle</h2> : null}
      <label>
        Mükellef adı
        <input
          required
          value={customerForm.name}
          onChange={(event) => setCustomerForm({ ...customerForm, name: event.target.value })}
          placeholder="Örn. ABC Ltd. Şti."
        />
      </label>
      <label>
        Unvan / not
        <input
          value={customerForm.title}
          onChange={(event) => setCustomerForm({ ...customerForm, title: event.target.value })}
          placeholder="İsteğe bağlı"
        />
      </label>
      <label>
        Telefon
        <input
          value={customerForm.phone}
          onChange={(event) => setCustomerForm({ ...customerForm, phone: event.target.value })}
        />
      </label>

      <div className="yearly-fees-block">
        <div className="yearly-fees-header">
          <strong>Yıllık aylık ücretler</strong>
          <button type="button" className="ghost" onClick={addYearlyFeeRow}>
            Yıl ekle
          </button>
        </div>
        {customerForm.yearlyFees.map((row, index) => (
          <div className="yearly-fee-row" key={`${row.year}-${index}`}>
            <label>
              Yıl
              <input
                required
                type="number"
                min="2000"
                max="2100"
                value={row.year}
                onChange={(event) => updateYearlyFee(index, { year: event.target.value })}
              />
            </label>
            <label>
              Aylık ücret
              <input
                required
                inputMode="decimal"
                value={row.amount}
                onChange={(event) =>
                  updateYearlyFee(index, { amount: formatAmountInput(event.target.value) })
                }
                onBlur={() =>
                  updateYearlyFee(index, { amount: formatAmountWithCents(row.amount) })
                }
              />
            </label>
            <button
              type="button"
              className="ghost remove-fee-button"
              onClick={() => removeYearlyFeeRow(index)}
              disabled={customerForm.yearlyFees.length === 1}
            >
              Sil
            </button>
          </div>
        ))}
      </div>

      <button type="submit">{submitLabel}</button>
    </form>
  );
}

function ChargeForm({
  activeCustomers,
  chargeForm,
  setChargeForm,
  onSubmit,
  onSelectCustomer
}: {
  activeCustomers: Customer[];
  chargeForm: { customerId: string; amount: string; description: string };
  setChargeForm: (value: { customerId: string; amount: string; description: string }) => void;
  onSubmit: (event: FormEvent) => void;
  onSelectCustomer: (customerId: string) => void;
}) {
  return (
    <form className="card form-card" onSubmit={onSubmit}>
      <h2>Tekil Tahakkuk</h2>
      <label>
        Mükellef
        <select required value={chargeForm.customerId} onChange={(event) => onSelectCustomer(event.target.value)}>
          <option value="">Seçiniz</option>
          {activeCustomers.map((customer) => (
            <option value={customer.id} key={customer.id}>
              {customer.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Tutar
        <input
          required
          inputMode="decimal"
          value={chargeForm.amount}
          onChange={(event) =>
            setChargeForm({ ...chargeForm, amount: formatAmountInput(event.target.value) })
          }
          onBlur={() =>
            setChargeForm({ ...chargeForm, amount: formatAmountWithCents(chargeForm.amount) })
          }
        />
      </label>
      <label>
        Açıklama
        <input
          value={chargeForm.description}
          onChange={(event) => setChargeForm({ ...chargeForm, description: event.target.value })}
        />
      </label>
      <button type="submit">Tahakkuku kaydet</button>
    </form>
  );
}

function MultiChargeForm({
  activeCustomers,
  selectedCustomerIds,
  setSelectedCustomerIds,
  onGenerate,
  onDelete,
  description,
  year
}: {
  activeCustomers: Customer[];
  selectedCustomerIds: string[];
  setSelectedCustomerIds: (ids: string[]) => void;
  onGenerate: () => void;
  onDelete: () => void;
  description: string;
  year: number;
}) {
  const allSelected =
    activeCustomers.length > 0 && selectedCustomerIds.length === activeCustomers.length;

  function toggleSelection(customerId: string) {
    setSelectedCustomerIds(
      selectedCustomerIds.includes(customerId)
        ? selectedCustomerIds.filter((id) => id !== customerId)
        : [...selectedCustomerIds, customerId]
    );
  }

  function toggleAll() {
    setSelectedCustomerIds(allSelected ? [] : activeCustomers.map((customer) => customer.id));
  }

  return (
    <div className="card">
      <div className="list-header">
        <div>
          <h2>Çoklu Tahakkuk</h2>
          <p>
            {selectedCustomerIds.length} mükellef seçili · Açıklama: {description}
          </p>
        </div>
        <div className="list-actions">
          <button type="button" className="ghost" onClick={toggleAll} disabled={!activeCustomers.length}>
            {allSelected ? "Seçimi kaldır" : "Tümünü seç"}
          </button>
          <button type="button" onClick={onGenerate} disabled={!selectedCustomerIds.length}>
            Seçililere tahakkuk yap
          </button>
          <button
            type="button"
            className="danger-button"
            onClick={onDelete}
            disabled={!selectedCustomerIds.length}
          >
            Seçili tahakkukları sil
          </button>
        </div>
      </div>

      <div className="list scroll-list">
        {activeCustomers.map((customer) => (
          <label className="list-row selectable-label" key={customer.id}>
            <span className="selectable-row">
              <input
                type="checkbox"
                checked={selectedCustomerIds.includes(customer.id)}
                onChange={() => toggleSelection(customer.id)}
              />
              <span>
                <strong>{customer.name}</strong>
                <span>{formatCurrency(getCustomerFeeForYear(customer, year))} / ay ({year})</span>
              </span>
            </span>
          </label>
        ))}
        {!activeCustomers.length ? <div className="empty-card">Aktif mükellef yok.</div> : null}
      </div>
    </div>
  );
}

function PaymentForm({
  customers,
  paymentForm,
  setPaymentForm,
  onSubmit
}: {
  customers: Customer[];
  paymentForm: { customerId: string; date: string; amount: string; method: string; description: string };
  setPaymentForm: (value: { customerId: string; date: string; amount: string; method: string; description: string }) => void;
  onSubmit: (event: FormEvent) => void;
}) {
  return (
    <form className="card form-card" onSubmit={onSubmit}>
      <h2>Tahsilat Gir</h2>
      <label>
        Mükellef
        <select
          required
          value={paymentForm.customerId}
          onChange={(event) => setPaymentForm({ ...paymentForm, customerId: event.target.value })}
        >
          <option value="">Seçiniz</option>
          {customers.map((customer) => (
            <option value={customer.id} key={customer.id}>
              {customer.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Tarih
        <input
          required
          type="date"
          value={paymentForm.date}
          onChange={(event) => setPaymentForm({ ...paymentForm, date: event.target.value })}
        />
      </label>
      <label>
        Tutar
        <input
          required
          inputMode="decimal"
          value={paymentForm.amount}
          onChange={(event) =>
            setPaymentForm({ ...paymentForm, amount: formatAmountInput(event.target.value) })
          }
          onBlur={() =>
            setPaymentForm({ ...paymentForm, amount: formatAmountWithCents(paymentForm.amount) })
          }
        />
      </label>
      <label>
        Ödeme tipi
        <select
          value={paymentForm.method}
          onChange={(event) => setPaymentForm({ ...paymentForm, method: event.target.value })}
        >
          {paymentMethods.map((method) => (
            <option value={method} key={method}>
              {method}
            </option>
          ))}
        </select>
      </label>
      <label>
        Açıklama
        <input
          value={paymentForm.description}
          onChange={(event) => setPaymentForm({ ...paymentForm, description: event.target.value })}
        />
      </label>
      <button type="submit">Tahsilatı kaydet</button>
    </form>
  );
}

function CustomerList({
  customers,
  selectedCustomerIds,
  setSelectedCustomerIds,
  onDeleteSelected,
  onEdit,
  onOpenLedger,
  onToggle,
  year
}: {
  customers: Customer[];
  selectedCustomerIds: string[];
  setSelectedCustomerIds: (ids: string[]) => void;
  onDeleteSelected: () => void;
  onEdit: (customer: Customer) => void;
  onOpenLedger: (customerId: string) => void;
  onToggle: (customer: Customer) => void;
  year: number;
}) {
  const allSelected = customers.length > 0 && selectedCustomerIds.length === customers.length;

  function toggleSelection(customerId: string) {
    setSelectedCustomerIds(
      selectedCustomerIds.includes(customerId)
        ? selectedCustomerIds.filter((id) => id !== customerId)
        : [...selectedCustomerIds, customerId]
    );
  }

  function toggleAll() {
    setSelectedCustomerIds(allSelected ? [] : customers.map((customer) => customer.id));
  }

  return (
    <div className="card">
      <div className="list-header">
        <div>
          <h2>Mükellefler</h2>
          <p>{selectedCustomerIds.length} mükellef seçili</p>
        </div>
        <div className="list-actions">
          <button type="button" className="ghost" onClick={toggleAll} disabled={!customers.length}>
            {allSelected ? "Seçimi kaldır" : "Tümünü seç"}
          </button>
          <button
            type="button"
            className="danger-button"
            onClick={onDeleteSelected}
            disabled={!selectedCustomerIds.length}
          >
            Seçilenleri sil
          </button>
        </div>
      </div>
      <div className="list">
        {customers.map((customer) => (
          <div className="list-row" key={customer.id}>
            <div className="selectable-row">
              <input
                type="checkbox"
                checked={selectedCustomerIds.includes(customer.id)}
                onChange={() => toggleSelection(customer.id)}
                aria-label={`${customer.name} seç`}
              />
              <div>
                <button
                  type="button"
                  className="link-button customer-link"
                  onClick={() => onOpenLedger(customer.id)}
                >
                  {customer.name}
                </button>
                <span>
                  {formatCurrency(getCustomerFeeForYear(customer, year))} / ay ({year})
                  {customer.phone ? ` · ${customer.phone}` : ""}
                </span>
              </div>
            </div>
            <div className="row-actions">
              <button type="button" className="ghost" onClick={() => onEdit(customer)}>
                Düzenle
              </button>
              <button type="button" className="ghost" onClick={() => onToggle(customer)}>
                {customer.active ? "Pasife al" : "Aktife al"}
              </button>
            </div>
          </div>
        ))}
        {!customers.length ? <div className="empty-card">Henüz mükellef eklenmedi.</div> : null}
      </div>
    </div>
  );
}

function ChargeList({ customers, charges }: { customers: Customer[]; charges: Charge[] }) {
  return (
    <div className="card">
      <h2>Son Tahakkuklar</h2>
      <div className="list compact">
        {charges.slice(0, 12).map((charge) => {
          const customer = customers.find((item) => item.id === charge.customerId);
          return (
            <div className="list-row" key={charge.id}>
              <div>
                <strong>{customer?.name ?? "Mükellef"}</strong>
                <span>{charge.description || "Tahakkuk"}</span>
              </div>
              <small>
                {charge.month}/{charge.year} · {formatCurrency(charge.amount)}
              </small>
            </div>
          );
        })}
        {!charges.length ? <div className="empty-card">Henüz tahakkuk yok.</div> : null}
      </div>
    </div>
  );
}

function PaymentList({ customers, payments }: { customers: Customer[]; payments: Payment[] }) {
  return (
    <div className="card">
      <h2>Son Tahsilatlar</h2>
      <div className="list compact">
        {payments.slice(0, 12).map((payment) => {
          const customer = customers.find((item) => item.id === payment.customerId);
          return (
            <div className="list-row" key={payment.id}>
              <div>
                <strong>{customer?.name ?? "Mükellef"}</strong>
                <span>{payment.method}</span>
              </div>
              <small>
                {payment.date} · {formatCurrency(payment.amount)}
              </small>
            </div>
          );
        })}
        {!payments.length ? <div className="empty-card">Henüz tahsilat yok.</div> : null}
      </div>
    </div>
  );
}

function RecentTransactions({
  customers,
  payments,
  charges
}: {
  customers: Customer[];
  payments: Payment[];
  charges: Charge[];
}) {
  return (
    <div className="card">
      <h2>Son İşlemler</h2>
      <div className="list compact">
        {[...payments.slice(0, 5), ...charges.slice(0, 5)]
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
          .slice(0, 8)
          .map((item) => {
            const customer = customers.find((entry) => entry.id === item.customerId);
            const isPayment = "method" in item;
            const dateLabel = isPayment
              ? item.date
              : normalizeCharge(item as Charge).date;
            return (
              <div className="list-row" key={`${isPayment ? "payment" : "charge"}-${item.id}`}>
                <div>
                  <strong>{isPayment ? "Tahsilat" : "Tahakkuk"}</strong>
                  <span>
                    {customer?.name ?? "Mükellef"} · {formatCurrency(item.amount)}
                  </span>
                </div>
                <small>{dateLabel}</small>
              </div>
            );
          })}
        {!payments.length && !charges.length ? <div className="empty-card">Henüz işlem yok.</div> : null}
      </div>
    </div>
  );
}

function ReportTable({
  summary,
  year,
  month,
  loading,
  onOpenLedger
}: {
  summary: SummaryRow[];
  year: number;
  month: number;
  loading: boolean;
  onOpenLedger: (customerId: string) => void;
}) {
  return (
    <section className="card">
      <div className="section-heading">
        <div>
          <h2>Bakiye Raporu</h2>
          <p>Toplam borç, toplam tahsilat ve seçili ayın durumu.</p>
        </div>
        <div className="exports">
          <a href={`/api/export?type=summary&year=${year}&month=${month}`}>Rapor CSV</a>
          <a href="/api/export?type=customers">Mükellef CSV</a>
          <a href="/api/export?type=payments">Tahsilat CSV</a>
        </div>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Mükellef</th>
              <th>Aylık Ücret ({year})</th>
              <th>Ay Tahakkuk</th>
              <th>Ay Tahsilat</th>
              <th>Toplam Tahakkuk</th>
              <th>Toplam Tahsilat</th>
              <th>Bakiye</th>
            </tr>
          </thead>
          <tbody>
            {summary.map((row) => (
              <tr key={row.customerId} className={row.balance > 0 ? "debt" : ""}>
                <td>
                  <button
                    type="button"
                    className="link-button customer-link"
                    onClick={() => onOpenLedger(row.customerId)}
                  >
                    {row.customerName}
                  </button>
                  {row.title ? <span>{row.title}</span> : null}
                </td>
                <td>{formatCurrency(row.monthlyFee)}</td>
                <td>{formatCurrency(row.selectedMonthCharge)}</td>
                <td>{formatCurrency(row.selectedMonthPayments)}</td>
                <td>{formatCurrency(row.totalCharges)}</td>
                <td>{formatCurrency(row.totalPayments)}</td>
                <td>{formatCurrency(row.balance)}</td>
              </tr>
            ))}
            {!loading && !summary.length ? (
              <tr>
                <td colSpan={7} className="empty">
                  Henüz mükellef kaydı yok.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function LedgerModal({
  customer,
  charges,
  payments,
  year,
  month,
  onAddCharge,
  onClose
}: {
  customer: Customer;
  charges: Charge[];
  payments: Payment[];
  year: number;
  month: number;
  onAddCharge: (input: {
    customerId: string;
    year: number;
    month: number;
    amount: string;
    description: string;
  }) => Promise<void>;
  onClose: () => void;
}) {
  const [ledgerChargeForm, setLedgerChargeForm] = useState({
    year,
    month,
    amount: formatAmountWithCents(String(getCustomerFeeForYear(customer, year))),
    description: getAccountingFeeDescription(month)
  });
  const customerCharges = charges.filter((charge) => charge.customerId === customer.id);
  const customerPayments = payments.filter((payment) => payment.customerId === customer.id);
  const totalCharges = customerCharges.reduce((total, charge) => total + charge.amount, 0);
  const totalPayments = customerPayments.reduce((total, payment) => total + payment.amount, 0);
  const balance = totalCharges - totalPayments;
  let runningBalance = 0;

  const entries = [
    ...customerCharges.map((charge) => {
      const normalized = normalizeCharge(charge);
      return {
        id: `charge-${charge.id}`,
        date: normalized.date,
        label: normalized.date,
        description: charge.description || "Tahakkuk",
        debit: charge.amount,
        credit: 0
      };
    }),
    ...customerPayments.map((payment) => ({
      id: `payment-${payment.id}`,
      date: payment.date,
      label: payment.date,
      description: payment.description || payment.method || "Tahsilat",
      debit: 0,
      credit: payment.amount
    }))
  ].sort((a, b) => a.date.localeCompare(b.date));

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    await onAddCharge({
      customerId: customer.id,
      ...ledgerChargeForm
    });
  }

  function changeLedgerMonth(value: number) {
    setLedgerChargeForm((current) => ({
      ...current,
      month: value,
      description: getAccountingFeeDescription(value)
    }));
  }

  function changeLedgerYear(value: number) {
    setLedgerChargeForm((current) => ({
      ...current,
      year: value,
      amount: formatAmountWithCents(String(getCustomerFeeForYear(customer, value)))
    }));
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Cari döküm">
      <div className="modal-card ledger-modal">
        <div className="modal-header">
          <div>
            <h2>{customer.name}</h2>
            <p>Cari döküm</p>
          </div>
          <button type="button" className="ghost close-button" onClick={onClose}>
            Kapat
          </button>
        </div>

        <section className="ledger-summary">
          <StatCard title="Toplam Tahakkuk" value={formatCurrency(totalCharges)} />
          <StatCard title="Toplam Tahsilat" value={formatCurrency(totalPayments)} />
          <StatCard title="Bakiye" value={formatCurrency(balance)} highlight />
        </section>

        <form className="ledger-charge-form" onSubmit={handleSubmit}>
          <h3>Tahakkuk Ekle</h3>
          <label>
            Ay
            <select
              value={ledgerChargeForm.month}
              onChange={(event) => changeLedgerMonth(Number(event.target.value))}
            >
              {monthNames.map((monthName, index) => (
                <option value={index + 1} key={monthName}>
                  {monthName}
                </option>
              ))}
            </select>
          </label>
          <label>
            Yıl
            <input
              type="number"
              value={ledgerChargeForm.year}
              onChange={(event) => changeLedgerYear(Number(event.target.value))}
            />
          </label>
          <label>
            Tutar
            <input
              required
              inputMode="decimal"
              value={ledgerChargeForm.amount}
              onChange={(event) =>
                setLedgerChargeForm({
                  ...ledgerChargeForm,
                  amount: formatAmountInput(event.target.value)
                })
              }
              onBlur={() =>
                setLedgerChargeForm({
                  ...ledgerChargeForm,
                  amount: formatAmountWithCents(ledgerChargeForm.amount)
                })
              }
            />
          </label>
          <label>
            Açıklama
            <input
              value={ledgerChargeForm.description}
              onChange={(event) =>
                setLedgerChargeForm({
                  ...ledgerChargeForm,
                  description: event.target.value
                })
              }
            />
          </label>
          <button type="submit">Tahakkuk kaydet</button>
        </form>

        <div className="table-wrap ledger-table">
          <table>
            <thead>
              <tr>
                <th>Tarih / Dönem</th>
                <th>Açıklama</th>
                <th>Borç</th>
                <th>Alacak</th>
                <th>Bakiye</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => {
                runningBalance += entry.debit - entry.credit;
                return (
                  <tr key={entry.id}>
                    <td>{entry.label}</td>
                    <td>{entry.description}</td>
                    <td>{entry.debit ? formatCurrency(entry.debit) : "-"}</td>
                    <td>{entry.credit ? formatCurrency(entry.credit) : "-"}</td>
                    <td>{formatCurrency(runningBalance)}</td>
                  </tr>
                );
              })}
              {!entries.length ? (
                <tr>
                  <td colSpan={5} className="empty">
                    Bu mükellef için cari hareket yok.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  highlight = false
}: {
  title: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className={highlight ? "stat highlight" : "stat"}>
      <span>{title}</span>
      <strong>{value}</strong>
    </div>
  );
}

async function postJson<T = unknown>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error ?? "İşlem tamamlanamadı.");
  }

  return payload as T;
}

async function patchJson<T = unknown>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error ?? "İşlem tamamlanamadı.");
  }

  return payload as T;
}

async function deleteJson<T = unknown>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error ?? "İşlem tamamlanamadı.");
  }

  return payload as T;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY"
  }).format(value);
}

function formatAmountInput(value: string) {
  const normalized = value.replace(/\s/g, "").replace(/\./g, "").replace(/[^\d,]/g, "");
  const [integerPart, decimalPart] = normalized.split(",");
  const integerDigits = integerPart.replace(/^0+(?=\d)/, "");
  const formattedInteger = integerDigits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

  if (normalized.includes(",")) {
    return `${formattedInteger || "0"},${(decimalPart ?? "").slice(0, 2)}`;
  }

  return formattedInteger;
}

function formatAmountWithCents(value: string) {
  if (!value.trim()) return "";

  const normalized = value.replace(/\s/g, "").replace(/\./g, "").replace(/[^\d,]/g, "");
  const [integerPart, decimalPart = ""] = normalized.split(",");
  const formattedInteger = (integerPart || "0")
    .replace(/^0+(?=\d)/, "")
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const cents = decimalPart.padEnd(2, "0").slice(0, 2);

  return `${formattedInteger || "0"},${cents}`;
}

function getAccountingFeeDescription(month: number) {
  return `${monthNames[month - 1] ?? ""} Muhasebe Ücreti`.trim();
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Beklenmeyen bir hata oluştu.";
}

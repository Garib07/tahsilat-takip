import { randomUUID } from "crypto";
import { Charge, CarryForward, Customer, CustomerCardInput, Database, OfficeProfile, Payment, SummaryRow, YearEndRolloverPreviewRow, YearlyFee } from "./types";
import { getCustomerFeeForYear, normalizeYearlyFees, parseYearlyFeesInput } from "./fees";
import { normalizeCharge } from "./charges";
import { isCustomerActiveInPeriod, normalizeActivePeriods } from "./customer-periods";
import { normalizeClosedAt, normalizeOpenedAt, validateCustomerContractDates, isMonthlyChargeAllowed } from "./customer-closure";
import { getDefaultChargeDate, isDateInPeriod, resolvePeriodMonth } from "./period";
import { readRawDatabase, writeRawDatabase } from "./storage";

export { getDataDirectory } from "./storage";

const emptyOfficeProfile: OfficeProfile = {
  period: new Date().getFullYear(),
  currency: "TL",
  firmName: "",
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
  logoDataUrl: "",
  updatedAt: ""
};

const emptyDatabase: Database = {
  customers: [],
  charges: [],
  payments: [],
  carryForwards: [],
  office: emptyOfficeProfile
};

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

function now() {
  return new Date().toISOString();
}

function normalizeAmount(value: unknown) {
  const normalizedValue =
    typeof value === "string"
      ? value.trim().replace(/\./g, "").replace(",", ".")
      : value;
  const amount = Number(normalizedValue);

  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error("Tutar 0 veya daha büyük olmalıdır.");
  }
  return Math.round(amount * 100) / 100;
}

function requireText(value: unknown, fieldName: string) {
  const text = String(value ?? "").trim();
  if (!text) {
    throw new Error(`${fieldName} zorunludur.`);
  }
  return text;
}

function requirePeriod(year: unknown, month: unknown) {
  const parsedYear = Number(year);
  const parsedMonth = Number(month);

  if (!Number.isInteger(parsedYear) || parsedYear < 2000 || parsedYear > 2100) {
    throw new Error("Geçerli bir yıl giriniz.");
  }

  if (!Number.isInteger(parsedMonth) || parsedMonth < 1 || parsedMonth > 12) {
    throw new Error("Geçerli bir ay seçiniz.");
  }

  return { year: parsedYear, month: parsedMonth };
}

function resolveChargeMonths(input: { month?: unknown; months?: unknown }) {
  if (Array.isArray(input.months) && input.months.length) {
    const months = [
      ...new Set(
        input.months
          .map((value) => Number(value))
          .filter((value) => Number.isInteger(value) && value >= 1 && value <= 12)
      )
    ].sort((a, b) => a - b);

    if (!months.length) {
      throw new Error("Geçerli bir ay seçiniz.");
    }

    return months;
  }

  if (input.month !== undefined) {
    const { month } = requirePeriod(new Date().getFullYear(), input.month);
    return [month];
  }

  throw new Error("En az bir ay seçiniz.");
}

function getAccountingFeeDescription(month: number) {
  return `${monthNames[month - 1] ?? ""} Muhasebe Ücreti`.trim();
}

function normalizeOffice(office?: Partial<OfficeProfile> & Record<string, unknown>): OfficeProfile {
  const period = Number(office?.period);
  const legacyAccountant = String(office?.authorizedPerson ?? office?.accountantName ?? "").trim();

  return {
    period: Number.isInteger(period) && period >= 2000 && period <= 2100 ? period : new Date().getFullYear(),
    currency: String(office?.currency ?? "TL").trim() || "TL",
    firmName: String(office?.firmName ?? "").trim(),
    authorizedPerson: legacyAccountant,
    mobile: String(office?.mobile ?? "").trim(),
    phone: String(office?.phone ?? "").trim(),
    fax: String(office?.fax ?? "").trim(),
    address: String(office?.address ?? "").trim(),
    city: String(office?.city ?? "").trim(),
    district: String(office?.district ?? "").trim(),
    taxOffice: String(office?.taxOffice ?? "").trim(),
    taxNumber: String(office?.taxNumber ?? "").trim(),
    email: String(office?.email ?? "").trim(),
    website: String(office?.website ?? "").trim(),
    logoDataUrl: String(office?.logoDataUrl ?? "").trim(),
    updatedAt: String(office?.updatedAt ?? "").trim()
  };
}

export async function readDatabase(): Promise<Database> {
  const file = await readRawDatabase();
  const database = JSON.parse(file) as Partial<Database>;

  return {
    customers: (database.customers ?? []).map(normalizeCustomer),
    charges: (database.charges ?? []).map(normalizeCharge),
    payments: database.payments ?? [],
    carryForwards: database.carryForwards ?? [],
    office: normalizeOffice(database.office)
  };
}

function normalizeCustomer(customer: Customer & { title?: string; period?: number }): Customer {
  const yearlyFees = normalizeYearlyFees(customer);
  const activePeriods = normalizeActivePeriods({ ...customer, yearlyFees });
  const displayYear = activePeriods[activePeriods.length - 1];

  return {
    ...customer,
    code: String(customer.code ?? "").trim(),
    specialCode: String(customer.specialCode ?? customer.title ?? "").trim(),
    name: String(customer.name ?? "").trim(),
    authorizedPerson: String(customer.authorizedPerson ?? "").trim(),
    mobile: String(customer.mobile ?? "").trim(),
    phone: String(customer.phone ?? "").trim(),
    fax: String(customer.fax ?? "").trim(),
    address: String(customer.address ?? "").trim(),
    city: String(customer.city ?? "").trim(),
    district: String(customer.district ?? "").trim(),
    taxOffice: String(customer.taxOffice ?? "").trim(),
    taxNumber: String(customer.taxNumber ?? "").trim(),
    email: String(customer.email ?? "").trim(),
    website: String(customer.website ?? "").trim(),
    openedAt: normalizeOpenedAt(customer.openedAt),
    closedAt: normalizeClosedAt(customer.closedAt),
    activePeriods,
    yearlyFees,
    monthlyFee: getCustomerFeeForYear({ ...customer, yearlyFees }, displayYear)
  };
}

function requireCustomerInPeriod(customer: Customer, year: number) {
  const normalized = normalizeCustomer(customer);
  if (!isCustomerActiveInPeriod(normalized, year)) {
    throw new Error(`${year} döneminde cari aktif değil. Önce bu döneme aktif edin.`);
  }
  return normalized;
}

export async function getActivePeriod() {
  const database = await readDatabase();
  return database.office.period;
}

export async function getPeriodContext() {
  const database = await readDatabase();
  const period = database.office.period;

  return {
    period,
    month: resolvePeriodMonth(period)
  };
}

async function writeDatabase(database: Database) {
  await writeRawDatabase(JSON.stringify(database, null, 2));
}

function compareCustomersByCode(a: Pick<Customer, "code" | "name">, b: Pick<Customer, "code" | "name">) {
  const codeA = a.code.trim();
  const codeB = b.code.trim();

  if (!codeA && !codeB) return a.name.localeCompare(b.name, "tr");
  if (!codeA) return 1;
  if (!codeB) return -1;

  const codeCompare = codeA.localeCompare(codeB, "tr", { numeric: true, sensitivity: "base" });
  if (codeCompare !== 0) return codeCompare;

  return a.name.localeCompare(b.name, "tr");
}

export async function listCustomers(options?: { period?: number }) {
  const database = await readDatabase();
  const activePeriod = options?.period ?? database.office.period;

  return database.customers
    .map(normalizeCustomer)
    .filter((customer) => isCustomerActiveInPeriod(customer, activePeriod))
    .sort(compareCustomersByCode);
}

export async function listCustomersNotInPeriod(period?: number) {
  const database = await readDatabase();
  const activePeriod = period ?? database.office.period;

  return database.customers
    .map(normalizeCustomer)
    .filter((customer) => !isCustomerActiveInPeriod(customer, activePeriod))
    .sort(compareCustomersByCode);
}

export async function activateCustomerForPeriod(
  id: string,
  input: { year: unknown; monthlyFee?: unknown }
) {
  const database = await readDatabase();
  const customer = database.customers.find((item) => item.id === id);

  if (!customer) {
    throw new Error("Müşteri bulunamadı.");
  }

  const year = Number(input.year);
  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    throw new Error("Geçerli bir dönem yılı seçiniz.");
  }

  const normalized = normalizeCustomer(customer);
  if (isCustomerActiveInPeriod(normalized, year)) {
    throw new Error("Cari zaten bu dönemde aktif.");
  }

  const latestFee = [...normalizeYearlyFees(normalized)].sort((a, b) => b.year - a.year)[0];
  const amount =
    input.monthlyFee !== undefined && String(input.monthlyFee).trim()
      ? normalizeAmount(input.monthlyFee)
      : latestFee?.amount ?? 0;

  customer.activePeriods = [...normalized.activePeriods, year].sort((a, b) => a - b);
  const otherFees = normalizeYearlyFees(normalized).filter((fee) => fee.year !== year);
  customer.yearlyFees = [...otherFees, { year, amount }].sort((a, b) => a.year - b.year);
  customer.monthlyFee = getCustomerFeeForYear(customer, database.office.period);

  await writeDatabase(database);
  return normalizeCustomer(customer);
}

export async function getOfficeProfile() {
  const database = await readDatabase();
  return database.office;
}

export async function updateOfficeProfile(input: Partial<OfficeProfile>) {
  const database = await readDatabase();
  const office = database.office;

  if (input.period !== undefined) {
    const period = Number(input.period);
    if (!Number.isInteger(period) || period < 2000 || period > 2100) {
      throw new Error("Geçerli bir dönem yılı seçiniz.");
    }
    office.period = period;
  }
  if (input.currency !== undefined) office.currency = String(input.currency).trim() || "TL";
  if (input.firmName !== undefined) office.firmName = String(input.firmName).trim();
  if (input.authorizedPerson !== undefined) office.authorizedPerson = String(input.authorizedPerson).trim();
  if (input.mobile !== undefined) office.mobile = String(input.mobile).trim();
  if (input.phone !== undefined) office.phone = String(input.phone).trim();
  if (input.fax !== undefined) office.fax = String(input.fax).trim();
  if (input.address !== undefined) office.address = String(input.address).trim();
  if (input.city !== undefined) office.city = String(input.city).trim();
  if (input.district !== undefined) office.district = String(input.district).trim();
  if (input.taxOffice !== undefined) office.taxOffice = String(input.taxOffice).trim();
  if (input.taxNumber !== undefined) office.taxNumber = String(input.taxNumber).trim();
  if (input.email !== undefined) office.email = String(input.email).trim();
  if (input.website !== undefined) office.website = String(input.website).trim();
  if (input.logoDataUrl !== undefined) office.logoDataUrl = String(input.logoDataUrl).trim();

  office.updatedAt = now();
  database.office = office;
  await writeDatabase(database);
  return office;
}

export async function getCustomerById(id: string) {
  const database = await readDatabase();
  const customer = database.customers.find((item) => item.id === id);
  return customer ? normalizeCustomer(customer) : null;
}

export async function getCustomerStatement(customerId: string, viewPeriod?: number) {
  const database = await readDatabase();
  const customer = database.customers.find((item) => item.id === customerId);

  if (!customer) {
    throw new Error("Müşteri bulunamadı.");
  }

  const period = viewPeriod ?? database.office.period;
  const normalized = requireCustomerInPeriod(customer, period);
  const carryForward = getCarryForwardRecord(database, customerId, period);
  const openingBalance = carryForward?.balance ?? 0;
  const charges = database.charges.filter(
    (item) => item.customerId === customerId && item.year === period
  );
  const payments = database.payments.filter(
    (item) => item.customerId === customerId && isDateInPeriod(item.date, period)
  );

  return {
    customer: normalized,
    period,
    charges,
    payments,
    carryForward,
    openingBalance
  };
}

export async function getNextCustomerCode() {
  const database = await readDatabase();
  const numbers = database.customers
    .map(normalizeCustomer)
    .map((customer) => Number.parseInt(customer.code.replace(/\D/g, ""), 10))
    .filter((value) => Number.isFinite(value));

  const next = (numbers.length ? Math.max(...numbers) : 0) + 1;
  return String(next).padStart(8, "0");
}

export async function createCustomer(input: {
  code?: unknown;
  specialCode?: unknown;
  name: unknown;
  authorizedPerson?: unknown;
  mobile?: unknown;
  phone?: unknown;
  fax?: unknown;
  address?: unknown;
  city?: unknown;
  district?: unknown;
  taxOffice?: unknown;
  taxNumber?: unknown;
  email?: unknown;
  website?: unknown;
  openedAt?: unknown;
  closedAt?: unknown;
  monthlyFee?: unknown;
  yearlyFees?: unknown;
}) {
  const database = await readDatabase();
  const period = database.office.period;
  const yearlyFees = parseYearlyFeesInput(
    input.yearlyFees ?? buildLegacyYearlyFees(input.monthlyFee, period)
  );
  const code = String(input.code ?? "").trim() || (await getNextCustomerCode());
  const openedAt = normalizeOpenedAt(input.openedAt);
  const closedAt = normalizeClosedAt(input.closedAt);
  validateCustomerContractDates(openedAt, closedAt);

  const customer: Customer = {
    id: randomUUID(),
    code,
    specialCode: String(input.specialCode ?? "").trim(),
    name: requireText(input.name, "Unvan"),
    authorizedPerson: String(input.authorizedPerson ?? "").trim(),
    mobile: String(input.mobile ?? "").trim(),
    phone: String(input.phone ?? "").trim(),
    fax: String(input.fax ?? "").trim(),
    address: String(input.address ?? "").trim(),
    city: String(input.city ?? "").trim(),
    district: String(input.district ?? "").trim(),
    taxOffice: String(input.taxOffice ?? "").trim(),
    taxNumber: String(input.taxNumber ?? "").trim(),
    email: String(input.email ?? "").trim(),
    website: String(input.website ?? "").trim(),
    openedAt,
    closedAt,
    activePeriods: [period],
    yearlyFees,
    monthlyFee: getCustomerFeeForYear({ yearlyFees, monthlyFee: 0 }, period),
    active: true,
    createdAt: now()
  };

  database.customers.push(customer);
  await writeDatabase(database);
  return normalizeCustomer(customer);
}

function buildLegacyYearlyFees(monthlyFee: unknown, period: number) {
  return [{ year: period, amount: normalizeAmount(monthlyFee) }];
}

export async function updateCustomer(
  id: string,
  input: Partial<
    Pick<
      Customer,
      | "code"
      | "specialCode"
      | "name"
      | "authorizedPerson"
      | "mobile"
      | "phone"
      | "fax"
      | "address"
      | "city"
      | "district"
      | "taxOffice"
      | "taxNumber"
      | "email"
      | "website"
      | "openedAt"
      | "closedAt"
      | "monthlyFee"
      | "yearlyFees"
      | "active"
    >
  >
) {
  const database = await readDatabase();
  const customer = database.customers.find((item) => item.id === id);

  if (!customer) {
    throw new Error("Müşteri bulunamadı.");
  }

  if (input.code !== undefined) customer.code = String(input.code).trim();
  if (input.specialCode !== undefined) customer.specialCode = String(input.specialCode).trim();
  if (input.name !== undefined) customer.name = requireText(input.name, "Unvan");
  if (input.authorizedPerson !== undefined) customer.authorizedPerson = String(input.authorizedPerson).trim();
  if (input.mobile !== undefined) customer.mobile = String(input.mobile).trim();
  if (input.phone !== undefined) customer.phone = String(input.phone).trim();
  if (input.fax !== undefined) customer.fax = String(input.fax).trim();
  if (input.address !== undefined) customer.address = String(input.address).trim();
  if (input.city !== undefined) customer.city = String(input.city).trim();
  if (input.district !== undefined) customer.district = String(input.district).trim();
  if (input.taxOffice !== undefined) customer.taxOffice = String(input.taxOffice).trim();
  if (input.taxNumber !== undefined) customer.taxNumber = String(input.taxNumber).trim();
  if (input.email !== undefined) customer.email = String(input.email).trim();
  if (input.website !== undefined) customer.website = String(input.website).trim();
  if (input.openedAt !== undefined) customer.openedAt = normalizeOpenedAt(input.openedAt);
  if (input.closedAt !== undefined) customer.closedAt = normalizeClosedAt(input.closedAt);
  if (input.openedAt !== undefined || input.closedAt !== undefined) {
    validateCustomerContractDates(customer.openedAt, customer.closedAt);
  }
  if (input.yearlyFees !== undefined) {
    customer.yearlyFees = parseYearlyFeesInput(input.yearlyFees);
    customer.monthlyFee = getCustomerFeeForYear(customer, database.office.period);
  } else if (input.monthlyFee !== undefined) {
    customer.monthlyFee = normalizeAmount(input.monthlyFee);
  }
  if (input.active !== undefined) customer.active = Boolean(input.active);

  await writeDatabase(database);
  return normalizeCustomer(customer);
}

export async function updateCustomerFromCard(id: string, input: CustomerCardInput) {
  const database = await readDatabase();
  const customer = database.customers.find((item) => item.id === id);

  if (!customer) {
    throw new Error("Müşteri bulunamadı.");
  }

  const normalized = normalizeCustomer(customer);
  const viewPeriod = database.office.period;
  const amount = normalizeAmount(input.monthlyFee);
  const otherFees = normalizeYearlyFees(normalized).filter((fee) => fee.year !== viewPeriod);

  customer.code = String(input.code).trim();
  customer.specialCode = String(input.specialCode).trim();
  customer.name = requireText(input.name, "Unvan");
  customer.authorizedPerson = String(input.authorizedPerson).trim();
  customer.mobile = String(input.mobile).trim();
  customer.phone = String(input.phone).trim();
  customer.fax = String(input.fax).trim();
  customer.address = String(input.address).trim();
  customer.city = String(input.city).trim();
  customer.district = String(input.district).trim();
  customer.taxOffice = String(input.taxOffice).trim();
  customer.taxNumber = String(input.taxNumber).trim();
  customer.email = String(input.email).trim();
  customer.website = String(input.website).trim();
  const openedAt = normalizeOpenedAt(input.openedAt);
  const closedAt = normalizeClosedAt(input.closedAt);
  validateCustomerContractDates(openedAt, closedAt);
  customer.openedAt = openedAt;
  customer.closedAt = closedAt;
  customer.yearlyFees = [...otherFees, { year: viewPeriod, amount }].sort((a, b) => a.year - b.year);
  customer.monthlyFee = getCustomerFeeForYear(customer, viewPeriod);

  await writeDatabase(database);
  return normalizeCustomer(customer);
}

export async function deleteCustomers(input: { ids: unknown }) {
  const database = await readDatabase();
  const ids = Array.isArray(input.ids)
    ? input.ids.map((id) => String(id)).filter(Boolean)
    : [];

  if (!ids.length) {
    throw new Error("Silmek için en az bir mükellef seçiniz.");
  }

  const selectedIds = new Set(ids);
  const deletedCount = database.customers.filter((customer) => selectedIds.has(customer.id)).length;

  if (!deletedCount) {
    throw new Error("Seçilen mükellef bulunamadı.");
  }

  database.customers = database.customers.filter((customer) => !selectedIds.has(customer.id));
  database.charges = database.charges.filter((charge) => !selectedIds.has(charge.customerId));
  database.payments = database.payments.filter((payment) => !selectedIds.has(payment.customerId));

  await writeDatabase(database);
  return { deletedCount };
}

export async function listCharges(options?: { period?: number }) {
  const database = await readDatabase();
  const activePeriod = options?.period ?? database.office.period;

  return database.charges
    .filter((charge) => charge.year === activePeriod)
    .sort((a, b) => b.year - a.year || b.month - a.month);
}

export async function createCharge(input: {
  customerId: unknown;
  year: unknown;
  month: unknown;
  amount: unknown;
  description?: unknown;
  kind?: unknown;
  date?: unknown;
}) {
  const database = await readDatabase();
  const customerId = requireText(input.customerId, "Müşteri");
  const customer = database.customers.find((item) => item.id === customerId);
  const { year, month } = requirePeriod(input.year, input.month);
  const kind = input.kind === "monthly" ? "monthly" : "service";

  if (!customer) {
    throw new Error("Müşteri bulunamadı.");
  }

  requireCustomerInPeriod(customer, year);

  const description = String(input.description ?? "").trim();
  if (!description) {
    throw new Error("Tahakkuk açıklaması zorunludur.");
  }

  const date =
    input.date !== undefined && String(input.date ?? "").trim()
      ? requireText(input.date, "Tahakkuk tarihi")
      : getDefaultChargeDate(year, month);

  if (!isDateInPeriod(date, year)) {
    throw new Error("Tahakkuk tarihi seçili dönem yılı içinde olmalıdır.");
  }

  if (kind === "monthly") {
    const existing = database.charges.find(
      (item) =>
        item.customerId === customerId &&
        item.year === year &&
        item.month === month &&
        normalizeCharge(item).kind === "monthly"
    );

    if (existing) {
      existing.amount = normalizeAmount(input.amount);
      existing.description = description;
      existing.kind = "monthly";
      existing.date = date;
      await writeDatabase(database);
      return normalizeCharge(existing);
    }
  }

  const charge: Charge = {
    id: randomUUID(),
    customerId,
    year,
    month,
    date,
    amount: normalizeAmount(input.amount),
    description,
    kind,
    createdAt: now()
  };

  database.charges.push(charge);
  await writeDatabase(database);
  return normalizeCharge(charge);
}

export async function updateCharge(
  id: string,
  input: {
    month?: unknown;
    amount?: unknown;
    description?: unknown;
    date?: unknown;
  }
) {
  const database = await readDatabase();
  const charge = database.charges.find((item) => item.id === id);

  if (!charge) {
    throw new Error("Tahakkuk bulunamadı.");
  }

  const customer = database.customers.find((item) => item.id === charge.customerId);
  if (!customer) {
    throw new Error("Müşteri bulunamadı.");
  }

  const period = charge.year;
  const month = input.month !== undefined ? Number(input.month) : charge.month;

  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new Error("Geçerli bir ay seçiniz.");
  }

  const duplicate = database.charges.find(
    (item) =>
      item.id !== id &&
      item.customerId === charge.customerId &&
      item.year === period &&
      item.month === month &&
      normalizeCharge(item).kind === "monthly" &&
      normalizeCharge(charge).kind === "monthly"
  );

  if (duplicate) {
    throw new Error("Bu ay için zaten aylık ücret tahakkuku var.");
  }

  charge.year = period;
  charge.month = month;
  if (input.amount !== undefined) charge.amount = normalizeAmount(input.amount);
  if (input.description !== undefined) charge.description = String(input.description ?? "").trim();
  if (input.date !== undefined) {
    const date = requireText(input.date, "Tahakkuk tarihi");
    if (!isDateInPeriod(date, period)) {
      throw new Error("Tahakkuk tarihi seçili dönem yılı içinde olmalıdır.");
    }
    charge.date = date;
  } else if (input.month !== undefined) {
    charge.date = getDefaultChargeDate(period, month);
  }

  await writeDatabase(database);
  return normalizeCharge(charge);
}

export async function deleteCharge(id: string) {
  const database = await readDatabase();
  const charge = database.charges.find((item) => item.id === id);

  if (!charge) {
    throw new Error("Tahakkuk bulunamadı.");
  }

  database.charges = database.charges.filter((item) => item.id !== id);
  await writeDatabase(database);
  return { customerId: charge.customerId };
}

export async function generateMonthlyCharges(input: {
  year: unknown;
  month?: unknown;
  months?: unknown;
  ids?: unknown;
  customerIds?: unknown;
}) {
  const database = await readDatabase();
  const year = Number(input.year);

  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    throw new Error("Geçerli bir yıl seçiniz.");
  }

  const months = resolveChargeMonths(input);
  const rawIds = input.ids ?? input.customerIds;
  const selectedIds = Array.isArray(rawIds)
    ? rawIds.map((id) => String(id)).filter(Boolean)
    : null;
  const created: Charge[] = [];
  let skipped = 0;
  let skippedClosed = 0;

  if (selectedIds && !selectedIds.length) {
    throw new Error("Tahakkuk için en az bir mükellef seçiniz.");
  }

  const selectedIdSet = selectedIds ? new Set(selectedIds) : null;
  const customers = database.customers
    .map(normalizeCustomer)
    .filter(
      (item) =>
        item.active &&
        isCustomerActiveInPeriod(item, year) &&
        (!selectedIdSet || selectedIdSet.has(item.id))
    );

  for (const customer of customers) {
    for (const month of months) {
      if (!isMonthlyChargeAllowed(customer.closedAt, year, month, customer.openedAt)) {
        skippedClosed += 1;
        continue;
      }

      const exists = database.charges.some(
        (item) =>
          item.customerId === customer.id &&
          item.year === year &&
          item.month === month &&
          normalizeCharge(item).kind === "monthly"
      );

      if (exists) {
        skipped += 1;
        continue;
      }

      const charge: Charge = {
        id: randomUUID(),
        customerId: customer.id,
        year,
        month,
        amount: getCustomerFeeForYear(customer, year),
        description: getAccountingFeeDescription(month),
        kind: "monthly",
        date: getDefaultChargeDate(year, month),
        createdAt: now()
      };

      database.charges.push(charge);
      created.push(charge);
    }
  }

  await writeDatabase(database);
  return { created, skipped, skippedClosed };
}

export async function deleteMonthlyCharges(input: { year: unknown; month: unknown; ids?: unknown }) {
  const database = await readDatabase();
  const { year, month } = requirePeriod(input.year, input.month);
  const ids = Array.isArray(input.ids)
    ? input.ids.map((id) => String(id)).filter(Boolean)
    : [];

  if (!ids.length) {
    throw new Error("Silmek için en az bir mükellef seçiniz.");
  }

  const selectedIds = new Set(ids);
  const beforeCount = database.charges.length;

  database.charges = database.charges.filter(
    (charge) =>
      !(
        selectedIds.has(charge.customerId) &&
        charge.year === year &&
        charge.month === month
      )
  );

  const deletedCount = beforeCount - database.charges.length;
  await writeDatabase(database);

  return { deletedCount };
}

export async function listPayments(options?: { period?: number; allDates?: boolean }) {
  const database = await readDatabase();
  const activePeriod = options?.period ?? database.office.period;
  const allDates = options?.allDates ?? false;
  const customerIds = new Set(
    database.customers
      .map(normalizeCustomer)
      .filter((customer) => isCustomerActiveInPeriod(customer, activePeriod))
      .map((customer) => customer.id)
  );

  return database.payments
    .filter((payment) => {
      if (!customerIds.has(payment.customerId)) return false;
      if (allDates) return true;
      return isDateInPeriod(payment.date, activePeriod);
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}

export async function getCustomerNameMap() {
  const database = await readDatabase();
  const map: Record<string, string> = {};

  for (const customer of database.customers) {
    map[customer.id] = normalizeCustomer(customer).name;
  }

  return map;
}

export async function createPayment(input: {
  customerId: unknown;
  date: unknown;
  amount: unknown;
  method?: unknown;
  description?: unknown;
}) {
  const database = await readDatabase();
  const customerId = requireText(input.customerId, "Müşteri");
  const customer = database.customers.find((item) => item.id === customerId);
  const date = requireText(input.date, "Tahsilat tarihi");

  if (!customer) {
    throw new Error("Müşteri bulunamadı.");
  }

  const paymentYear = new Date(`${date}T00:00:00`).getFullYear();
  requireCustomerInPeriod(customer, paymentYear);
  if (!isDateInPeriod(date, paymentYear)) {
    throw new Error(`Tahsilat tarihi ${paymentYear} dönemine ait olmalıdır.`);
  }

  const payment: Payment = {
    id: randomUUID(),
    customerId,
    date,
    amount: normalizeAmount(input.amount),
    method: String(input.method ?? "Nakit").trim() || "Nakit",
    description: String(input.description ?? "").trim(),
    createdAt: now()
  };

  database.payments.push(payment);
  await writeDatabase(database);
  return payment;
}

export async function updatePayment(
  id: string,
  input: {
    date?: unknown;
    amount?: unknown;
    method?: unknown;
    description?: unknown;
  }
) {
  const database = await readDatabase();
  const payment = database.payments.find((item) => item.id === id);

  if (!payment) {
    throw new Error("Tahsilat bulunamadı.");
  }

  const customer = database.customers.find((item) => item.id === payment.customerId);
  if (!customer) {
    throw new Error("Müşteri bulunamadı.");
  }

  if (input.date !== undefined) {
    const date = requireText(input.date, "Tahsilat tarihi");
    const paymentYear = new Date(`${date}T00:00:00`).getFullYear();
    requireCustomerInPeriod(customer, paymentYear);
    if (!isDateInPeriod(date, paymentYear)) {
      throw new Error(`Tahsilat tarihi ${paymentYear} dönemine ait olmalıdır.`);
    }
    payment.date = date;
  } else {
    const paymentYear = new Date(`${payment.date}T00:00:00`).getFullYear();
    requireCustomerInPeriod(customer, paymentYear);
  }

  if (input.amount !== undefined) payment.amount = normalizeAmount(input.amount);
  if (input.method !== undefined) payment.method = String(input.method ?? "Nakit").trim() || "Nakit";
  if (input.description !== undefined) payment.description = String(input.description ?? "").trim();

  await writeDatabase(database);
  return payment;
}

export async function deletePayment(id: string) {
  const database = await readDatabase();
  const payment = database.payments.find((item) => item.id === id);

  if (!payment) {
    throw new Error("Tahsilat bulunamadı.");
  }

  database.payments = database.payments.filter((item) => item.id !== id);
  await writeDatabase(database);
  return { customerId: payment.customerId };
}

export async function getSummary(input: { year: unknown; month: unknown }) {
  const database = await readDatabase();
  const { year, month } = requirePeriod(input.year, input.month);

  const rows: SummaryRow[] = database.customers
    .map(normalizeCustomer)
    .filter((customer) => isCustomerActiveInPeriod(customer, year))
    .map((customer) => {
      const customerCharges = database.charges.filter(
        (item) => item.customerId === customer.id && item.year === year
      );
      const customerPayments = database.payments.filter((item) => {
        if (item.customerId !== customer.id) return false;
        return isDateInPeriod(item.date, year);
      });
      const selectedMonthPayments = customerPayments.filter((item) => {
        const date = new Date(`${item.date}T00:00:00`);
        return date.getMonth() + 1 === month;
      });

      const openingBalance = getCustomerOpeningBalance(database, customer.id, year);

      return {
        customerId: customer.id,
        customerName: customer.name,
        title: customer.specialCode,
        monthlyFee: getCustomerFeeForYear(customer, year),
        openingBalance,
        totalCharges: sum(customerCharges.map((item) => item.amount)),
        totalPayments: sum(customerPayments.map((item) => item.amount)),
        balance:
          openingBalance +
          sum(customerCharges.map((item) => item.amount)) -
          sum(customerPayments.map((item) => item.amount)),
        selectedMonthCharge: sum(
          customerCharges.filter((item) => item.month === month).map((item) => item.amount)
        ),
        selectedMonthPayments: sum(selectedMonthPayments.map((item) => item.amount))
      };
    });

  return rows.sort((a, b) => b.balance - a.balance || a.customerName.localeCompare(b.customerName, "tr"));
}

export async function getYearEndRolloverPreview(input: {
  fromYear: unknown;
  toYear: unknown;
}) {
  const database = await readDatabase();
  const fromYear = Number(input.fromYear);
  const toYear = Number(input.toYear);

  if (!Number.isInteger(fromYear) || fromYear < 2000 || fromYear > 2100) {
    throw new Error("Geçerli bir kaynak yıl seçiniz.");
  }

  if (!Number.isInteger(toYear) || toYear !== fromYear + 1) {
    throw new Error("Hedef yıl, kaynak yılın bir sonraki yılı olmalıdır.");
  }

  const rows: YearEndRolloverPreviewRow[] = database.customers
    .map(normalizeCustomer)
    .filter((customer) => customer.active && isCustomerActiveInPeriod(customer, fromYear))
    .map((customer) => {
      const closingBalance = getCustomerYearBalance(database, customer.id, fromYear);
      const existing = getCarryForwardRecord(database, customer.id, toYear);

      return {
        customerId: customer.id,
        customerCode: customer.code,
        customerName: customer.name,
        closingBalance,
        alreadyCarried: Boolean(existing),
        existingBalance: existing?.balance ?? null
      };
    })
    .filter((row) => row.closingBalance !== 0 || row.alreadyCarried)
    .sort((a, b) =>
      a.customerCode.localeCompare(b.customerCode, "tr", { numeric: true, sensitivity: "base" })
    );

  return {
    fromYear,
    toYear,
    rows,
    totalBalance: sum(rows.map((row) => row.closingBalance))
  };
}

export async function performYearEndRollover(input: {
  fromYear: unknown;
  toYear: unknown;
  customerIds?: unknown;
}) {
  const database = await readDatabase();
  const fromYear = Number(input.fromYear);
  const toYear = Number(input.toYear);

  if (!Number.isInteger(fromYear) || fromYear < 2000 || fromYear > 2100) {
    throw new Error("Geçerli bir kaynak yıl seçiniz.");
  }

  if (!Number.isInteger(toYear) || toYear !== fromYear + 1) {
    throw new Error("Hedef yıl, kaynak yılın bir sonraki yılı olmalıdır.");
  }

  const selectedIds = Array.isArray(input.customerIds)
    ? input.customerIds.map((id) => String(id)).filter(Boolean)
    : null;
  const selectedIdSet = selectedIds ? new Set(selectedIds) : null;

  let created = 0;
  let updated = 0;
  let skipped = 0;
  let activated = 0;
  const results: CarryForward[] = [];

  for (const rawCustomer of database.customers) {
    const customer = normalizeCustomer(rawCustomer);
    if (!customer.active || !isCustomerActiveInPeriod(customer, fromYear)) continue;
    if (selectedIdSet && !selectedIdSet.has(customer.id)) continue;

    const closingBalance = getCustomerYearBalance(database, customer.id, fromYear);
    if (closingBalance === 0) {
      skipped += 1;
      continue;
    }

    const existingIndex = database.carryForwards.findIndex(
      (item) => item.customerId === customer.id && item.fromYear === fromYear && item.toYear === toYear
    );

    if (existingIndex >= 0) {
      database.carryForwards[existingIndex].balance = closingBalance;
      database.carryForwards[existingIndex].createdAt = now();
      results.push(database.carryForwards[existingIndex]);
      updated += 1;
    } else {
      const carryForward: CarryForward = {
        id: randomUUID(),
        customerId: customer.id,
        fromYear,
        toYear,
        balance: closingBalance,
        createdAt: now()
      };
      database.carryForwards.push(carryForward);
      results.push(carryForward);
      created += 1;
    }

    if (!isCustomerActiveInPeriod(customer, toYear)) {
      const index = database.customers.findIndex((item) => item.id === customer.id);
      if (index >= 0) {
        database.customers[index] = ensureCustomerActiveInPeriod(customer, toYear);
        activated += 1;
      }
    }
  }

  await writeDatabase(database);

  return {
    fromYear,
    toYear,
    created,
    updated,
    skipped,
    activated,
    carried: results
  };
}

export async function updateCarryForward(
  id: string,
  input: {
    amount: unknown;
    direction: unknown;
  }
) {
  const database = await readDatabase();
  const record = database.carryForwards.find((item) => item.id === id);

  if (!record) {
    throw new Error("Devir bakiyesi bulunamadı.");
  }

  const direction = input.direction === "alacak" ? "alacak" : "borc";
  const amount = normalizeAmount(input.amount);
  const balance = direction === "alacak" ? -amount : amount;

  if (balance === 0) {
    database.carryForwards = database.carryForwards.filter((item) => item.id !== id);
    await writeDatabase(database);
    return { customerId: record.customerId, deleted: true };
  }

  record.balance = balance;
  record.createdAt = now();
  await writeDatabase(database);
  return { customerId: record.customerId, deleted: false, carryForward: record };
}

export async function upsertCarryForward(input: {
  customerId: unknown;
  fromYear: unknown;
  toYear: unknown;
  amount: unknown;
  direction: unknown;
}) {
  const database = await readDatabase();
  const customerId = requireText(input.customerId, "Müşteri");
  const customer = database.customers.find((item) => item.id === customerId);

  if (!customer) {
    throw new Error("Müşteri bulunamadı.");
  }

  const fromYear = Number(input.fromYear);
  const toYear = Number(input.toYear);

  if (!Number.isInteger(fromYear) || fromYear < 2000 || fromYear > 2100) {
    throw new Error("Geçerli bir kaynak yıl seçiniz.");
  }

  if (!Number.isInteger(toYear) || toYear < 2000 || toYear > 2100) {
    throw new Error("Geçerli bir hedef yıl seçiniz.");
  }

  if (fromYear >= toYear) {
    throw new Error("Kaynak yıl hedef yıldan küçük olmalıdır.");
  }

  requireCustomerInPeriod(customer, toYear);

  const direction = input.direction === "alacak" ? "alacak" : "borc";
  const amount = normalizeAmount(input.amount);
  const balance = direction === "alacak" ? -amount : amount;

  const existing = getCarryForwardRecord(database, customerId, toYear);

  if (balance === 0) {
    if (existing) {
      database.carryForwards = database.carryForwards.filter((item) => item.id !== existing.id);
      await writeDatabase(database);
    }
    return { customerId, deleted: true, carryForward: null };
  }

  if (existing) {
    existing.fromYear = fromYear;
    existing.balance = balance;
    existing.createdAt = now();
    await writeDatabase(database);
    return { customerId, deleted: false, carryForward: existing };
  }

  const carryForward: CarryForward = {
    id: randomUUID(),
    customerId,
    fromYear,
    toYear,
    balance,
    createdAt: now()
  };

  database.carryForwards.push(carryForward);
  await writeDatabase(database);
  return { customerId, deleted: false, carryForward };
}

export async function deleteCarryForward(id: string) {
  const database = await readDatabase();
  const record = database.carryForwards.find((item) => item.id === id);

  if (!record) {
    throw new Error("Devir bakiyesi bulunamadı.");
  }

  database.carryForwards = database.carryForwards.filter((item) => item.id !== id);
  await writeDatabase(database);
  return { customerId: record.customerId };
}

function sum(values: number[]) {
  return Math.round(values.reduce((total, value) => total + value, 0) * 100) / 100;
}

function getCarryForwardRecord(
  database: Pick<Database, "carryForwards">,
  customerId: string,
  toYear: number
) {
  return (
    database.carryForwards.find(
      (item) => item.customerId === customerId && item.toYear === toYear
    ) ?? null
  );
}

function getCustomerOpeningBalance(
  database: Pick<Database, "carryForwards">,
  customerId: string,
  year: number
) {
  return getCarryForwardRecord(database, customerId, year)?.balance ?? 0;
}

function getCustomerYearBalance(
  database: Database,
  customerId: string,
  year: number
) {
  const openingBalance = getCustomerOpeningBalance(database, customerId, year);
  const totalCharges = sum(
    database.charges
      .filter((item) => item.customerId === customerId && item.year === year)
      .map((item) => item.amount)
  );
  const totalPayments = sum(
    database.payments
      .filter((item) => item.customerId === customerId && isDateInPeriod(item.date, year))
      .map((item) => item.amount)
  );

  return sum([openingBalance, totalCharges, -totalPayments]);
}

function ensureCustomerActiveInPeriod(customer: Customer, year: number) {
  const normalized = normalizeCustomer(customer);
  if (isCustomerActiveInPeriod(normalized, year)) {
    return normalized;
  }

  const fee = getCustomerFeeForYear(normalized, year);
  normalized.activePeriods = [...normalized.activePeriods, year].sort((a, b) => a - b);
  const otherFees = normalized.yearlyFees.filter((item) => item.year !== year);
  normalized.yearlyFees = [...otherFees, { year, amount: fee }].sort((a, b) => a.year - b.year);
  normalized.monthlyFee = fee;
  return normalized;
}

export async function getExportRows(type: string, input: { year: unknown; month: unknown }) {
  const database = await readDatabase();

  if (type === "customers") {
    return database.customers.map((customer) => {
      const normalized = normalizeCustomer(customer);
      return {
        Müşteri: normalized.name,
        Kod: normalized.code,
        "Özel Kod": normalized.specialCode,
        Yetkili: normalized.authorizedPerson,
        Telefon: normalized.phone,
        Gsm: normalized.mobile,
        "Yıllık Ücretler": normalized.yearlyFees
          .map((fee) => `${fee.year}: ${fee.amount}`)
          .join(" | "),
        "Aktif Dönemler": normalized.activePeriods.join(" | "),
        Durum: normalized.active ? "Aktif" : "Pasif"
      };
    });
  }

  if (type === "charges") {
    return database.charges.map((charge) => {
      const customer = database.customers.find((item) => item.id === charge.customerId);
      return {
        "Müşteri": customer?.name ?? "",
        "Yıl": charge.year,
        "Ay": charge.month,
        "Tutar": charge.amount,
        "Açıklama": charge.description
      };
    });
  }

  if (type === "payments") {
    return database.payments.map((payment) => {
      const customer = database.customers.find((item) => item.id === payment.customerId);
      return {
        "Müşteri": customer?.name ?? "",
        "Tarih": payment.date,
        "Tutar": payment.amount,
        "Ödeme Tipi": payment.method,
        "Açıklama": payment.description
      };
    });
  }

  const summary = await getSummary(input);
  return summary.map((row) => ({
    "Müşteri": row.customerName,
    "Unvan": row.title,
    "Aylık Ücret": row.monthlyFee,
    "Toplam Tahakkuk": row.totalCharges,
    "Toplam Tahsilat": row.totalPayments,
    "Bakiye": row.balance,
    "Seçili Ay Tahakkuk": row.selectedMonthCharge,
    "Seçili Ay Tahsilat": row.selectedMonthPayments
  }));
}

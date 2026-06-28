export type YearlyFee = {
  year: number;
  amount: number;
};

export type Customer = {
  id: string;
  code: string;
  specialCode: string;
  name: string;
  authorizedPerson: string;
  mobile: string;
  phone: string;
  fax: string;
  address: string;
  city: string;
  district: string;
  taxOffice: string;
  taxNumber: string;
  email: string;
  website: string;
  activePeriods: number[];
  monthlyFee: number;
  yearlyFees: YearlyFee[];
  active: boolean;
  closedAt: string;
  createdAt: string;
};

export type Charge = {
  id: string;
  customerId: string;
  year: number;
  month: number;
  date: string;
  amount: number;
  description: string;
  kind: "monthly" | "service";
  createdAt: string;
};

export type Payment = {
  id: string;
  customerId: string;
  date: string;
  amount: number;
  method: string;
  description: string;
  createdAt: string;
};

export type CarryForward = {
  id: string;
  customerId: string;
  fromYear: number;
  toYear: number;
  balance: number;
  createdAt: string;
};

export type Database = {
  customers: Customer[];
  charges: Charge[];
  payments: Payment[];
  carryForwards: CarryForward[];
  office: OfficeProfile;
};

export type OfficeProfile = {
  period: number;
  currency: string;
  firmName: string;
  authorizedPerson: string;
  mobile: string;
  phone: string;
  fax: string;
  address: string;
  city: string;
  district: string;
  taxOffice: string;
  taxNumber: string;
  email: string;
  website: string;
  logoDataUrl: string;
  updatedAt: string;
};

export type CustomerCardInput = {
  code: string;
  specialCode: string;
  name: string;
  authorizedPerson: string;
  mobile: string;
  phone: string;
  fax: string;
  address: string;
  city: string;
  district: string;
  taxOffice: string;
  taxNumber: string;
  email: string;
  website: string;
  monthlyFee: string;
  closedAt: string;
};

export type SummaryRow = {
  customerId: string;
  customerName: string;
  title: string;
  monthlyFee: number;
  openingBalance: number;
  totalCharges: number;
  totalPayments: number;
  balance: number;
  selectedMonthCharge: number;
  selectedMonthPayments: number;
};

export type YearEndRolloverPreviewRow = {
  customerId: string;
  customerCode: string;
  customerName: string;
  closingBalance: number;
  alreadyCarried: boolean;
  existingBalance: number | null;
};

export type StatementReportLine = {
  dateLabel: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  lineType: "carryforward" | "charge" | "payment";
};

export type StatementReport = {
  customerId: string;
  customerCode: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  period: number;
  includedYears: number[];
  periodLabel: string;
  openingBalance: number;
  totalCharges: number;
  totalPayments: number;
  totalDebit: number;
  totalCredit: number;
  closingBalance: number;
  lines: StatementReportLine[];
};

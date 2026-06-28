"use server";

import { revalidatePath } from "next/cache";
import {
  createCustomer,
  createPayment,
  createCharge,
  generateMonthlyCharges,
  getNextCustomerCode,
  getOfficeProfile,
  getSummary,
  listCharges,
  listCustomers,
  listPayments,
  getYearEndRolloverPreview,
  performYearEndRollover,
  updateCarryForward,
  deleteCarryForward,
  upsertCarryForward,
  updateOfficeProfile,
  updateCustomerFromCard,
  updateCharge,
  deleteCharge,
  updatePayment,
  deletePayment,
  listCustomersNotInPeriod,
  activateCustomerForPeriod
} from "@/lib/store";
import { OfficeProfile, CustomerCardInput } from "@/lib/types";

function revalidateAll() {
  revalidatePath("/");
  revalidatePath("/customers");
  revalidatePath("/charges");
  revalidatePath("/payments");
  revalidatePath("/reports");
  revalidatePath("/settings");
}

function revalidateCustomer(id: string) {
  revalidateAll();
  revalidatePath(`/customers/${id}`);
}

export async function fetchSummaryAction(year: number, month: number) {
  return getSummary({ year, month });
}

export async function fetchCustomersAction() {
  return listCustomers();
}

export async function fetchChargesAction() {
  return listCharges();
}

export async function fetchPaymentsAction() {
  return listPayments();
}

export async function createCustomerAction(input: CustomerCardInput) {
  const customer = await createCustomer(input);
  revalidateAll();
  return customer;
}

export async function updateCustomerAction(id: string, input: CustomerCardInput) {
  const customer = await updateCustomerFromCard(id, input);
  revalidateCustomer(id);
  return customer;
}

export async function fetchNextCustomerCodeAction() {
  return getNextCustomerCode();
}

export async function activateCustomerForPeriodAction(
  customerId: string,
  input: { year: number; monthlyFee?: string }
) {
  const customer = await activateCustomerForPeriod(customerId, input);
  revalidateCustomer(customerId);
  return customer;
}

export async function createPaymentAction(input: {
  customerId: string;
  date: string;
  amount: string;
  method: string;
  description?: string;
}) {
  const payment = await createPayment(input);
  revalidateCustomer(input.customerId);
  return payment;
}

export async function createChargeAction(input: {
  customerId: string;
  year: number;
  month: number;
  amount: string;
  description: string;
  kind?: "monthly" | "service";
}) {
  const charge = await createCharge(input);
  revalidateCustomer(input.customerId);
  return charge;
}

export async function updateChargeAction(
  id: string,
  customerId: string,
  input: { month: number; date: string; amount: string; description: string }
) {
  const charge = await updateCharge(id, input);
  revalidateCustomer(customerId);
  return charge;
}

export async function deleteChargeAction(id: string, customerId: string) {
  await deleteCharge(id);
  revalidateCustomer(customerId);
}

export async function updatePaymentAction(
  id: string,
  customerId: string,
  input: { date: string; amount: string; method: string; description: string }
) {
  const payment = await updatePayment(id, input);
  revalidateCustomer(customerId);
  return payment;
}

export async function deletePaymentAction(id: string, customerId: string) {
  await deletePayment(id);
  revalidateCustomer(customerId);
}

export async function updateCarryForwardAction(
  id: string,
  customerId: string,
  input: { amount: string; direction: "borc" | "alacak" }
) {
  await updateCarryForward(id, input);
  revalidateCustomer(customerId);
}

export async function upsertCarryForwardAction(
  customerId: string,
  input: {
    fromYear: number;
    toYear: number;
    amount: string;
    direction: "borc" | "alacak";
  }
) {
  await upsertCarryForward({ customerId, ...input });
  revalidateCustomer(customerId);
}

export async function deleteCarryForwardAction(id: string, customerId: string) {
  await deleteCarryForward(id);
  revalidateCustomer(customerId);
}

export async function generateMonthlyChargesAction(input: {
  year: number;
  months: number[];
  customerIds: string[];
}) {
  const result = await generateMonthlyCharges({
    year: input.year,
    months: input.months,
    ids: input.customerIds
  });
  revalidateAll();
  return result;
}

export async function fetchOfficeProfileAction() {
  return getOfficeProfile();
}

export async function updateOfficeProfileAction(input: Omit<OfficeProfile, "updatedAt">) {
  const office = await updateOfficeProfile({
    ...input,
    period: Number(input.period)
  });
  revalidateAll();
  return office;
}

export async function updateOfficePeriodAction(period: number) {
  const office = await updateOfficeProfile({ period: Number(period) });
  revalidateAll();
  return office;
}

export async function fetchYearEndRolloverPreviewAction(fromYear: number, toYear: number) {
  return getYearEndRolloverPreview({ fromYear, toYear });
}

export async function performYearEndRolloverAction(input: {
  fromYear: number;
  toYear: number;
  customerIds?: string[];
}) {
  const result = await performYearEndRollover(input);
  revalidateAll();
  return result;
}

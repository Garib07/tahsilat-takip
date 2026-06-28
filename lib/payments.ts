export function getDefaultPaymentDescription(method: string) {
  if (method === "Banka") {
    return "Banka Hesabına Havale";
  }
  if (method === "Nakit") {
    return "Nakit Tahsilat";
  }
  return "";
}

export const paymentMethods = ["Nakit", "Banka"] as const;

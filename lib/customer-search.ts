import { Customer, SummaryRow } from "@/lib/types";

export function normalizeCustomerSearch(query: string) {
  return query.trim().toLocaleLowerCase("tr-TR");
}

export function matchesCustomerSearch(
  customer: Pick<Customer, "code" | "name" | "authorizedPerson" | "specialCode">,
  query: string
) {
  const normalized = normalizeCustomerSearch(query);
  if (!normalized) return true;

  const haystack = [customer.code, customer.name, customer.authorizedPerson, customer.specialCode]
    .join(" ")
    .toLocaleLowerCase("tr-TR");

  return haystack.includes(normalized);
}

export function matchesSummaryRowSearch(
  row: Pick<SummaryRow, "customerName" | "title">,
  query: string
) {
  const normalized = normalizeCustomerSearch(query);
  if (!normalized) return true;

  const haystack = [row.customerName, row.title].join(" ").toLocaleLowerCase("tr-TR");
  return haystack.includes(normalized);
}

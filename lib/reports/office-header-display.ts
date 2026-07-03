import { OfficeProfile } from "@/lib/types";

export function formatOfficeAddress(office: OfficeProfile) {
  return [office.address, office.district, office.city]
    .map((part) => String(part ?? "").trim())
    .filter(Boolean)
    .join(" ");
}

export function formatOfficePhones(office: OfficeProfile) {
  const phones = [office.phone, office.mobile]
    .map((part) => String(part ?? "").trim())
    .filter(Boolean);

  return [...new Set(phones)].join(" · ");
}

export function getOfficeHeaderDisplay(office: OfficeProfile) {
  const fullName = String(office.fullName ?? "").trim();
  const firmName = String(office.firmName ?? "").trim();
  const address = formatOfficeAddress(office);
  const phones = formatOfficePhones(office);
  const hasLogo = Boolean(office.logoDataUrl?.trim());

  return {
    fullName,
    firmName,
    address,
    phones,
    hasLogo,
    hasContent: Boolean(fullName || firmName || address || phones || hasLogo)
  };
}

import { Charge } from "./types";
import { getDefaultChargeDate } from "./period";

export type ChargeKind = "monthly" | "service";

export function inferChargeKind(description: string): ChargeKind {
  return description.includes("Muhasebe Ücreti") ? "monthly" : "service";
}

export function normalizeCharge(charge: Charge & { kind?: ChargeKind; date?: string }): Charge {
  return {
    ...charge,
    date: String(charge.date ?? "").trim() || getDefaultChargeDate(charge.year, charge.month),
    kind: charge.kind ?? inferChargeKind(charge.description)
  };
}

export function isMonthlyCharge(charge: Pick<Charge, "kind" | "description">) {
  const kind = charge.kind ?? inferChargeKind(charge.description);
  return kind === "monthly";
}

export const serviceChargePresets = [
  "Danışmanlık Hizmeti",
  "Defter Tasdik Ücreti",
  "Kuruluş / Tesis İşlemleri",
  "Beyanname Düzenleme",
  "Devir",
  "Diğer Hizmet"
];

export const devirServicePreset = "Devir";

export function isDevirService(description: string) {
  return description.trim() === devirServicePreset;
}

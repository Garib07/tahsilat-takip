export type ReceivableStatus = "normal" | "doubtful";

export function normalizeReceivableStatus(value: unknown): ReceivableStatus {
  return value === "doubtful" ? "doubtful" : "normal";
}

export function splitReceivableBalance(
  balance: number,
  status: ReceivableStatus,
  doubtfulAmount = 0
) {
  if (balance <= 0 || status !== "doubtful") {
    return {
      doubtfulReceivable: 0,
      collectibleReceivable: Math.max(balance, 0)
    };
  }

  const doubtfulReceivable =
    doubtfulAmount > 0
      ? Math.min(balance, Math.round(doubtfulAmount * 100) / 100)
      : balance;
  const collectibleReceivable = Math.round((balance - doubtfulReceivable) * 100) / 100;

  return { doubtfulReceivable, collectibleReceivable };
}

export function receivableStatusLabel(status: ReceivableStatus) {
  return status === "doubtful" ? "Şüpheli" : "Normal";
}

export type DiscountMode = "" | "amount" | "percent";

export function normalizeDiscountMode(value: unknown): DiscountMode {
  return value === "amount" || value === "percent" ? value : "";
}

export function money(value: number) {
  const amount = Number.isFinite(value) ? value : 0;
  return Math.round(amount * 100) / 100;
}

export function discountRupees(base: number, mode: DiscountMode, value: number) {
  const safeBase = Math.max(0, money(base));
  const safeValue = Math.max(0, Number.isFinite(value) ? value : 0);
  if (!mode || safeValue <= 0 || safeBase <= 0) return 0;
  if (mode === "percent") {
    const percent = Math.min(100, safeValue);
    return money(Math.min(safeBase, (safeBase * percent) / 100));
  }
  return money(Math.min(safeBase, safeValue));
}

export function priceLine(
  unitPrice: number,
  quantity: number,
  mode: DiscountMode,
  value: number,
) {
  const gross = money(Math.max(0, unitPrice) * Math.max(0, quantity));
  const discountAmount = discountRupees(gross, mode, value);
  return {
    gross,
    discountAmount,
    lineTotal: money(gross - discountAmount),
  };
}

export function priceBill(
  lineTotals: number[],
  mode: DiscountMode,
  value: number,
) {
  const subtotal = money(lineTotals.reduce((sum, line) => sum + line, 0));
  const discountAmount = discountRupees(subtotal, mode, value);
  return {
    subtotal,
    discountAmount,
    total: money(subtotal - discountAmount),
  };
}

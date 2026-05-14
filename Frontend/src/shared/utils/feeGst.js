/** Training & placement: 6% GST on discounted base (matches backend). */

export const TRAINING_PLACEMENT_GST_RATE = 0.06;

export function roundMoney2(n) {
  return Math.round(Number(n) * 100) / 100;
}

export function discountedTotalWithGst(baseAmount) {
  if (baseAmount == null || baseAmount === "") return null;
  const n = parseFloat(baseAmount);
  if (!Number.isFinite(n)) return null;
  return roundMoney2(n * (1 + TRAINING_PLACEMENT_GST_RATE));
}

export function baseFromDiscountedInclGst(inclusiveAmount) {
  if (inclusiveAmount == null || inclusiveAmount === "") return null;
  const n = parseFloat(inclusiveAmount);
  if (!Number.isFinite(n) || n <= 0) return null;
  return roundMoney2(n / (1 + TRAINING_PLACEMENT_GST_RATE));
}

export function feeBalanceFromBaseDiscounted(baseDiscounted, feePaid) {
  const total = discountedTotalWithGst(baseDiscounted);
  if (total == null) return null;
  const paid = parseFloat(feePaid) || 0;
  return Math.max(0, roundMoney2(total - paid));
}

export function placementBaseAmount(placement_discounted_fee, placement_fee) {
  const d = parseFloat(placement_discounted_fee);
  if (Number.isFinite(d)) return d;
  const f = parseFloat(placement_fee);
  if (Number.isFinite(f)) return f;
  return null;
}

export function placementBalanceFromBase(
  placement_discounted_fee,
  placement_fee,
  placement_paid
) {
  const base = placementBaseAmount(placement_discounted_fee, placement_fee);
  if (base == null) return null;
  const total = discountedTotalWithGst(base);
  if (total == null) return null;
  const paid = parseFloat(placement_paid) || 0;
  return Math.max(0, roundMoney2(total - paid));
}

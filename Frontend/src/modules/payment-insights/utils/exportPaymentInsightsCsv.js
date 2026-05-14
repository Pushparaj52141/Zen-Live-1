import {
  discountedTotalWithGst,
  placementBaseAmount,
} from "@shared/utils/feeGst";
import {
  displayPaymentStatusForScope,
  placementFeeTarget,
} from "../hooks/usePaymentInsightsController";

function esc(cell) {
  const s = cell == null ? "" : String(cell);
  return `"${s.replace(/"/g, '""')}"`;
}

/**
 * Download current table as CSV for finance / audits.
 */
export function downloadPaymentInsightsCsv(rows, feeScope) {
  if (!Array.isArray(rows) || rows.length === 0) return;

  const headers = [
    "Lead ID",
    "Name",
    "Course actual",
    "Course discounted (incl. 6% GST)",
    "Course paid",
    "Placement actual",
    "Placement discounted (incl. 6% GST)",
    "Placement paid",
    "Placement target (internal)",
    "Lead status",
    `Fee status (${feeScope})`,
  ];

  const lines = [headers.map(esc).join(",")];

  rows.forEach((p) => {
    const pt = placementFeeTarget(p);
    const pDiscBase = placementBaseAmount(
      p.placement_discounted_fee,
      p.placement_fee
    );
    const row = [
      p.lead_id,
      p.name,
      p.actual_fee,
      discountedTotalWithGst(p.discounted_fee) ?? p.discounted_fee,
      p.fee_paid,
      p.placement_fee,
      pDiscBase != null ? discountedTotalWithGst(pDiscBase) : p.placement_discounted_fee,
      p.placement_paid,
      pt,
      p.status,
      displayPaymentStatusForScope(p, feeScope),
    ];
    lines.push(row.map(esc).join(","));
  });

  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `payment-insights-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

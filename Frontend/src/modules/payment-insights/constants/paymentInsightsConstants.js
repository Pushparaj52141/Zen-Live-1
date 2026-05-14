export const PAYMENT_INSIGHTS_COLORS = {
  paid: "#28a745",
  unpaid: "#dc3545",
  partial: "#ffc107",
};

export const PAYMENT_STATUS_ORDER = {
  paid: 0,
  "partially paid": 1,
  unpaid: 2,
  "not paid": 2,
};

export const PAYMENT_FILTER_OPTIONS = ["all", "paid", "unpaid", "partially paid"];

/** Which fee stream the summary + chart + table status use */
export const FEE_SCOPE_OPTIONS = [
  { value: "all", label: "All" },
  { value: "course", label: "Course" },
  { value: "placement", label: "Placement" },
];

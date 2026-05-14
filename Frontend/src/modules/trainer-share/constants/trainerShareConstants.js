export const defaultFilters = {
  batches: [],
  trainers: [],
  statuses: [],
  paymentPeriod: "",
  customDateFrom: "",
  customDateTo: "",
};

export const paymentPeriodOptions = [
  { value: "", label: "All Time" },
  { value: "last30days", label: "Last 30 Days" },
  { value: "last15days", label: "Last 15 Days" },
  { value: "custom", label: "Custom Date" },
];

export const statusOptions = [
  { value: "Pending", label: "Pending" },
  { value: "Paid", label: "Paid" },
  { value: "On Hold", label: "On Hold" },
];

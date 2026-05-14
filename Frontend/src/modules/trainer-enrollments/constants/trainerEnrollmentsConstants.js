export const STATUS_TABS = [
  { key: "all", label: "All" },
  { key: "submitted", label: "New" },
  { key: "accepted", label: "Approval Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
];

export const STATUS_STYLE = {
  submitted: {
    badge: "bg-blue-100 text-blue-800 border-blue-200",
    dot: "bg-blue-500",
    label: "Submitted",
  },
  accepted: {
    badge: "bg-cyan-100 text-cyan-800 border-cyan-200",
    dot: "bg-cyan-500",
    label: "Approval Pending",
  },
  approved: {
    badge: "bg-green-100 text-green-800 border-green-200",
    dot: "bg-green-500",
    label: "Approved",
  },
  rejected: {
    badge: "bg-red-100 text-red-800 border-red-200",
    dot: "bg-red-500",
    label: "Rejected",
  },
};

export const TAB_ACTIVE_CLASS = {
  all: "bg-gray-700 text-white border-gray-700",
  submitted: "bg-blue-600 text-white border-blue-600",
  accepted: "bg-cyan-600 text-white border-cyan-600",
  approved: "bg-green-600 text-white border-green-600",
  rejected: "bg-red-600 text-white border-red-600",
};

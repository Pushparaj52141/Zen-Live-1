import React from "react";

export function EnrollmentStatusBadge({ status, statusStyleMap }) {
  const s = statusStyleMap[status] || {
    badge: "bg-gray-100 text-gray-600 border-gray-200",
    dot: "bg-gray-400",
    label: status,
  };
  return (
    <span
      className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border inline-flex items-center gap-1.5 ${s.badge}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.dot}`} />
      {s.label}
    </span>
  );
}

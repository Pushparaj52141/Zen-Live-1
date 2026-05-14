import React from "react";

export function getTimeDifference(dateString) {
  if (!dateString) return { text: "-", isOverADay: false };
  const created = new Date(dateString);
  const now = new Date();
  const diffMs = now - created;
  const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHrs < 1) return { text: "<1hr", isOverADay: false };
  if (diffHrs < 24) return { text: `${diffHrs}hr`, isOverADay: false };
  const diffDays = Math.floor(diffHrs / 24);
  return { text: `${diffDays}d`, isOverADay: true };
}

export function getStatusColor(status) {
  switch ((status || "").trim().toLowerCase()) {
    case "paid":
      return "#28a745";
    case "partially paid":
      return "#ffc107";
    case "not paid":
      return "#dc3545";
    default:
      return "#adb5bd";
  }
}

export function getUnitLogo(unitName) {
  if (!unitName) return null;
  const key = unitName.trim().toLowerCase();
  if (key === "urbancode") {
    return (
      <img
        src="/uc_icon.png"
        alt="Urbancode"
        className="h-7 w-7 rounded-full border border-gray-200 object-cover bg-white"
      />
    );
  }
  if (key === "jobzenter") {
    return (
      <img
        src="/jz_icon.png"
        alt="Jobzenter"
        className="h-7 w-7 rounded-full border border-gray-200 object-cover bg-white"
      />
    );
  }
  return null;
}

export function getInitials(name) {
  if (!name) return "";
  return name
    .split(" ")
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

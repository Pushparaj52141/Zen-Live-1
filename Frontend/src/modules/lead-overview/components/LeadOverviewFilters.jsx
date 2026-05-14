import React from "react";
import { FaCalendarAlt, FaFilter } from "react-icons/fa";
import { QUICK_FILTER_OPTIONS } from "../constants/quickFilters";

export default function LeadOverviewFilters({
  fromDate,
  toDate,
  activeQuickFilter,
  onQuickFilter,
  onFromDateChange,
  onToDateChange,
  onReset,
}) {
  return (
    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-2 rounded-lg border border-gray-100 bg-white p-1.5 shadow-sm">
        <div className="flex items-center gap-2 px-2">
          <FaFilter className="text-xs text-gray-400" />
          <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-600">
            Quick Filters
          </span>
        </div>
        <div className="flex items-center rounded-md bg-gray-50 p-1">
          {QUICK_FILTER_OPTIONS.map((filter) => (
            <button
              key={filter}
              onClick={() => onQuickFilter(filter)}
              className={`rounded px-3 py-1 text-[10px] font-bold uppercase tracking-wide transition-all duration-200 ${
                activeQuickFilter === filter
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-xl border border-gray-100 bg-white p-1.5 shadow-sm">
        <div className="flex items-center gap-2 px-2">
          <FaCalendarAlt className="text-xs text-gray-400" />
          <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-600">
            Custom Range
          </span>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-2 py-1">
          <input
            type="date"
            value={fromDate}
            onChange={(e) => onFromDateChange(e.target.value)}
            className="w-24 bg-transparent text-[10px] font-semibold text-gray-700 outline-none"
          />
          <span className="text-[10px] text-gray-400">-</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => onToDateChange(e.target.value)}
            className="w-24 bg-transparent text-[10px] font-semibold text-gray-700 outline-none"
          />
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onReset}
            className="rounded-md bg-red-50 px-2 py-1 text-[10px] font-bold text-red-600 transition-colors hover:bg-red-100"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}


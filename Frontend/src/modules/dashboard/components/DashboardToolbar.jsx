import React from "react";

export function DashboardToolbar({
  onAddLead,
  appliedFilters,
  setAppliedFilters,
  loadBoard,
  isSearchActive,
  visibleCards,
  totalCards,
  searchQuery,
  viewMode,
  setViewMode,
  dueFollowUpCount = 0,
}) {
  return (
    <div className="flex items-center justify-between mb-4 pt-4 px-4 flex-shrink-0">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onAddLead}
          className="rounded bg-red-500 px-4 py-2 text-sm tracking-wide text-white shadow-md transition-all duration-150 hover:bg-red-600 font-semibold"
        >
          + Add Lead
        </button>

        <div className="flex items-center bg-white rounded-lg p-1 shadow-sm border border-gray-200">
          {[
            { id: "all", label: "All" },
            { id: "hot", label: "🔥 Hot Leads", color: "text-red-600 bg-red-50" },
          ].map((p) => {
            const isActive = (appliedFilters.priority || "all") === p.id;
            return (
              <button
                type="button"
                key={p.id}
                onClick={() => {
                  const newFilters = { ...appliedFilters, priority: p.id };
                  setAppliedFilters(newFilters);
                  loadBoard(newFilters);
                }}
                className={`px-3 py-1.5 text-[11px] font-bold rounded-md transition-all duration-200 ${
                  isActive
                    ? p.color || "bg-slate-800 text-white"
                    : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        {dueFollowUpCount > 0 && (
          <div
            className="flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-[11px] font-semibold text-amber-950 shadow-sm"
            title="Leads with a follow-up date of today or earlier"
          >
            <span aria-hidden>🔔</span>
            <span>
              {dueFollowUpCount} follow-up{dueFollowUpCount !== 1 ? "s" : ""} due
            </span>
          </div>
        )}
      </div>

      <div className="ml-auto flex items-center gap-3">
        {isSearchActive && (
          <p className="text-sm text-gray-600">
            Showing {visibleCards} of {totalCards} cards matching &ldquo;
            {searchQuery}&rdquo;
          </p>
        )}
        <div className="flex items-center bg-white rounded-lg p-1 shadow-sm border border-gray-200">
          <button
            type="button"
            onClick={() => setViewMode("cards")}
            className={`px-3 py-1.5 text-[11px] font-bold rounded-md transition-all duration-200 ${
              viewMode === "cards"
                ? "bg-slate-800 text-white"
                : "text-gray-500 hover:bg-gray-100"
            }`}
          >
            Cards
          </button>
          <button
            type="button"
            onClick={() => setViewMode("table")}
            className={`px-3 py-1.5 text-[11px] font-bold rounded-md transition-all duration-200 ${
              viewMode === "table"
                ? "bg-slate-800 text-white"
                : "text-gray-500 hover:bg-gray-100"
            }`}
          >
            Table
          </button>
        </div>
      </div>
    </div>
  );
}

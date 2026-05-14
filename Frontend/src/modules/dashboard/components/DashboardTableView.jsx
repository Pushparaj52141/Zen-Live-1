import React, { useMemo, useState } from "react";
import { sanitizeLeadDisplayText } from "@shared/utils/sanitizeLeadDisplayText";
import { formatFollowUpLine, getFollowUpStatus } from "../utils/followUpUtils";

/** border-separate + spacing 0 avoids tbody painting above sticky thead (Chrome/WebKit quirk with border-collapse). */
const thCell =
  "border-t border-b border-r border-slate-200 first:border-l bg-slate-100 px-2 py-2.5 text-[11px] font-semibold text-slate-600";
const tdCell = "border-b border-r border-slate-200 first:border-l px-2 py-1.5";
const getPlacementRowClass = (statusTitle = "") => {
  const normalized = String(statusTitle).trim().toLowerCase();
  if (normalized === "placement") return "bg-emerald-50/70";
  if (normalized === "placement due") return "bg-amber-50/75";
  if (normalized === "placement paid") return "bg-teal-50/75";
  return "";
};

export function DashboardTableView({ tableRows, onRowClick }) {
  const [columnFilters, setColumnFilters] = useState({
    name: "",
    mobile: "",
    course: "",
    feePaid: "",
    balance: "",
    batch: "",
    source: "",
    businessUnit: "",
    status: "",
    assignee: "",
  });

  const handleFilterChange = (key, value) => {
    setColumnFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const filteredTableRows = useMemo(() => {
    const safeIncludes = (value, filterValue) =>
      String(value ?? "").toLowerCase().includes(String(filterValue ?? "").toLowerCase().trim());

    return tableRows.filter((lead) => {
      const byName = safeIncludes(sanitizeLeadDisplayText(lead.name) || "-", columnFilters.name);
      const byMobile = safeIncludes(
        `${lead.country_code ? `${lead.country_code} ` : ""}${lead.mobile_number || "-"}`,
        columnFilters.mobile
      );
      const byCourse = safeIncludes(lead.course_name || "-", columnFilters.course);
      const byFeePaid = safeIncludes(lead.fee_paid ?? "0", columnFilters.feePaid);
      const byBalance = safeIncludes(lead.fee_balance ?? "0", columnFilters.balance);
      const byBatch = safeIncludes(
        lead.all_batch_names || lead.batch_name || "Not Assigned",
        columnFilters.batch
      );
      const bySource = safeIncludes(lead.source_name || lead.source || "-", columnFilters.source);
      const byBusinessUnit = safeIncludes(
        lead.unit_name || lead.business_unit || "-",
        columnFilters.businessUnit
      );
      const byStatus = safeIncludes(lead.statusTitle || "-", columnFilters.status);
      const byAssignee = safeIncludes(lead.assignee_name || "No Assignee", columnFilters.assignee);

      return (
        byName &&
        byMobile &&
        byCourse &&
        byFeePaid &&
        byBalance &&
        byBatch &&
        bySource &&
        byBusinessUnit &&
        byStatus &&
        byAssignee
      );
    });
  }, [tableRows, columnFilters]);

  return (
    <div className="flex-1 w-full px-4 pb-4 min-h-0">
      <div className="h-full min-h-0 isolate overflow-auto rounded-md border border-slate-200 bg-white shadow-sm">
        <table
          className="min-w-full border-separate border-spacing-0 text-left text-[13px] leading-snug text-slate-700"
          style={{ fontFamily: '"Segoe UI", system-ui, -apple-system, sans-serif' }}
        >
          <thead className="sticky top-0 z-20 bg-slate-100 shadow-[0_1px_0_0_rgb(203_213_225)]">
            <tr>
              <th
                className={`w-10 min-w-[2.25rem] px-1.5 text-center ${thCell}`}
              >
                #
              </th>
              <th className={thCell}>Name</th>
              <th className={thCell}>Mobile</th>
              <th className={thCell}>Course</th>
              <th className={thCell}>Fee paid</th>
              <th className={thCell}>Balance</th>
              <th className={thCell}>Batch</th>
              <th className={thCell}>Source</th>
              <th className={thCell}>Business unit</th>
              <th className={thCell}>Status</th>
              <th className={thCell}>Assignee</th>
            </tr>
            <tr className="bg-white">
              <th className={`w-10 min-w-[2.25rem] px-1.5 ${thCell}`} />
              <th className={thCell}>
                <input value={columnFilters.name} onChange={(e) => handleFilterChange("name", e.target.value)} className="w-full rounded border border-slate-300 px-1.5 py-1 text-[11px] font-normal" placeholder="Filter" />
              </th>
              <th className={thCell}>
                <input value={columnFilters.mobile} onChange={(e) => handleFilterChange("mobile", e.target.value)} className="w-full rounded border border-slate-300 px-1.5 py-1 text-[11px] font-normal" placeholder="Filter" />
              </th>
              <th className={thCell}>
                <input value={columnFilters.course} onChange={(e) => handleFilterChange("course", e.target.value)} className="w-full rounded border border-slate-300 px-1.5 py-1 text-[11px] font-normal" placeholder="Filter" />
              </th>
              <th className={thCell}>
                <input value={columnFilters.feePaid} onChange={(e) => handleFilterChange("feePaid", e.target.value)} className="w-full rounded border border-slate-300 px-1.5 py-1 text-[11px] font-normal" placeholder="Filter" />
              </th>
              <th className={thCell}>
                <input value={columnFilters.balance} onChange={(e) => handleFilterChange("balance", e.target.value)} className="w-full rounded border border-slate-300 px-1.5 py-1 text-[11px] font-normal" placeholder="Filter" />
              </th>
              <th className={thCell}>
                <input value={columnFilters.batch} onChange={(e) => handleFilterChange("batch", e.target.value)} className="w-full rounded border border-slate-300 px-1.5 py-1 text-[11px] font-normal" placeholder="Filter" />
              </th>
              <th className={thCell}>
                <input value={columnFilters.source} onChange={(e) => handleFilterChange("source", e.target.value)} className="w-full rounded border border-slate-300 px-1.5 py-1 text-[11px] font-normal" placeholder="Filter" />
              </th>
              <th className={thCell}>
                <input value={columnFilters.businessUnit} onChange={(e) => handleFilterChange("businessUnit", e.target.value)} className="w-full rounded border border-slate-300 px-1.5 py-1 text-[11px] font-normal" placeholder="Filter" />
              </th>
              <th className={thCell}>
                <input value={columnFilters.status} onChange={(e) => handleFilterChange("status", e.target.value)} className="w-full rounded border border-slate-300 px-1.5 py-1 text-[11px] font-normal" placeholder="Filter" />
              </th>
              <th className={thCell}>
                <input value={columnFilters.assignee} onChange={(e) => handleFilterChange("assignee", e.target.value)} className="w-full rounded border border-slate-300 px-1.5 py-1 text-[11px] font-normal" placeholder="Filter" />
              </th>
            </tr>
          </thead>
          <tbody className="relative z-0">
            {filteredTableRows.length === 0 ? (
              <tr>
                <td
                  colSpan={11}
                  className="border border-slate-200 px-3 py-8 text-center text-[13px] text-slate-500 bg-white"
                >
                  No leads found for current filters.
                </td>
              </tr>
            ) : (
              filteredTableRows.map((lead, idx) => {
                const fu = getFollowUpStatus(lead);
                const fuLine = formatFollowUpLine(lead);
                const placementRowClass = getPlacementRowClass(lead.statusTitle);
                const fuRow =
                  fu === "overdue"
                    ? "bg-rose-50/80 ring-1 ring-inset ring-rose-200"
                    : fu === "due_today"
                      ? "bg-rose-50/60 ring-1 ring-inset ring-rose-200"
                      : fu === "due_tomorrow"
                        ? "bg-amber-50/80 ring-1 ring-inset ring-amber-200"
                        : "";
                return (
                <tr
                  key={`${lead.lead_id}-${idx}`}
                  onClick={() => onRowClick(lead)}
                  className={`cursor-pointer transition-colors hover:bg-slate-100/90 ${
                    idx % 2 === 0 ? "bg-white" : "bg-slate-50/70"
                  } ${placementRowClass} ${fuRow}`}
                >
                  <td className="border border-slate-200 px-1.5 py-1.5 text-center text-[12px] tabular-nums text-slate-500">
                    {idx + 1}
                  </td>
                  <td
                    className="border border-slate-200 px-2 py-1.5 font-sans font-medium text-slate-800 [font-feature-settings:normal]"
                    title={fuLine || undefined}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      {sanitizeLeadDisplayText(lead.name) || "-"}
                      {fu === "overdue" && (
                        <span className="rounded bg-rose-100 px-1 py-0 text-[9px] font-bold uppercase text-rose-800">
                          Overdue
                        </span>
                      )}
                      {fu === "due_today" && (
                        <span className="rounded bg-rose-100 px-1 py-0 text-[9px] font-bold uppercase text-rose-900">
                          Today
                        </span>
                      )}
                      {fu === "due_tomorrow" && (
                        <span className="rounded bg-amber-100 px-1 py-0 text-[9px] font-bold uppercase text-amber-900">
                          Tomorrow
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="border border-slate-200 px-2 py-1.5 tabular-nums">
                    {lead.country_code ? `${lead.country_code} ` : ""}
                    {lead.mobile_number || "-"}
                  </td>
                  <td className="border border-slate-200 px-2 py-1.5">
                    {lead.course_name || "-"}
                  </td>
                  <td className="border border-slate-200 px-2 py-1.5 tabular-nums">
                    {lead.fee_paid ?? "0"}
                  </td>
                  <td className="border border-slate-200 px-2 py-1.5 tabular-nums">
                    {lead.fee_balance ?? "0"}
                  </td>
                  <td className="border border-slate-200 px-2 py-1.5">
                    {lead.all_batch_names || lead.batch_name || "Not Assigned"}
                  </td>
                  <td className="border border-slate-200 px-2 py-1.5">
                    {lead.source_name || lead.source || "-"}
                  </td>
                  <td className="border border-slate-200 px-2 py-1.5">
                    {lead.unit_name || lead.business_unit || "-"}
                  </td>
                  <td className="border border-slate-200 px-2 py-1.5">
                    <span
                      className="inline-flex max-w-full items-center gap-2 min-w-0"
                      title={lead.statusTitle}
                    >
                      <span
                        className={`h-2 w-2 shrink-0 rounded-full ${lead.statusColor}`}
                        aria-hidden
                      />
                      <span className="truncate text-[12px] text-slate-700">
                        {lead.statusTitle}
                      </span>
                    </span>
                  </td>
                  <td className="border border-slate-200 px-2 py-1.5">
                    {lead.assignee_name || "No Assignee"}
                  </td>
                </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import React from "react";
import { BsTable } from "react-icons/bs";

export default function PaymentsLogsTable({ logsFilter, onLogsFilterChange, sort, onChangeSort, logsLoading, filteredLogs }) {
  return (
    <div className="records-card bg-white border border-slate-200 rounded-2xl shadow-sm">
      <header>
        <div className="row align-items-center mb-3 no-gutter-row">
          <div className="col-md-12">
            <h5>
              <BsTable /> All Payment Logs
            </h5>
          </div>
        </div>
        <div className="search-row">
          <input
            type="text"
            value={logsFilter}
            onChange={(e) => onLogsFilterChange(e.target.value)}
            placeholder="Search by student name, mobile, course, batch, or remarks..."
          />
        </div>
      </header>
      <div className="table-wrapper rounded-[24px] border border-slate-100">
        <table className="min-w-full text-sm text-slate-800" id="paymentLogsTable" style={{ borderCollapse: "separate", borderSpacing: "0 10px" }}>
          <thead className="bg-slate-50 sticky top-0 z-10 text-xs uppercase tracking-[0.2em] text-slate-500">
            <tr>
              {[
                ["#", null],
                ["Date", "payment_date"],
                ["Student Name", "student_name"],
                ["Mobile", "mobile"],
                ["Course", "course_name"],
                ["Batch", "batch_name"],
                ["Amount (₹)", "amount"],
                ["Mode", "payment_mode"],
                ["Installment", "installment_count"],
                ["Remarks", "remarks"],
              ].map(([label, key]) => (
                <th
                  key={label}
                  className={`px-4 py-3 font-semibold text-left ${key ? "cursor-pointer select-none" : ""}`}
                  onClick={() => key && onChangeSort(key)}
                >
                  <span className="inline-flex items-center gap-1">
                    {label}
                    {key && sort.key === key && <span className="text-[10px]">{sort.direction === "asc" ? "▲" : "▼"}</span>}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {logsLoading ? (
              <tr>
                <td colSpan={10} className="text-center py-5 text-slate-500">Loading payment logs...</td>
              </tr>
            ) : filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={10} className="text-center py-5 text-slate-500">No payment logs found.</td>
              </tr>
            ) : (
              filteredLogs.map((log, idx) => (
                <tr key={log.installment_id || idx} className="bg-white shadow-sm border border-slate-200 rounded-xl">
                  <td className="px-4 py-3 text-slate-600 border-e border-slate-100">{idx + 1}</td>
                  <td className="px-4 py-3 text-slate-900 border-e border-slate-100">{log.payment_date ? new Date(log.payment_date).toLocaleDateString() : "—"}</td>
                  <td className="px-4 py-3 text-slate-900 border-e border-slate-100">{log.student_name || "—"}</td>
                  <td className="px-4 py-3 text-slate-600 border-e border-slate-100">{log.mobile || "—"}</td>
                  <td className="px-4 py-3 text-slate-900 border-e border-slate-100">{log.course_name || "—"}</td>
                  <td className="px-4 py-3 text-slate-600 border-e border-slate-100">{log.batch_name || "—"}</td>
                  <td className="px-4 py-3 text-slate-900 border-e border-slate-100">₹{Number(log.amount || 0).toLocaleString("en-IN")}</td>
                  <td className="px-4 py-3 text-slate-600 border-e border-slate-100">{log.payment_mode || "—"}</td>
                  <td className="px-4 py-3 text-slate-600 border-e border-slate-100">{log.installment_count || "—"}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {log.remarks || "—"}
                    {log.edit_reason && (
                      <div className="mt-1">
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
                          Reason: {log.edit_reason}
                        </span>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

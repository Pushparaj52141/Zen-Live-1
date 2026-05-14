import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";
import { Bar } from "react-chartjs-2";
import { BsArrowClockwise, BsDownload } from "react-icons/bs";
import { FiFilter, FiChevronDown } from "react-icons/fi";
import { downloadPaymentInsightsCsv } from "./utils/exportPaymentInsightsCsv";
import { FEE_SCOPE_OPTIONS, PAYMENT_FILTER_OPTIONS } from "./constants/paymentInsightsConstants";
import {
  discountedTotalWithGst,
  placementBaseAmount,
} from "@shared/utils/feeGst";
import {
  displayPaymentStatusForScope,
  moneyIN,
  placementFeeTarget,
  usePaymentInsightsController,
} from "./hooks/usePaymentInsightsController";

function hasPlacementBilling(p) {
  return placementFeeTarget(p) > 0 || (parseFloat(p.placement_paid) || 0) > 0;
}

function placementActualDisplay(p) {
  if (!hasPlacementBilling(p)) return "—";
  const v = parseFloat(p.placement_fee);
  if (!Number.isNaN(v) && v > 0) return moneyIN(v);
  return "—";
}

function placementDiscountedDisplay(p) {
  if (!hasPlacementBilling(p)) return "—";
  const base = placementBaseAmount(
    p.placement_discounted_fee,
    p.placement_fee
  );
  const incl = base != null ? discountedTotalWithGst(base) : null;
  if (incl != null) return moneyIN(incl);
  return "—";
}

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function PaymentInsightsMain() {
  const {
    fromDate,
    setFromDate,
    toDate,
    setToDate,
    status,
    setStatus,
    feeScope,
    setFeeScope,
    searchQuery,
    setSearchQuery,
    loading,
    filteredRows,
    rows,
    counts,
    summaryData,
    paymentStats,
    lastUpdated,
    refetch,
    reset,
    chartData,
    norm,
  } = usePaymentInsightsController();

  const chartOptionsWithScope = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        title: {
          display: true,
          text:
            feeScope === "course"
              ? "Course fee payment status"
              : feeScope === "placement"
                ? "Placement fee payment status"
                : "Combined (course + placement) status",
          font: { size: 12, weight: "bold" },
        },
      },
      scales: { y: { beginAtZero: true, ticks: { stepSize: 1, precision: 0 } } },
    }),
    [feeScope]
  );

  const b = summaryData.breakdown || {
    courseCollected: 0,
    coursePending: 0,
    placementCollected: 0,
    placementPending: 0,
  };

  const scopeTotals = () => {
    if (feeScope === "course") return { collected: b.courseCollected, pending: b.coursePending };
    if (feeScope === "placement") return { collected: b.placementCollected, pending: b.placementPending };
    return {
      collected: b.courseCollected + b.placementCollected,
      pending: b.coursePending + b.placementPending,
    };
  };

  const kpiMetrics = useMemo(() => {
    const { collected, pending } = scopeTotals();
    const billable = collected + pending;
    const recoveryPct = billable > 0 ? Math.round((collected / billable) * 1000) / 10 : 0;
    return { collected, pending, billable, recoveryPct };
  }, [b.courseCollected, b.coursePending, b.placementCollected, b.placementPending, feeScope]);

  const lastUpdatedLabel = useMemo(
    () =>
      lastUpdated.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    [lastUpdated]
  );

  const handleExportCsv = () => {
    if (!filteredRows.length) return;
    downloadPaymentInsightsCsv(filteredRows, feeScope);
  };

  const renderSummaryCard = () => {
    const hasDateFilter = fromDate || toDate;

    if (status === "all") {
      return (
        <>
          {hasDateFilter && paymentStats.totalPaymentsToday > 0 && (
            <div className="mb-2 rounded-md border border-purple-200 bg-purple-50/90 p-2">
              <p className="text-[9px] font-bold uppercase tracking-wide text-purple-900">Period payments</p>
              <div className="mt-1.5 grid grid-cols-2 gap-2 text-center">
                <div className="rounded border border-purple-100 bg-white/70 px-2 py-1">
                  <p className="text-[9px] text-purple-700/80">Transactions</p>
                  <p className="text-sm font-bold tabular-nums text-purple-800">{paymentStats.totalPaymentsToday}</p>
                </div>
                <div className="rounded border border-purple-100 bg-white/70 px-2 py-1">
                  <p className="text-[9px] text-purple-700/80">Amount</p>
                  <p className="text-sm font-bold tabular-nums text-purple-800">{moneyIN(paymentStats.totalAmountToday)}</p>
                </div>
              </div>
            </div>
          )}
          {/* Totals live only in the header KPI strip — here we show fee-type split only (no duplicate Collected/Outstanding). */}
          {feeScope === "all" && (
            <div className="mb-2 rounded-lg border border-blue-200 bg-blue-50/90 p-2.5">
              <h5 className="text-xs font-bold leading-tight text-blue-900">Split by fee type</h5>
              <p className="mt-0.5 text-[9px] leading-snug text-blue-800/75">
                Course + placement amounts; sums match <span className="font-semibold">Collected</span> &{" "}
                <span className="font-semibold">Outstanding</span> in the header.
              </p>
              <div className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                <div className="flex items-stretch justify-between gap-2 rounded-md border border-slate-200/90 bg-white/70 px-2 py-1.5">
                  <span className="text-[9px] font-bold uppercase tracking-wide text-slate-600">Course</span>
                  <div className="flex gap-3 text-right">
                    <div>
                      <span className="text-[8px] text-slate-500">Collected</span>
                      <p className="text-xs font-bold tabular-nums text-green-700">{moneyIN(b.courseCollected)}</p>
                    </div>
                    <div>
                      <span className="text-[8px] text-slate-500">Outstanding</span>
                      <p className="text-xs font-bold tabular-nums text-red-700">{moneyIN(b.coursePending)}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-stretch justify-between gap-2 rounded-md border border-emerald-200/90 bg-emerald-50/50 px-2 py-1.5">
                  <span className="text-[9px] font-bold uppercase tracking-wide text-emerald-900">Placement</span>
                  <div className="flex gap-3 text-right">
                    <div>
                      <span className="text-[8px] text-emerald-700/80">Collected</span>
                      <p className="text-xs font-bold tabular-nums text-green-700">{moneyIN(b.placementCollected)}</p>
                    </div>
                    <div>
                      <span className="text-[8px] text-emerald-700/80">Outstanding</span>
                      <p className="text-xs font-bold tabular-nums text-red-700">{moneyIN(b.placementPending)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      );
    }

    if (status === "paid") {
      return (
        <div className="mb-2 rounded-md border border-green-200 bg-green-50/90 p-2">
          <h5 className="text-[10px] font-bold uppercase tracking-wide text-green-900">Paid summary</h5>
          <div className="mt-1 grid grid-cols-2 gap-2 text-center">
            <div className="rounded border border-green-100 bg-white/70 py-1">
              <p className="text-[9px] text-green-800/80">Count</p>
              <p className="text-sm font-bold text-green-800">{summaryData.paid.count}</p>
            </div>
            <div className="rounded border border-green-100 bg-white/70 py-1">
              <p className="text-[9px] text-green-800/80">Amount</p>
              <p className="text-sm font-bold text-green-800">{moneyIN(summaryData.paid.total)}</p>
            </div>
          </div>
        </div>
      );
    }

    if (status === "unpaid") {
      return (
        <div className="mb-2 rounded-md border border-red-200 bg-red-50/90 p-2">
          <h5 className="text-[10px] font-bold uppercase tracking-wide text-red-900">Unpaid summary</h5>
          <div className="mt-1 grid grid-cols-2 gap-2 text-center">
            <div className="rounded border border-red-100 bg-white/70 py-1">
              <p className="text-[9px] text-red-800/80">Count</p>
              <p className="text-sm font-bold text-red-800">{summaryData.unpaid.count}</p>
            </div>
            <div className="rounded border border-red-100 bg-white/70 py-1">
              <p className="text-[9px] text-red-800/80">Due</p>
              <p className="text-sm font-bold text-red-800">{moneyIN(summaryData.unpaid.total)}</p>
            </div>
          </div>
        </div>
      );
    }

    if (status === "partially paid") {
      return (
        <div className="mb-2 rounded-md border border-yellow-200 bg-yellow-50/90 p-2">
          <h5 className="text-[10px] font-bold uppercase tracking-wide text-yellow-900">Partial summary</h5>
          <div className="mt-1 grid grid-cols-3 gap-1.5 text-center">
            <div className="rounded border border-yellow-100 bg-white/70 py-1">
              <p className="text-[9px] text-yellow-900/80">Students</p>
              <p className="text-sm font-bold text-yellow-900">{summaryData.partial.count}</p>
            </div>
            <div className="rounded border border-yellow-100 bg-white/70 py-1">
              <p className="text-[9px] text-yellow-900/80">Paid</p>
              <p className="text-sm font-bold text-yellow-900">{moneyIN(summaryData.partial.paid)}</p>
            </div>
            <div className="rounded border border-yellow-100 bg-white/70 py-1">
              <p className="text-[9px] text-yellow-900/80">Due</p>
              <p className="text-sm font-bold text-yellow-900">{moneyIN(summaryData.partial.remaining)}</p>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 text-[13px]">
      {/* HEADER with Inline Filters (Lead Overview Style) */}
      <div className="bg-white border-b shadow-sm">
        <div className="px-4 py-2.5">
          <div className="grid grid-cols-1 gap-2 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:items-center">
            {/* Left: Payment Status — label is static text, options are only inside the segmented control */}
            <div className="flex items-center gap-0 justify-self-start w-full sm:w-auto rounded-lg bg-white px-1.5 py-1.5 shadow-sm border border-gray-100">
              <span
                className="select-none shrink-0 flex items-center gap-1.5 pr-3 mr-2 border-r border-gray-200 text-[9px] font-medium uppercase tracking-widest text-gray-400"
                title="Not clickable — choose a status to the right"
              >
                <FiFilter className="text-gray-300 text-[11px]" aria-hidden />
                Payment status
              </span>
              <div
                className="flex items-center rounded-lg bg-gray-100/90 p-1 flex-wrap border border-gray-200/90 shadow-inner"
                role="group"
                aria-label="Payment status"
              >
                {PAYMENT_FILTER_OPTIONS.map((filterStatus) => (
                  <button
                    key={filterStatus}
                    type="button"
                    onClick={() => setStatus(filterStatus)}
                    className={`rounded-md px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wide transition-all duration-200 ${
                      status === filterStatus
                        ? "bg-white text-gray-900 shadow-sm ring-1 ring-gray-200/80"
                        : "text-gray-600 hover:text-gray-900 hover:bg-white/60"
                    }`}
                  >
                    {filterStatus === "all"
                      ? "All"
                      : filterStatus === "partially paid"
                      ? "Partial"
                      : filterStatus}
                  </button>
                ))}
              </div>
            </div>

            {/* Center: Fee type */}
            <div className="flex items-center gap-0 justify-self-center w-full sm:w-auto rounded-lg bg-white px-1.5 py-1.5 shadow-sm border border-gray-100">
              <span
                className="select-none shrink-0 pr-3 mr-2 border-r border-gray-200 text-[9px] font-medium uppercase tracking-widest text-gray-400"
                title="Not clickable — choose a fee type to the right"
              >
                Fee type
              </span>
              <div
                className="flex items-center rounded-lg bg-gray-100/90 p-1 border border-gray-200/90 shadow-inner flex-wrap gap-0.5 justify-center"
                role="group"
                aria-label="Fee type"
              >
                {FEE_SCOPE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setFeeScope(opt.value)}
                    className={`rounded-md px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wide transition-all duration-200 ${
                      feeScope === opt.value
                        ? "bg-white text-gray-900 shadow-sm ring-1 ring-gray-200/80"
                        : "text-gray-600 hover:text-gray-900 hover:bg-white/60"
                    }`}
                  >
                    {opt.label.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Right: Date Range */}
            <div className="flex items-center gap-0 justify-self-end w-full sm:w-auto flex-wrap justify-end rounded-lg bg-white px-1.5 py-1.5 shadow-sm border border-gray-100">
              <span
                className="select-none shrink-0 flex items-center gap-1.5 pr-3 mr-2 border-r border-gray-200 text-[9px] font-medium uppercase tracking-widest text-gray-400"
                title="Not clickable"
              >
                <FiChevronDown className="text-gray-300 text-[11px]" aria-hidden />
                Date range
              </span>

              <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-2 py-1 border border-gray-200">
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="bg-transparent text-[10px] font-semibold text-gray-700 outline-none w-24"
                />
                <span className="text-gray-400 text-[10px]">-</span>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="bg-transparent text-[10px] font-semibold text-gray-700 outline-none w-24"
                />
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={reset}
                  className="rounded-md bg-red-50 px-2 py-1 text-[10px] font-bold text-red-600 hover:bg-red-100 transition-colors"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Executive strip: production dashboards — recovery KPIs, refresh, export */}
      <div className="border-b border-emerald-100/80 bg-gradient-to-r from-slate-50 via-white to-emerald-50/50">
        <div className="mx-auto max-w-[1600px] px-4 py-2">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              {/* <h1 className="text-sm font-bold tracking-tight text-slate-800">Payment insights</h1>
              <p className="text-[10px] leading-snug text-slate-500 mt-0.5 max-w-2xl">
                Recovery by fee type; export matches search. <span className="text-slate-400">· {lastUpdatedLabel}</span>
                {loading ? " · …" : ""}
              </p> */}
            </div>
            <div className="flex flex-wrap items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => refetch()}
                disabled={loading}
                className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
                title="Reload data from server"
              >
                <BsArrowClockwise className={`text-xs ${loading ? "animate-spin" : ""}`} aria-hidden />
                Refresh
              </button>
              <button
                type="button"
                onClick={handleExportCsv}
                disabled={!filteredRows.length}
                className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2 py-1 text-[10px] font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed"
                title="CSV of visible rows"
              >
                <BsDownload className="text-xs" aria-hidden />
                Export
              </button>
            </div>
          </div>

          <div className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
            <div className="rounded-md border border-slate-200/90 bg-white px-2 py-1.5 shadow-sm">
              <p className="text-[8px] font-semibold uppercase tracking-wide text-slate-400">Recovery</p>
              <p className="text-lg font-bold leading-none text-emerald-700 tabular-nums">{kpiMetrics.recoveryPct}%</p>
            </div>
            <div className="rounded-md border border-slate-200/90 bg-white px-2 py-1.5 shadow-sm">
              <p className="text-[8px] font-semibold uppercase tracking-wide text-slate-400">Collected</p>
              <p className="text-sm font-bold leading-none text-green-700 tabular-nums">{moneyIN(kpiMetrics.collected)}</p>
            </div>
            <div className="rounded-md border border-slate-200/90 bg-white px-2 py-1.5 shadow-sm">
              <p className="text-[8px] font-semibold uppercase tracking-wide text-slate-400">Outstanding</p>
              <p className="text-sm font-bold leading-none text-red-700 tabular-nums">{moneyIN(kpiMetrics.pending)}</p>
            </div>
            <div className="rounded-md border border-amber-200/90 bg-amber-50/90 px-2 py-1.5 shadow-sm">
              <p className="text-[8px] font-semibold uppercase tracking-wide text-amber-800/90">Partial</p>
              <p className="text-lg font-bold leading-none text-amber-900 tabular-nums">{counts.partial}</p>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex flex-1 flex-col gap-4 p-4 lg:flex-row">
        {/* LEFT: Chart */}
        <div className="w-full flex-shrink-0 rounded-lg border bg-white p-3 shadow-sm lg:w-72">
          <div className="h-[min(420px,55vh)] min-h-[260px]">
            <Bar data={chartData} options={chartOptionsWithScope} />
          </div>
        </div>

        {/* RIGHT: Table */}
        <div className="flex min-w-0 flex-1 flex-col rounded-lg border bg-white shadow-sm">
          <div className="p-3">
            {renderSummaryCard()}

            {/* Search Input */}
            <div className="mb-2">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search name, mobile, course…"
                  className="w-full rounded-md border border-gray-300 py-1.5 pl-9 pr-3 text-xs focus:border-transparent focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <svg
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <p className="mt-2 text-[10px] text-slate-500">
                Showing <span className="font-semibold text-slate-700">{filteredRows.length}</span> of {rows.length}{" "}
                leads
                {searchQuery.trim() ? " · search applied" : ""}
              </p>
            </div>

            <div className="relative overflow-auto" style={{ maxHeight: "min(520px, calc(100vh - 280px))", minHeight: "240px" }}>
              <table className="w-full border-collapse text-xs">
                <thead className="sticky top-0 z-10 bg-gray-100">
                  <tr className="text-gray-700">
                    <th rowSpan={2} className="px-3 py-2 text-left font-semibold border border-gray-200 text-xs align-middle">
                      ID
                    </th>
                    <th rowSpan={2} className="px-3 py-2 text-left font-semibold border border-gray-200 text-xs align-middle">
                      Name
                    </th>
                    <th
                      className="px-3 py-2 text-center font-semibold border border-gray-200 text-xs bg-slate-100"
                      colSpan={3}
                    >
                      Course / training fees
                    </th>
                    <th
                      className="px-3 py-2 text-center font-semibold border border-gray-200 text-xs bg-emerald-50"
                      colSpan={3}
                    >
                      Placement fees
                    </th>
                    <th rowSpan={2} className="px-3 py-2 text-left font-semibold border border-gray-200 text-xs align-middle">
                      Lead Status
                    </th>
                    <th rowSpan={2} className="px-3 py-2 text-left font-semibold border border-gray-200 text-xs align-middle">
                      Fee payment status
                    </th>
                  </tr>
                  <tr className="text-gray-600 bg-gray-50">
                    <th className="px-3 py-1.5 border border-gray-200 text-[10px] font-medium text-center bg-slate-50">
                      Actual
                    </th>
                    <th className="px-3 py-1.5 border border-gray-200 text-[10px] font-medium text-center bg-slate-50">
                      Discounted
                    </th>
                    <th className="px-3 py-1.5 border border-gray-200 text-[10px] font-medium text-center bg-slate-50">
                      Paid
                    </th>
                    <th className="px-3 py-1.5 border border-gray-200 text-[10px] font-medium text-center bg-emerald-50">
                      Actual
                    </th>
                    <th className="px-3 py-1.5 border border-gray-200 text-[10px] font-medium text-center bg-emerald-50">
                      Discounted
                    </th>
                    <th className="px-3 py-1.5 border border-gray-200 text-[10px] font-medium text-center bg-emerald-50">
                      Paid
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={10} className="px-4 py-8 text-center text-gray-500">
                        <div className="flex items-center justify-center gap-2">
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent"></div>
                          Loading...
                        </div>
                      </td>
                    </tr>
                  ) : filteredRows.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-4 py-8 text-center text-gray-500">
                        No records found
                      </td>
                    </tr>
                  ) : (
                    filteredRows.map((p, idx) => (
                      <tr key={`${p.lead_id}-${idx}`} className="hover:bg-gray-50 transition-colors">
                        <td className="px-3 py-2 border border-gray-200 text-xs">
                          <Link
                            to="/lead-overview"
                            className="font-medium text-blue-600 hover:text-blue-800 underline-offset-2 hover:underline"
                            title="Lead overview — search this ID to open the lead"
                          >
                            {p.lead_id}
                          </Link>
                        </td>
                        <td className="px-3 py-2 border border-gray-200 text-xs truncate max-w-[150px]" title={p.name}>
                          {p.name}
                        </td>
                        <td className="px-3 py-2 border border-gray-200 text-xs bg-slate-50/80">{moneyIN(p.actual_fee)}</td>
                        <td className="px-3 py-2 border border-gray-200 text-xs bg-slate-50/80">{moneyIN(
                          discountedTotalWithGst(p.discounted_fee) ??
                            p.discounted_fee
                        )}</td>
                        <td className="px-3 py-2 border border-gray-200 text-xs font-medium bg-slate-50/80">{moneyIN(p.fee_paid)}</td>
                        <td className="px-3 py-2 border border-gray-200 text-xs bg-emerald-50/80">{placementActualDisplay(p)}</td>
                        <td className="px-3 py-2 border border-gray-200 text-xs bg-emerald-50/80">{placementDiscountedDisplay(p)}</td>
                        <td className="px-3 py-2 border border-gray-200 text-xs font-medium bg-emerald-50/80">
                          {hasPlacementBilling(p) ? moneyIN(p.placement_paid) : "—"}
                        </td>
                        <td className="px-3 py-2 border border-gray-200 text-xs">
                          <span className="inline-block px-2 py-1 text-[10px] rounded-full bg-blue-100 text-blue-800 capitalize">
                            {(p.status || "").replace(/([a-z])([A-Z])/g, "$1 $2")}
                          </span>
                        </td>
                        <td className="px-3 py-2 border border-gray-200 text-xs">
                          {(() => {
                            const ps = displayPaymentStatusForScope(p, feeScope);
                            const n = ps === "—" ? "" : norm(ps);
                            return (
                              <span
                                className={`inline-block px-2 py-1 text-[10px] rounded-full font-medium capitalize ${
                                  ps === "—"
                                    ? "bg-gray-100 text-gray-600"
                                    : n === "paid"
                                      ? "bg-green-100 text-green-800"
                                      : n === "partially paid"
                                        ? "bg-yellow-100 text-yellow-800"
                                        : "bg-red-100 text-red-800"
                                }`}
                              >
                                {ps}
                              </span>
                            );
                          })()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

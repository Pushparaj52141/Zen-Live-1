import { useCallback, useEffect, useMemo, useState } from "react";
import {
  PAYMENT_INSIGHTS_COLORS,
  PAYMENT_STATUS_ORDER,
} from "../constants/paymentInsightsConstants";
import { paymentInsightsService } from "../services/paymentInsightsService";
import {
  discountedTotalWithGst,
  placementBaseAmount,
} from "@shared/utils/feeGst";

const norm = (s) => (s || "").toLowerCase().trim();

/** Final placement fee due (incl. 6% GST); discounted if set, else actual. */
export function placementFeeTarget(p) {
  const base = placementBaseAmount(
    p?.placement_discounted_fee,
    p?.placement_fee
  );
  return discountedTotalWithGst(base) ?? 0;
}

/** Course + placement combined bucket for filters when fee scope is "all". */
export function combinedPaymentStatus(p) {
  const cT = discountedTotalWithGst(parseFloat(p.discounted_fee)) ?? 0;
  const cP = parseFloat(p.fee_paid) || 0;
  const pT = placementFeeTarget(p);
  const pP = parseFloat(p.placement_paid) || 0;

  const courseDone = cT <= 0 || cP >= cT;
  const placeDone = pT <= 0 || pP >= pT;
  const anyOwed = cT > 0 || pT > 0;
  const anyPaid = cP > 0 || pP > 0;

  if (!anyOwed) return "paid";
  if (courseDone && placeDone) return "paid";
  if (!anyPaid) return "unpaid";
  return "partially paid";
}

function derivePlacementStatus(p) {
  const target = placementFeeTarget(p);
  const paid = parseFloat(p.placement_paid) || 0;
  if (target <= 0) return null;
  if (paid >= target) return "paid";
  if (paid > 0) return "partially paid";
  return "unpaid";
}

/** Label for table + tooltips: matches active fee scope */
export function displayPaymentStatusForScope(p, feeScope) {
  if (feeScope === "course") return p.paid_status || "—";
  if (feeScope === "placement") {
    const ps = derivePlacementStatus(p);
    return ps == null ? "—" : ps;
  }
  return combinedPaymentStatus(p);
}

/** Status used for filtering + chart for the active fee scope. */
function effectiveStatusForScope(p, feeScope) {
  if (feeScope === "course") return norm(p.paid_status);
  if (feeScope === "placement") {
    const ps = derivePlacementStatus(p);
    return ps == null ? null : norm(ps);
  }
  return norm(combinedPaymentStatus(p));
}

/** Indian Rupee formatting */
export function moneyIN(n) {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return "₹0";
  return `₹${Number(n).toLocaleString("en-IN")}`;
}

export function usePaymentInsightsController() {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [status, setStatus] = useState("all");
  const [feeScope, setFeeScope] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [counts, setCounts] = useState({ paid: 0, unpaid: 0, partial: 0 });
  const [summaryData, setSummaryData] = useState({
    paid: { count: 0, total: 0 },
    unpaid: { count: 0, total: 0 },
    partial: { count: 0, paid: 0, remaining: 0 },
    /** Collected / pending split for Overall card */
    breakdown: {
      courseCollected: 0,
      coursePending: 0,
      placementCollected: 0,
      placementPending: 0,
    },
  });
  const [paymentStats, setPaymentStats] = useState({
    totalPaymentsToday: 0,
    totalAmountToday: 0,
  });
  const [lastUpdated, setLastUpdated] = useState(() => new Date());

  const loadData = useCallback(async (f = "", t = "", s = "all", scope = "all") => {
    setLoading(true);
    try {
      const [leadsRes, installmentsRes, placementRes] = await Promise.all([
        paymentInsightsService.fetchLeads(),
        paymentInsightsService.fetchInstallments(),
        paymentInsightsService.fetchPlacementInstallments().catch(() => ({ data: { installments: [] } })),
      ]);

      let src = Array.isArray(leadsRes.data) ? leadsRes.data : [];
      const installments = installmentsRes.data?.installments || installmentsRes.data?.data || [];
      const placementInstallments =
        placementRes?.data?.installments || placementRes?.data?.data || [];

      src = src.filter((p) => {
        const leadStatus = (p.status || "").toLowerCase().trim();
        return leadStatus !== "enquiry" && leadStatus !== "prospect" && leadStatus !== "archived";
      });

      src = src.map((p) => {
        const feePaid = parseFloat(p.fee_paid) || 0;
        const discountedFee =
          discountedTotalWithGst(parseFloat(p.discounted_fee)) ?? 0;
        let correctedStatus = p.paid_status;

        if (discountedFee > 0) {
          if (feePaid >= discountedFee) correctedStatus = "paid";
          else if (feePaid > 0) correctedStatus = "partially paid";
          else correctedStatus = "unpaid";
        } else if (discountedFee === 0 && p.paid_status) {
          if (norm(p.paid_status) === "unpaid" || norm(p.paid_status) === "not paid") {
            correctedStatus = "paid";
          }
        }
        return { ...p, paid_status: correctedStatus };
      });

      let filteredLeads = src;
      if (f || t) {
        const leadIdsWithPayments = new Set();
        let totalPaymentsInRange = 0;
        let totalAmountInRange = 0;

        const accumulatePaymentInRange = (row) => {
          if (!row?.payment_date) return;
          const paymentDate = new Date(row.payment_date);
          paymentDate.setHours(0, 0, 0, 0);
          let isInRange = true;

          if (f) {
            const fromDateValue = new Date(f);
            fromDateValue.setHours(0, 0, 0, 0);
            if (paymentDate < fromDateValue) isInRange = false;
          }
          if (t && isInRange) {
            const toDateValue = new Date(t);
            toDateValue.setHours(23, 59, 59, 999);
            if (paymentDate > toDateValue) isInRange = false;
          }

          if (isInRange) {
            leadIdsWithPayments.add(row.lead_id);
            totalPaymentsInRange += 1;
            totalAmountInRange += parseFloat(row.amount) || 0;
          }
        };

        installments.forEach(accumulatePaymentInRange);
        placementInstallments.forEach(accumulatePaymentInRange);

        filteredLeads = src.filter((lead) => leadIdsWithPayments.has(lead.lead_id));
        setPaymentStats({
          totalPaymentsToday: totalPaymentsInRange,
          totalAmountToday: totalAmountInRange,
        });
      } else {
        setPaymentStats({ totalPaymentsToday: 0, totalAmountToday: 0 });
      }

      let byStatus = filteredLeads.filter((p) => {
        const eff = effectiveStatusForScope(p, scope);
        if (eff == null) return scope !== "placement";
        if (s === "all") return true;
        return eff === norm(s);
      });

      byStatus.sort((a, b) => {
        const as = PAYMENT_STATUS_ORDER[effectiveStatusForScope(a, scope) ?? "unpaid"] ?? 99;
        const bs = PAYMENT_STATUS_ORDER[effectiveStatusForScope(b, scope) ?? "unpaid"] ?? 99;
        return as - bs;
      });

      setRows(byStatus);

      let paid = 0;
      let unpaid = 0;
      let partial = 0;
      let paidTotal = 0;
      let unpaidTotal = 0;
      let partialPaid = 0;
      let partialRemaining = 0;

      let courseCollected = 0;
      let coursePending = 0;
      let placementCollected = 0;
      let placementPending = 0;

      byStatus.forEach((p) => {
        const eff = effectiveStatusForScope(p, scope);
        if (scope === "placement" && eff == null) return;

        const cT = discountedTotalWithGst(parseFloat(p.discounted_fee)) ?? 0;
        const cP = parseFloat(p.fee_paid) || 0;
        const pT = placementFeeTarget(p);
        const pP = parseFloat(p.placement_paid) || 0;

        courseCollected += cP;
        coursePending += Math.max(0, cT - cP);
        placementCollected += pP;
        placementPending += Math.max(0, pT - pP);

        if (eff === "paid") {
          paid += 1;
          if (scope === "course") paidTotal += cT;
          else if (scope === "placement") paidTotal += pT;
          else paidTotal += cT + pT;
        } else if (eff === "partially paid") {
          partial += 1;
          if (scope === "course") {
            partialPaid += cP;
            partialRemaining += Math.max(0, cT - cP);
          } else if (scope === "placement") {
            partialPaid += pP;
            partialRemaining += Math.max(0, pT - pP);
          } else {
            partialPaid += cP + pP;
            partialRemaining += Math.max(0, cT - cP) + Math.max(0, pT - pP);
          }
        } else {
          unpaid += 1;
          if (scope === "course") unpaidTotal += Math.max(0, cT - cP);
          else if (scope === "placement") unpaidTotal += Math.max(0, pT - pP);
          else unpaidTotal += Math.max(0, cT - cP) + Math.max(0, pT - pP);
        }
      });

      setCounts({ paid, unpaid, partial });
      setSummaryData({
        paid: { count: paid, total: paidTotal },
        unpaid: { count: unpaid, total: unpaidTotal },
        partial: { count: partial, paid: partialPaid, remaining: partialRemaining },
        breakdown: {
          courseCollected,
          coursePending,
          placementCollected,
          placementPending,
        },
      });
    } catch (e) {
      console.error("Error loading payment insights:", e);
      setRows([]);
    } finally {
      setLoading(false);
      setLastUpdated(new Date());
    }
  }, []);

  const refetch = useCallback(() => {
    loadData(fromDate, toDate, status, feeScope);
  }, [loadData, fromDate, toDate, status, feeScope]);

  useEffect(() => {
    loadData(fromDate, toDate, status, feeScope);
  }, [loadData, fromDate, toDate, status, feeScope]);

  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) return rows;
    const query = searchQuery.toLowerCase().trim();
    return rows.filter((row) => {
      const name = (row.name || "").toLowerCase();
      const mobile = (row.mobile_number || "").toLowerCase();
      const course = (row.course_name || "").toLowerCase();
      return name.includes(query) || mobile.includes(query) || course.includes(query);
    });
  }, [rows, searchQuery]);

  const reset = () => {
    setFromDate("");
    setToDate("");
    setStatus("all");
    setFeeScope("all");
    setSearchQuery("");
  };

  const chartData = useMemo(() => {
    return {
      labels: ["Paid", "Unpaid", "Partially Paid"],
      datasets: [
        {
          label: "Number of Students",
          data: [counts.paid, counts.unpaid, counts.partial],
          backgroundColor: [
            PAYMENT_INSIGHTS_COLORS.paid,
            PAYMENT_INSIGHTS_COLORS.unpaid,
            PAYMENT_INSIGHTS_COLORS.partial,
          ],
          borderColor: [
            PAYMENT_INSIGHTS_COLORS.paid,
            PAYMENT_INSIGHTS_COLORS.unpaid,
            PAYMENT_INSIGHTS_COLORS.partial,
          ],
          borderWidth: 1,
        },
      ],
    };
  }, [counts]);

  return {
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
  };
}

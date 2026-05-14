import { useCallback, useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import { defaultFilters } from "../constants/trainerShareConstants";
import { trainerShareFeatureService } from "../services/trainerShareFeatureService";

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
});

export const formatCurrency = (value) => currencyFormatter.format(Number(value || 0));

const getComparableDate = (payout) => {
  const source = payout?.paid_on || payout?.payment_date;
  if (!source) return null;
  const parsed = new Date(source);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const formatDisplayDate = (value) => {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export function useTrainerShareController() {
  const [payouts, setPayouts] = useState([]);
  const [filteredPayouts, setFilteredPayouts] = useState([]);
  const [filters, setFilters] = useState(defaultFilters);
  const [loading, setLoading] = useState(true);
  const [updatingPayoutId, setUpdatingPayoutId] = useState(null);
  const [sendingEmails, setSendingEmails] = useState(false);
  const [editingPayoutId, setEditingPayoutId] = useState(null);
  const [editingStatus, setEditingStatus] = useState(null);
  const [allTrainers, setAllTrainers] = useState([]);
  const [allBatches, setAllBatches] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [payoutsResponse, trainersResponse, batchesResponse] = await Promise.all([
          trainerShareFeatureService.fetchPayouts(),
          trainerShareFeatureService.fetchTrainers(),
          trainerShareFeatureService.fetchBatches(),
        ]);
        const payoutRows = payoutsResponse?.payouts || [];
        setPayouts(payoutRows);
        setFilteredPayouts(payoutRows);
        if (trainersResponse?.success) setAllTrainers(trainersResponse.trainers || []);
        if (Array.isArray(batchesResponse)) setAllBatches(batchesResponse);
        else if (batchesResponse?.success) setAllBatches(batchesResponse.batches || []);
      } catch (error) {
        console.error("Failed to load trainer payouts", error);
        Swal.fire({
          icon: "error",
          title: "Unable to load payouts",
          text:
            error?.response?.data?.error ||
            error.message ||
            "Something went wrong while fetching trainer payouts.",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const batchOptions = useMemo(
    () =>
      allBatches
        .map((b) => ({ value: b.batch_name, label: b.batch_name }))
        .filter((opt) => opt.value)
        .sort((a, b) => a.label.localeCompare(b.label)),
    [allBatches]
  );

  const trainerOptions = useMemo(
    () =>
      allTrainers
        .map((t) => ({ value: String(t.trainer_id), label: t.trainer_name }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [allTrainers]
  );

  const summary = useMemo(
    () =>
      filteredPayouts.reduce(
        (acc, payout) => {
          const amount = Number(payout.amount || 0);
          if (payout.status === "Paid") acc.paid += amount;
          else if (payout.status === "On Hold") acc.onHold += amount;
          else acc.pending += amount;
          return acc;
        },
        { paid: 0, pending: 0, onHold: 0 }
      ),
    [filteredPayouts]
  );

  const handleMultiSelectChange = useCallback((key, selected) => {
    setFilters((prev) => ({ ...prev, [key]: selected?.map((option) => option.value) || [] }));
  }, []);

  const applyFilters = useCallback(() => {
    if (!payouts.length) return;
    const filtered = payouts.filter((payout) => {
      const batchLabel = payout.batch_name || "Unassigned";
      if (filters.batches.length && !filters.batches.includes(batchLabel)) return false;
      if (
        filters.trainers.length &&
        (!payout.trainer_id || !filters.trainers.includes(String(payout.trainer_id)))
      ) {
        return false;
      }
      const currentStatus = payout.status || "Pending";
      if (filters.statuses.length && !filters.statuses.includes(currentStatus)) return false;

      if (filters.paymentPeriod) {
        const recordDate = getComparableDate(payout);
        if (!recordDate) return false;
        if (filters.paymentPeriod === "custom") {
          if (!filters.customDateFrom && !filters.customDateTo) return false;
          if (filters.customDateFrom) {
            const fromDate = new Date(filters.customDateFrom);
            fromDate.setHours(0, 0, 0, 0);
            if (recordDate < fromDate) return false;
          }
          if (filters.customDateTo) {
            const toDate = new Date(filters.customDateTo);
            toDate.setHours(23, 59, 59, 999);
            if (recordDate > toDate) return false;
          }
        } else {
          const days = filters.paymentPeriod === "last30days" ? 30 : 15;
          const cutoff = new Date();
          cutoff.setDate(cutoff.getDate() - days);
          cutoff.setHours(0, 0, 0, 0);
          if (recordDate < cutoff) return false;
        }
      }
      return true;
    });
    setFilteredPayouts(filtered);
  }, [filters, payouts]);

  const handleResetFilters = () => {
    setFilters(defaultFilters);
    setFilteredPayouts(payouts);
  };

  const handleEditClick = (payout) => {
    setEditingPayoutId(payout.payout_id);
    setEditingStatus(payout.status || "Pending");
  };

  const handleOkClick = async (payout) => {
    if (!payout?.payout_id) {
      Swal.fire({ icon: "error", title: "Invalid payout", text: "Payout ID is missing." });
      return;
    }
    if (editingStatus === payout.status) {
      setEditingPayoutId(null);
      setEditingStatus(null);
      return;
    }
    setUpdatingPayoutId(payout.payout_id);
    try {
      const response = await trainerShareFeatureService.updateStatus(payout.payout_id, editingStatus);
      const newPayoutId = response?.data?.payout_id || payout.payout_id;
      const updatePayout = (item) => {
        const matchesById = item.payout_id === payout.payout_id;
        const matchesByTempId =
          String(payout.payout_id).includes("_") &&
          item.installment_id === payout.installment_id &&
          item.trainer_id === payout.trainer_id;
        if (matchesById || matchesByTempId) {
          return {
            ...item,
            payout_id: newPayoutId,
            status: editingStatus,
            paid_on: editingStatus === "Paid" ? new Date().toISOString() : item.paid_on,
          };
        }
        return item;
      };
      setPayouts((prev) => prev.map(updatePayout));
      setFilteredPayouts((prev) => prev.map(updatePayout));
      setEditingPayoutId(null);
      setEditingStatus(null);
      Swal.fire({
        icon: "success",
        title: "Status updated",
        text: `Payout marked as ${editingStatus}.`,
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error("Failed to update payout status", error);
      Swal.fire({
        icon: "error",
        title: "Unable to update status",
        text: error?.response?.data?.error || error.message || "Please try again.",
      });
    } finally {
      setUpdatingPayoutId(null);
    }
  };

  const handleCloseClick = () => {
    setEditingPayoutId(null);
    setEditingStatus(null);
  };

  const handleSendEmails = async () => {
    setSendingEmails(true);
    try {
      await trainerShareFeatureService.sendSummary(
        filters.paymentPeriod,
        filters.customDateFrom,
        filters.customDateTo
      );
      Swal.fire({
        icon: "success",
        title: "Emails sent",
        text: "Trainer payout summaries were delivered successfully.",
      });
    } catch (error) {
      console.error("Failed to send payout emails", error);
      Swal.fire({
        icon: "error",
        title: "Unable to send emails",
        text: error?.response?.data?.error || error.message || "Please try again.",
      });
    } finally {
      setSendingEmails(false);
    }
  };

  return {
    filteredPayouts,
    filters,
    setFilters,
    loading,
    updatingPayoutId,
    sendingEmails,
    editingPayoutId,
    editingStatus,
    setEditingStatus,
    batchOptions,
    trainerOptions,
    summary,
    handleMultiSelectChange,
    applyFilters,
    handleResetFilters,
    handleEditClick,
    handleOkClick,
    handleCloseClick,
    handleSendEmails,
  };
}

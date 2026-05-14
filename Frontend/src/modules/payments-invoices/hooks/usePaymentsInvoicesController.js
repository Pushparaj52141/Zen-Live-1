import { useCallback, useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import {
  PAYMENT_MODES,
  initialFeeSummary,
  paymentsInvoicesToast as Toast,
  todayISO,
} from "../constants/paymentsInvoicesConstants";
import { paymentsInvoicesService } from "../services/paymentsInvoicesService";

export function usePaymentsInvoicesController() {
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsFilter, setLogsFilter] = useState("");
  const [sort, setSort] = useState({ key: "payment_date", direction: "desc" });
  const [filters, setFilters] = useState({
    courses: [],
    batches: [],
    trainers: [],
    paymentModes: [],
  });
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [allLeads, setAllLeads] = useState([]);
  const [leadSearch, setLeadSearch] = useState("");
  const [leadOptionsOpen, setLeadOptionsOpen] = useState(false);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [feeSummary, setFeeSummary] = useState(initialFeeSummary);
  const [leadDetails, setLeadDetails] = useState(null);
  const [coursePayments, setCoursePayments] = useState([]);
  const [placementPayments, setPlacementPayments] = useState([]);
  const [editingPayment, setEditingPayment] = useState(null);
  const [editForm, setEditForm] = useState({
    amount: "",
    payment_date: "",
    payment_mode: "",
    remarks: "",
    reason: "",
  });
  const [updating, setUpdating] = useState(false);
  const [amount, setAmount] = useState("");
  const [payDate, setPayDate] = useState(todayISO());
  const [mode, setMode] = useState("");
  const [remarks, setRemarks] = useState("");
  const [shareRows, setShareRows] = useState([]);
  const [feeTab, setFeeTab] = useState(null);
  const [hasRecordedPayment, setHasRecordedPayment] = useState(false);
  const [allTrainers, setAllTrainers] = useState([]);
  const [allBatches, setAllBatches] = useState([]);

  const loadLogs = useCallback(async () => {
    setLogsLoading(true);
    try {
      const data = await paymentsInvoicesService.getAllInstallments();
      const rows = data?.installments || data?.data || [];
      setLogs(Array.isArray(rows) ? rows : []);
    } catch (err) {
      console.error("Failed to load payment logs:", err);
      setLogs([]);
    } finally {
      setLogsLoading(false);
    }
  }, []);

  const loadFilters = useCallback(async () => {
    try {
      const [trainersRes, batchesRes] = await Promise.all([
        paymentsInvoicesService.getTrainers(),
        paymentsInvoicesService.getBatches(),
      ]);
      if (trainersRes?.success && Array.isArray(trainersRes.trainers)) {
        setAllTrainers(trainersRes.trainers);
      }
      if (Array.isArray(batchesRes)) {
        setAllBatches(batchesRes);
      } else if (batchesRes?.success && Array.isArray(batchesRes.batches)) {
        setAllBatches(batchesRes.batches);
      }
    } catch (err) {
      console.error("Failed to load filter options:", err);
    }
  }, []);

  useEffect(() => {
    loadLogs();
    loadFilters();
  }, [loadLogs, loadFilters]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (leadOptionsOpen && !event.target.closest(".search-container")) {
        setLeadOptionsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [leadOptionsOpen]);

  const filterOptions = useMemo(() => {
    const courses = new Set();
    logs.forEach((log) => {
      if (log.course_name) courses.add(log.course_name);
    });
    return {
      courses: Array.from(courses).sort(),
      batches: allBatches.map((b) => b.batch_name).filter(Boolean).sort(),
      trainers: allTrainers.map((t) => t.trainer_name).filter(Boolean).sort(),
      paymentModes: PAYMENT_MODES,
    };
  }, [logs, allBatches, allTrainers]);

  const filteredLogs = useMemo(() => {
    const search = logsFilter.trim().toLowerCase();
    let rows = [...logs];
    if (search) {
      rows = rows.filter((log) => {
        const haystack = [
          log.student_name,
          log.mobile,
          log.course_name,
          log.batch_name,
          log.remarks,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(search);
      });
    }
    if (filters.courses?.length) rows = rows.filter((log) => filters.courses.includes(log.course_name));
    if (filters.batches?.length) rows = rows.filter((log) => filters.batches.includes(log.batch_name));
    if (filters.trainers?.length) rows = rows.filter((log) => filters.trainers.includes(log.trainer_name));
    if (filters.paymentModes?.length) rows = rows.filter((log) => filters.paymentModes.includes(log.payment_mode));
    if (dateFrom) {
      rows = rows.filter((log) => {
        if (!log.payment_date) return false;
        const logDate = new Date(log.payment_date);
        const fromDate = new Date(dateFrom);
        fromDate.setHours(0, 0, 0, 0);
        return logDate >= fromDate;
      });
    }
    if (dateTo) {
      rows = rows.filter((log) => {
        if (!log.payment_date) return false;
        const logDate = new Date(log.payment_date);
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        return logDate <= toDate;
      });
    }
    if (sort.key) {
      rows.sort((a, b) => {
        const aVal = a[sort.key];
        const bVal = b[sort.key];
        if (aVal === bVal) return 0;
        const order = sort.direction === "asc" ? 1 : -1;
        if (aVal == null) return 1 * order;
        if (bVal == null) return -1 * order;
        if (sort.key === "payment_date") return (new Date(aVal) - new Date(bVal)) * order;
        if (typeof aVal === "number" && typeof bVal === "number") return (aVal - bVal) * order;
        return String(aVal).localeCompare(String(bVal)) * order;
      });
    }
    return rows;
  }, [logs, logsFilter, sort, filters, dateFrom, dateTo]);

  const changeSort = (key) => {
    setSort((prev) => (prev.key === key ? { key, direction: prev.direction === "asc" ? "desc" : "asc" } : { key, direction: "asc" }));
  };

  const handleToggleFilter = (sectionKey, value) => {
    setFilters((prev) => {
      const currentValues = prev[sectionKey] || [];
      const nextValues = currentValues.includes(value)
        ? currentValues.filter((v) => v !== value)
        : [...currentValues, value];
      return { ...prev, [sectionKey]: nextValues };
    });
  };

  const handleClearFilters = () => {
    setFilters({ courses: [], batches: [], trainers: [], paymentModes: [] });
    setDateFrom("");
    setDateTo("");
  };

  const handleApplyFilters = () => setShowFilters(false);

  const filterSections = useMemo(
    () => [
      { key: "courses", title: "Course", options: filterOptions.courses.map((item) => ({ value: item, label: item })) },
      { key: "batches", title: "Batch", options: filterOptions.batches.map((item) => ({ value: item, label: item })) },
      { key: "trainers", title: "Trainer", options: filterOptions.trainers.map((item) => ({ value: item, label: item })) },
      { key: "paymentModes", title: "Payment Mode", options: filterOptions.paymentModes.map((item) => ({ value: item, label: item })) },
    ],
    [filterOptions]
  );

  const exportLogs = () => {
    if (!filteredLogs.length) {
      Toast.fire({ icon: "info", title: "No rows to export." });
      return;
    }
    const headers = ["Date", "Student", "Mobile", "Course", "Batch", "Amount", "Mode", "Installment", "Remarks"];
    const rows = filteredLogs.map((log) => [
      log.payment_date, log.student_name, log.mobile, log.course_name, log.batch_name, log.amount, log.payment_mode, log.installment_count, log.remarks,
    ]);
    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell ?? ""}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `payment-logs-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const resetModalState = () => {
    setLeadSearch("");
    setSelectedLead(null);
    setFeeSummary(initialFeeSummary);
    setLeadDetails(null);
    setCoursePayments([]);
    setPlacementPayments([]);
    setAmount("");
    setPayDate(todayISO());
    setMode("");
    setRemarks("");
    setShareRows([]);
    setFeeTab(null);
    setHasRecordedPayment(false);
  };

  const loadAllLeads = async () => {
    setLeadsLoading(true);
    try {
      const data = await paymentsInvoicesService.getLeads();
      const list = Array.isArray(data)
        ? data.map((lead) => ({ id: lead.lead_id, name: lead.name, mobile: lead.mobile_number, email: lead.email, course: lead.course_name || "—" }))
        : [];
      setAllLeads(list);
    } catch (err) {
      console.error("Failed to fetch leads:", err);
      setAllLeads([]);
    } finally {
      setLeadsLoading(false);
    }
  };

  const openModal = () => {
    setModalOpen(true);
    resetModalState();
    loadAllLeads();
  };
  const closeModal = () => setModalOpen(false);

  const filteredLeadOptions = useMemo(() => {
    const query = leadSearch.trim().toLowerCase();
    if (!query) return [];
    return allLeads
      .filter((lead) => lead.name?.toLowerCase().includes(query) || lead.mobile?.toLowerCase().includes(query) || String(lead.id).includes(query))
      .slice(0, 10);
  }, [leadSearch, allLeads]);

  const selectLead = async (lead) => {
    setSelectedLead(lead);
    setLeadSearch(lead.name);
    setLeadOptionsOpen(false);
    setCoursePayments([]);
    setPlacementPayments([]);
    setHasRecordedPayment(false);
    setLeadDetails(null);
    setFeeSummary(initialFeeSummary);
    setShareRows([]);
    try {
      setFeeTab("course");
      const [fee, details, installments, placementInfo] = await Promise.all([
        paymentsInvoicesService.getLeadPaymentInfo(lead.id),
        paymentsInvoicesService.getLeadById(lead.id),
        paymentsInvoicesService.getLeadInstallments(lead.id),
        paymentsInvoicesService.getLeadPlacementPayments(lead.id).catch(() => null),
      ]);
      setFeeSummary({
        actual_fee: fee.actual_fee ?? 0,
        discounted_fee: fee.discounted_fee ?? 0,
        fee_paid: fee.fee_paid ?? 0,
        fee_balance: fee.fee_balance ?? 0,
        installment_number: fee.installment_number ?? 1,
        institute_percentage: fee.institute_percentage ?? Math.max(0, 100 - (Array.isArray(fee.trainers) ? fee.trainers.reduce((sum, t) => sum + Number(t.share_percentage || 0), 0) : 0)),
        trainers: Array.isArray(fee.trainers) ? fee.trainers : [],
      });
      const mergedDetails = { ...(details || {}), ...(placementInfo?.lead_info || {}) };
      setLeadDetails(Object.keys(mergedDetails).length ? mergedDetails : null);
      setCoursePayments(Array.isArray(installments?.installments) ? installments.installments : []);
      setPlacementPayments(Array.isArray(placementInfo?.installments) ? placementInfo.installments : []);
      const cardTypeName = String(mergedDetails.card_type_name || "").toLowerCase();
      const isPlacementOnly =
        cardTypeName.includes("placement") &&
        !cardTypeName.includes("training") &&
        !cardTypeName.includes("both");
      setFeeTab(isPlacementOnly ? "placement" : "course");
    } catch (err) {
      console.error("Failed to load lead context:", err);
    }
  };

  useEffect(() => {
    if (feeTab !== "course" || !amount) {
      setShareRows([]);
      return;
    }
    const amt = Number(amount) || 0;
    const trainerRows = feeSummary.trainers?.map((trainer) => {
      const pct = Number(trainer.share_percentage || 0);
      return { label: trainer.trainer_name || "Trainer", pct, amount: Number(((amt * pct) / 100).toFixed(2)) };
    }) || [];
    const trainerPctTotal = trainerRows.reduce((sum, row) => sum + row.pct, 0);
    const institutePct = feeSummary.institute_percentage ?? Math.max(0, 100 - trainerPctTotal);
    setShareRows([...trainerRows, { label: "Institute", pct: institutePct, amount: Number(((amt * institutePct) / 100).toFixed(2)) }]);
  }, [amount, feeSummary, feeTab]);

  const recordPayment = async () => {
    if (!selectedLead?.id) return Toast.fire({ icon: "warning", title: "Please choose a student." });
    if (!amount || Number(amount) <= 0) return Toast.fire({ icon: "warning", title: "Please enter a valid amount." });
    setSaving(true);
    const isPlacement = feeTab === "placement";
    try {
      const paymentBody = { amount: Number(amount), payment_date: payDate, payment_mode: mode, remarks: remarks || null };
      if (isPlacement) await paymentsInvoicesService.recordPlacementPayment(selectedLead.id, paymentBody);
      else await paymentsInvoicesService.recordCoursePayment(selectedLead.id, paymentBody);
      Toast.fire({ icon: "success", title: isPlacement ? "Placement payment recorded successfully." : "Course payment recorded successfully." });
      await Promise.all([selectLead(selectedLead), loadLogs()]);
      setAmount("");
      setMode("");
      setRemarks("");
      setPayDate(todayISO());
      setHasRecordedPayment(true);
    } catch (err) {
      console.error("Failed to save payment:", err);
      Toast.fire({ icon: "error", title: err.message || "Failed to save payment." });
    } finally {
      setSaving(false);
    }
  };

  const handleSavePayment = (e) => {
    e.preventDefault();
    if (!hasRecordedPayment) return Toast.fire({ icon: "warning", title: "Please record a payment before saving." });
    closeModal();
  };

  const handleEditClick = (payment) => {
    setEditingPayment(payment);
    setEditForm({
      amount: payment.amount,
      payment_date: payment.payment_date ? new Date(payment.payment_date).toISOString().split("T")[0] : "",
      payment_mode: payment.payment_mode,
      remarks: payment.remarks || "",
      reason: "",
    });
  };
  const closeEditModal = () => {
    setEditingPayment(null);
    setEditForm({ amount: "", payment_date: "", payment_mode: "", remarks: "", reason: "" });
  };
  const handleUpdatePayment = async (e) => {
    e.preventDefault();
    if (!editForm.reason || editForm.reason.trim().length < 5) {
      Toast.fire({ icon: "warning", title: "Please provide a valid reason (min 5 chars)." });
      return;
    }
    setUpdating(true);
    try {
      const isPlacement = feeTab === "placement";
      const id = isPlacement ? editingPayment.placement_installment_id : editingPayment.installment_id;
      const payload = { ...editForm, amount: Number(editForm.amount) };
      if (isPlacement) await paymentsInvoicesService.updatePlacementPayment(id, payload);
      else await paymentsInvoicesService.updateInstallment(id, payload);
      Toast.fire({ icon: "success", title: "Payment updated successfully." });
      closeEditModal();
      if (selectedLead) await selectLead(selectedLead);
      loadLogs();
    } catch (err) {
      console.error("Failed to update payment:", err);
      Toast.fire({ icon: "error", title: err.message || "Failed to update payment." });
    } finally {
      setUpdating(false);
    }
  };

  const handleDeletePayment = async (payment) => {
    const isPlacement = !!payment.placement_installment_id;
    const id = isPlacement ? payment.placement_installment_id : payment.installment_id;
    if (!id) return Toast.fire({ icon: "error", title: "Invalid payment record ID." });
    const { isConfirmed } = await Swal.fire({
      title: "Delete Payment?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "Yes, Delete",
      // Payment modal overlay uses z-index 9999; SweetAlert2 default is lower, so dialogs render behind the form.
      zIndex: 100050,
      customClass: {
        container: "swal-invoice-modal",
      },
    });
    if (!isConfirmed) return;
    try {
      if (isPlacement) await paymentsInvoicesService.deletePlacementPayment(id);
      else await paymentsInvoicesService.deleteInstallment(id);
      Toast.fire({ icon: "success", title: "Payment deleted successfully." });
      if (selectedLead) await selectLead(selectedLead);
      loadLogs();
    } catch (err) {
      console.error("Failed to delete payment:", err);
      Toast.fire({ icon: "error", title: err.message || "Failed to delete payment." });
    }
  };

  return {
    logs, logsLoading, logsFilter, setLogsFilter, sort, filteredLogs, changeSort,
    filters, setFilters, dateFrom, setDateFrom, dateTo, setDateTo, showFilters, setShowFilters,
    filterSections, handleToggleFilter, handleClearFilters, handleApplyFilters, exportLogs,
    modalOpen, openModal, closeModal, saving, leadSearch, setLeadSearch, leadOptionsOpen, setLeadOptionsOpen,
    leadsLoading, selectedLead, leadDetails, feeSummary, coursePayments, placementPayments, feeTab, setFeeTab,
    amount, setAmount, payDate, setPayDate, mode, setMode, remarks, setRemarks, shareRows, allLeads, filteredLeadOptions,
    selectLead, recordPayment, handleSavePayment, setSelectedLead, setLeadDetails, setCoursePayments, setPlacementPayments, setFeeSummary,
    editingPayment, editForm, setEditForm, updating, handleEditClick, closeEditModal, handleUpdatePayment, handleDeletePayment,
  };
}

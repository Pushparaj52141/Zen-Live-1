import { useEffect, useMemo, useState } from "react";
import { STATUS_CONFIG } from "../constants/statusConfig";
import { leadOverviewService } from "../services/leadOverviewService";

export function useLeadOverviewController() {
  const [leads, setLeads] = useState([]);
  const [archivedLeads, setArchivedLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [activeQuickFilter, setActiveQuickFilter] = useState("All Time");
  const [isCustomOpen, setIsCustomOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalLeads, setModalLeads] = useState([]);
  const [modalStatus, setModalStatus] = useState("");
  const [modalColor, setModalColor] = useState("");

  useEffect(() => {
    const fetchLeads = async () => {
      setLoading(true);
      try {
        const { leads: regular, archived } =
          await leadOverviewService.getAllLeadsWithArchived();
        setLeads(regular);
        setArchivedLeads(archived);
      } catch (error) {
        console.error("Failed to fetch leads:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLeads();
  }, []);

  const handleQuickFilter = (type) => {
    setActiveQuickFilter(type);
    setIsCustomOpen(false);

    const now = new Date();
    let start = null;
    const end = new Date();

    if (type === "Today") {
      start = new Date();
    } else if (type === "This Week") {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      start = new Date(now.setDate(diff));
    } else if (type === "This Month") {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (type === "All Time") {
      setFromDate("");
      setToDate("");
      return;
    }

    if (start) {
      setFromDate(start.toISOString().split("T")[0]);
      setToDate(end.toISOString().split("T")[0]);
    }
  };

  const handleDateChange = (setter, value) => {
    setter(value);
    setActiveQuickFilter("Custom");
  };

  const handleResetFilters = () => {
    setFromDate("");
    setToDate("");
    setActiveQuickFilter("All Time");
    setIsCustomOpen(false);
  };

  const filteredLeads = useMemo(() => {
    const allLeads = [...leads, ...archivedLeads];
    if (!fromDate && !toDate) return allLeads;

    const start = fromDate ? new Date(fromDate) : null;
    const end = toDate ? new Date(toDate) : null;
    if (end) end.setHours(23, 59, 59, 999);

    return allLeads.filter((lead) => {
      if (!lead.created_at) return false;
      const created = new Date(lead.created_at);
      if (start && created < start) return false;
      if (end && created > end) return false;
      return true;
    });
  }, [leads, archivedLeads, fromDate, toDate]);

  const stats = useMemo(() => {
    const counts = {};
    STATUS_CONFIG.forEach((status) => {
      counts[status.key] = 0;
    });
    filteredLeads.forEach((lead) => {
      const statusKey = (lead.status || "").toLowerCase();
      if (STATUS_CONFIG.some((s) => s.key === statusKey)) counts[statusKey]++;
    });
    return STATUS_CONFIG.map((status) => ({ ...status, count: counts[status.key] || 0 }));
  }, [filteredLeads]);

  const handleCardClick = (statusKey, statusTitle, bgColor) => {
    const statusLeads = filteredLeads.filter(
      (lead) => (lead.status || "").toLowerCase() === statusKey
    );
    setModalLeads(statusLeads);
    setModalStatus(statusTitle);
    setModalColor(bgColor);
    setIsModalOpen(true);
  };

  return {
    loading,
    fromDate,
    toDate,
    activeQuickFilter,
    isCustomOpen,
    setIsCustomOpen,
    isModalOpen,
    setIsModalOpen,
    modalLeads,
    modalStatus,
    modalColor,
    stats,
    totalLeads: filteredLeads.length,
    handleQuickFilter,
    handleDateChange,
    handleResetFilters,
    setFromDate,
    setToDate,
    handleCardClick,
  };
}


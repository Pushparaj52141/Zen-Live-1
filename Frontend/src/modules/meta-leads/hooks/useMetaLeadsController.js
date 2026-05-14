import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import { META_LEAD_STATUS_OPTIONS } from "../constants/metaLeadStatusOptions";
import { metaLeadsService } from "../services/metaLeadsService";

export function useMetaLeadsController() {
  const [metaLeads, setMetaLeads] = useState([]);
  const [formSummary, setFormSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [editData, setEditData] = useState({
    lead_name: "",
    email: "",
    phone: "",
    notes: "",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [selectedFormId, setSelectedFormId] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  const fetchFormSummary = async () => {
    try {
      const res = await metaLeadsService.getFormsSummary();
      setFormSummary(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to fetch forms summary:", err);
    }
  };

  const fetchMetaLeads = async (showRefreshMessage = false, formId = selectedFormId) => {
    if (showRefreshMessage) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await metaLeadsService.list(formId);
      const normalized = Array.isArray(res.data) ? res.data : [];
      setMetaLeads(normalized);
      fetchFormSummary();
      if (showRefreshMessage) {
        Swal.fire({
          icon: "success",
          title: "Refreshed!",
          text: `Found ${normalized.length} leads`,
          timer: 2000,
          showConfirmButton: false,
        });
      }
    } catch (err) {
      console.error("Failed to fetch meta leads:", err);
      if (err.response?.status !== 404) {
        Swal.fire("Error", "Failed to fetch meta leads", "error");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchFormSummary();
    fetchMetaLeads();
    const interval = setInterval(() => {
      fetchFormSummary();
      fetchMetaLeads(false, selectedFormId);
    }, 30000);
    return () => clearInterval(interval);
  }, [selectedFormId]);

  const openViewModal = async (id) => {
    try {
      const res = await metaLeadsService.detail(id);
      setSelectedLead(res.data);
      setEditData({
        lead_name: res.data.lead_name || "",
        email: res.data.email || "",
        phone: res.data.phone || "",
        notes: res.data.notes || "",
      });
      setViewModalOpen(true);
    } catch (err) {
      console.error("Failed to load meta lead:", err);
      Swal.fire("Error", "Failed to load lead details", "error");
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedLead) return;
    setSaveLoading(true);
    try {
      await metaLeadsService.update(selectedLead.id, {
        ...selectedLead,
        ...editData,
      });
      await fetchMetaLeads();
      setSelectedLead({ ...selectedLead, ...editData });
      Swal.fire({
        icon: "success",
        title: "Lead Updated",
        text: "Changes saved successfully",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error("Failed to save lead:", err);
      Swal.fire("Error", "Failed to save changes", "error");
    } finally {
      setSaveLoading(false);
    }
  };

  const updateLeadStatus = async (id, newStatus) => {
    try {
      const lead = metaLeads.find((l) => l.id === id);
      await metaLeadsService.updateStatus(id, { ...lead, status: newStatus });
      await fetchMetaLeads();
      if (selectedLead && selectedLead.id === id) {
        setSelectedLead({ ...selectedLead, status: newStatus });
      }
      Swal.fire({
        icon: "success",
        title: "Status Updated",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error("Failed to update status:", err);
      Swal.fire("Error", "Failed to update lead status", "error");
    }
  };

  const handleConvert = async () => {
    if (!selectedLead) return;
    const result = await Swal.fire({
      title: "Convert Lead?",
      text: `Promote "${selectedLead.lead_name}" to the main CRM pipeline?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#059669",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Yes, Convert Now",
      showLoaderOnConfirm: true,
      preConfirm: async () => {
        try {
          const res = await metaLeadsService.convert(selectedLead.id);
          return res.data;
        } catch (error) {
          Swal.showValidationMessage(`Conversion failed: ${error.message}`);
        }
      },
    });
    if (result.isConfirmed && result.value?.success) {
      await fetchMetaLeads();
      setViewModalOpen(false);
      Swal.fire({
        icon: "success",
        title: "Converted!",
        text: "Lead successfully promoted to CRM board",
        timer: 1500,
        showConfirmButton: false,
      });
    }
  };

  const syncHistoricalLeads = async () => {
    const { value: pageId } = await Swal.fire({
      title: "Sync Past Leads",
      input: "text",
      inputLabel: "Enter your Facebook Page ID",
      inputPlaceholder: "e.g. 1029384756",
      showCancelButton: true,
      inputValidator: (value) => {
        if (!value) return "You need to provide a Page ID!";
      },
    });

    if (pageId) {
      setLoading(true);
      try {
        const res = await metaLeadsService.syncAll(pageId);
        const summary = res.data.summary;
        await fetchMetaLeads();
        Swal.fire({
          icon: "success",
          title: "Sync Complete",
          html: `
            <div class="text-left">
              <p>Checked <b>${summary.total_found}</b> leads across all channels.</p>
              <p class="text-green-600">Sync result:</p>
              <ul class="list-disc ml-5">
                <li>New Leads: <b>${summary.new_leads}</b></li>
                <li>Updated: <b>${summary.updated_leads}</b></li>
              </ul>
            </div>
          `,
        });
      } catch (err) {
        console.error("Sync failed:", err);
        Swal.fire(
          "Error",
          err.response?.data?.error || "Failed to sync historical leads",
          "error"
        );
      } finally {
        setLoading(false);
      }
    }
  };

  const deleteLead = (id) => {
    Swal.fire({
      title: "Delete this lead?",
      text: "This action cannot be undone",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    }).then(async (result) => {
      if (!result.isConfirmed) return;
      try {
        await metaLeadsService.remove(id);
        await fetchMetaLeads();
        setViewModalOpen(false);
        Swal.fire("Deleted!", "Lead has been removed.", "success");
      } catch (err) {
        console.error("Failed to delete lead:", err);
        Swal.fire("Error", "Failed to delete lead", "error");
      }
    });
  };

  const getStatusBadge = (status) => {
    const option = META_LEAD_STATUS_OPTIONS.find(
      (o) => o.value === status?.toLowerCase()
    );
    return option || {
      value: status,
      label: status || "N/A",
      color: "bg-gray-100 text-gray-700",
    };
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filteredMetaLeads = useMemo(() => {
    let filtered = [...metaLeads];
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((lead) => {
        const leadName = (lead.lead_name || "").toLowerCase();
        const email = (lead.email || "").toLowerCase();
        const phone = (lead.phone || "").toLowerCase();
        const campaignSource = (lead.campaign_source || "").toLowerCase();
        const adName = (lead.ad_name || "").toLowerCase();
        return (
          leadName.includes(query) ||
          email.includes(query) ||
          phone.includes(query) ||
          campaignSource.includes(query) ||
          adName.includes(query)
        );
      });
    }
    if (filterStatus) {
      filtered = filtered.filter(
        (lead) => lead.status?.toLowerCase() === filterStatus.toLowerCase()
      );
    }
    return filtered;
  }, [metaLeads, searchQuery, filterStatus]);

  const stats = useMemo(() => {
    const total = metaLeads.length;
    const newLeads = metaLeads.filter((l) => l.status === "new").length;
    const contacted = metaLeads.filter((l) => l.status === "contacted").length;
    const converted = metaLeads.filter((l) => l.status === "converted").length;
    return { total, newLeads, contacted, converted };
  }, [metaLeads]);

  return {
    metaLeads,
    formSummary,
    loading,
    refreshing,
    viewModalOpen,
    setViewModalOpen,
    selectedLead,
    saveLoading,
    editData,
    setEditData,
    searchQuery,
    setSearchQuery,
    filterStatus,
    setFilterStatus,
    selectedFormId,
    setSelectedFormId,
    showFilters,
    setShowFilters,
    statusOptions: META_LEAD_STATUS_OPTIONS,
    fetchMetaLeads,
    openViewModal,
    handleSaveEdit,
    updateLeadStatus,
    handleConvert,
    syncHistoricalLeads,
    deleteLead,
    getStatusBadge,
    formatDate,
    filteredMetaLeads,
    stats,
  };
}

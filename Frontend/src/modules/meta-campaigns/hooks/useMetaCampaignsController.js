import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import { META_CAMPAIGN_STATUS_OPTIONS } from "../constants/metaCampaignStatusOptions";
import { metaCampaignsService } from "../services/metaCampaignsService";

function normalizeCampaign(campaign) {
  return {
    ...campaign,
    status:
      (campaign.status || "").toLowerCase() === "active" ? "active" : "inactive",
  };
}

export function useMetaCampaignsController() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editCampaign, setEditCampaign] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const fetchMetaCampaigns = async () => {
    setLoading(true);
    try {
      const res = await metaCampaignsService.list();
      const normalized = Array.isArray(res.data)
        ? res.data.map(normalizeCampaign)
        : [];
      setCampaigns(normalized);
    } catch {
      Swal.fire("Error", "Failed to fetch meta campaigns", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetaCampaigns();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    const form = e.target;
    const data = {
      name: form.name.value,
      description: form.description.value,
      start_date: form.start_date.value,
      end_date: form.end_date.value,
      total_budget: form.total_budget.value,
      status: form.status.value,
    };
    try {
      await metaCampaignsService.create(data);
      await fetchMetaCampaigns();
      setAddModalOpen(false);
      Swal.fire("Success", "Meta campaign added!", "success");
      form.reset();
    } catch {
      Swal.fire("Error", "Failed to add meta campaign", "error");
    }
  };

  const openEditModal = async (id) => {
    try {
      const res = await metaCampaignsService.getById(id);
      setEditCampaign(normalizeCampaign(res.data || {}));
      setEditModalOpen(true);
    } catch {
      Swal.fire("Error", "Failed to load campaign", "error");
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    const form = e.target;
    const id = form.id.value;
    const data = {
      name: form.name.value,
      description: form.description.value,
      start_date: form.start_date.value,
      end_date: form.end_date.value,
      total_budget: form.total_budget.value,
      status: form.status.value,
    };
    try {
      await metaCampaignsService.update(id, data);
      await fetchMetaCampaigns();
      setEditModalOpen(false);
      Swal.fire("Success", "Meta campaign updated!", "success");
    } catch {
      Swal.fire("Error", "Failed to update meta campaign", "error");
    }
  };

  const handleDelete = (id) => {
    Swal.fire({
      title: "Are you sure?",
      text: "Delete this meta campaign?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    }).then(async (result) => {
      if (!result.isConfirmed) return;
      try {
        await metaCampaignsService.remove(id);
        await fetchMetaCampaigns();
        setEditModalOpen(false);
        Swal.fire("Deleted!", "Meta campaign deleted.", "success");
      } catch {
        Swal.fire("Error", "Failed to delete meta campaign", "error");
      }
    });
  };

  const filteredCampaigns = useMemo(() => {
    let filtered = [...campaigns];
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((campaign) => {
        const name = (campaign.name || "").toLowerCase();
        const description = (campaign.description || "").toLowerCase();
        const id = String(campaign.id || "").toLowerCase();
        return (
          name.includes(query) ||
          description.includes(query) ||
          id.includes(query)
        );
      });
    }
    if (filterStatus) {
      filtered = filtered.filter(
        (campaign) => (campaign.status || "").toLowerCase() === filterStatus
      );
    }
    return filtered;
  }, [campaigns, searchQuery, filterStatus]);

  return {
    campaigns,
    loading,
    addModalOpen,
    setAddModalOpen,
    editModalOpen,
    setEditModalOpen,
    editCampaign,
    searchQuery,
    setSearchQuery,
    filterStatus,
    setFilterStatus,
    showFilters,
    setShowFilters,
    statusOptions: META_CAMPAIGN_STATUS_OPTIONS,
    filteredCampaigns,
    handleAdd,
    openEditModal,
    handleEdit,
    handleDelete,
  };
}

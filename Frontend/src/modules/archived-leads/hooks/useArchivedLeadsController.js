import { useCallback, useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import { ARCHIVED_LEADS_SEARCH_FIELDS } from "../constants/archivedLeadsConstants";
import { archivedLeadsService } from "../services/archivedLeadsService";

function includesQuery(value, query) {
  return String(value || "").toLowerCase().includes(query);
}

export function useArchivedLeadsController() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchArchivedLeads = useCallback(async (showErrorAlert = false) => {
    setLoading(true);
    setError(null);
    try {
      const res = await archivedLeadsService.getArchivedLeads();
      if (res.success === false) {
        setError(res.error);
        setLeads([]);
        if (showErrorAlert) {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: res.error || "Failed to fetch archived leads.",
          });
        }
        return;
      }
      setLeads(res);
    } catch (err) {
      const message = err.message || "Failed to fetch archived leads.";
      setError(message);
      setLeads([]);
      if (showErrorAlert) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: message,
        });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchArchivedLeads(false);
  }, [fetchArchivedLeads]);

  const handleUnarchive = useCallback(async (lead) => {
    const result = await Swal.fire({
      title: "Restore Lead?",
      text: `Are you sure you want to restore ${lead.name || "this lead"}?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#10b981",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, restore it!",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    try {
      const id = lead.lead_id || lead.id;
      const res = await archivedLeadsService.unarchiveLead(id);
      if (res && !res.success && res.error) {
        if (res.error.toLowerCase().includes("not found")) {
          Swal.fire({
            icon: "warning",
            title: "Lead Not Found",
            text: "This lead no longer exists or was already restored.",
          });
          setLeads((prev) =>
            prev.filter((item) => (item.lead_id || item.id) !== id)
          );
        } else {
          Swal.fire({
            icon: "error",
            title: "Restore Failed",
            text: res.error || "Failed to restore lead.",
          });
        }
        return;
      }

      Swal.fire({
        icon: "success",
        title: "Lead Restored!",
        text: "Lead has been restored successfully.",
        timer: 2000,
        showConfirmButton: false,
      });

      setLeads((prev) => prev.filter((item) => (item.lead_id || item.id) !== id));
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.message || "Failed to restore lead.",
      });
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    await fetchArchivedLeads(true);
  }, [fetchArchivedLeads]);

  const filteredLeads = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return leads;

    return leads.filter((lead) => {
      const byId = includesQuery(lead.lead_id || lead.id, query);
      const byConfiguredFields = ARCHIVED_LEADS_SEARCH_FIELDS.some((field) =>
        includesQuery(lead[field], query)
      );
      return byId || byConfiguredFields;
    });
  }, [leads, searchQuery]);

  return {
    leads,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    filteredLeads,
    handleUnarchive,
    handleRefresh,
  };
}

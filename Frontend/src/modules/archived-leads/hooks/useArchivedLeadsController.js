import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Swal from "sweetalert2";
import { ARCHIVED_LEADS_SEARCH_FIELDS } from "../constants/archivedLeadsConstants";
import { archivedLeadsService } from "../services/archivedLeadsService";

function includesQuery(value, query) {
  return String(value || "").toLowerCase().includes(query);
}

function normalizeSearchTerm(term) {
  return typeof term === "string" ? term.trim().toLowerCase() : "";
}

function matchesNavbarSearch(lead, query) {
  if (!query) return true;
  const name = (lead.name || "").toLowerCase();
  const mobile = (lead.mobile_number || "").toString();
  return name.includes(query) || mobile.includes(query);
}

export function useArchivedLeadsController() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [navbarSearchQuery, setNavbarSearchQuery] = useState("");
  const [appliedFilters, setAppliedFilters] = useState({});
  const appliedFiltersRef = useRef(appliedFilters);

  useEffect(() => {
    appliedFiltersRef.current = appliedFilters;
  }, [appliedFilters]);

  const fetchArchivedLeads = useCallback(async (filters = {}, showErrorAlert = false) => {
    setLoading(true);
    setError(null);
    try {
      const res = await archivedLeadsService.getArchivedLeads(filters);
      if (res && res.success === false) {
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
      setLeads(Array.isArray(res) ? res : []);
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
    fetchArchivedLeads({}, false);
  }, [fetchArchivedLeads]);

  useEffect(() => {
    function onGlobalFilters(e) {
      try {
        const filters = e?.detail || {};
        setAppliedFilters(filters || {});
        fetchArchivedLeads(filters || {}, false);
      } catch {
        // Silent fail
      }
    }
    if (typeof window !== "undefined" && window.addEventListener) {
      window.addEventListener("zen:filtersApplied", onGlobalFilters);
    }
    return () => {
      if (typeof window !== "undefined" && window.removeEventListener) {
        window.removeEventListener("zen:filtersApplied", onGlobalFilters);
      }
    };
  }, [fetchArchivedLeads]);

  useEffect(() => {
    function onNavbarSearch(event) {
      const nextQuery = typeof event?.detail === "string" ? event.detail : "";
      setNavbarSearchQuery(nextQuery);
    }
    if (typeof window !== "undefined" && window.addEventListener) {
      window.addEventListener("zen:leadSearch", onNavbarSearch);
    }
    return () => {
      if (typeof window !== "undefined" && window.removeEventListener) {
        window.removeEventListener("zen:leadSearch", onNavbarSearch);
      }
    };
  }, []);

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
    await fetchArchivedLeads(appliedFiltersRef.current, true);
  }, [fetchArchivedLeads]);

  const filteredLeads = useMemo(() => {
    const pageQuery = normalizeSearchTerm(searchQuery);
    const navQuery = normalizeSearchTerm(navbarSearchQuery);

    return leads.filter((lead) => {
      const matchesPageSearch =
        !pageQuery ||
        includesQuery(lead.lead_id || lead.id, pageQuery) ||
        ARCHIVED_LEADS_SEARCH_FIELDS.some((field) =>
          includesQuery(lead[field], pageQuery)
        ) ||
        includesQuery(lead.trainer_name, pageQuery) ||
        includesQuery(lead.source, pageQuery) ||
        includesQuery(lead.unit_name, pageQuery) ||
        includesQuery(lead.card_type_name, pageQuery);

      const matchesNavSearch = matchesNavbarSearch(lead, navQuery);

      return matchesPageSearch && matchesNavSearch;
    });
  }, [leads, searchQuery, navbarSearchQuery]);

  const hasActiveFilters = useMemo(() => {
    if (!appliedFilters || typeof appliedFilters !== "object") return false;
    return Object.values(appliedFilters).some(
      (value) => Array.isArray(value) && value.length > 0
    );
  }, [appliedFilters]);

  return {
    leads,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    filteredLeads,
    handleUnarchive,
    handleRefresh,
    appliedFilters,
    hasActiveFilters,
    navbarSearchQuery,
  };
}

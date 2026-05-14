import { useEffect, useMemo, useState } from "react";

export function useDashboardSearch(columns) {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    function onSearchEvent(event) {
      const nextQuery = typeof event?.detail === "string" ? event.detail : "";
      setSearchQuery(nextQuery);
    }
    if (typeof window !== "undefined" && window.addEventListener) {
      window.addEventListener("zen:leadSearch", onSearchEvent);
    }
    return () => {
      if (typeof window !== "undefined" && window.removeEventListener) {
        window.removeEventListener("zen:leadSearch", onSearchEvent);
      }
    };
  }, []);

  const normalizedSearchVal = debouncedSearch.trim().toLowerCase();
  const isSearchActive = normalizedSearchVal.length > 0;

  const filteredColumns = useMemo(() => {
    if (!normalizedSearchVal) {
      return columns;
    }
    const matchesSearch = (lead = {}) => {
      const name = (lead.name || "").toLowerCase();
      const mobile = (lead.mobile_number || "").toString();
      return name.includes(normalizedSearchVal) || mobile.includes(normalizedSearchVal);
    };
    return columns.map((col) => ({
      ...col,
      leads: (col.leads || []).filter(matchesSearch),
    }));
  }, [columns, normalizedSearchVal]);

  const totalCards = useMemo(
    () => columns.reduce((sum, col) => sum + (col.leads?.length || 0), 0),
    [columns]
  );

  const visibleCards = useMemo(
    () => filteredColumns.reduce((sum, col) => sum + (col.leads?.length || 0), 0),
    [filteredColumns]
  );

  const tableRows = useMemo(
    () =>
      filteredColumns.flatMap((col) =>
        (col.leads || []).map((lead) => ({
          ...lead,
          statusTitle: col.title,
          statusColor: col.color,
        }))
      ),
    [filteredColumns]
  );

  return {
    searchQuery,
    isSearchActive,
    filteredColumns,
    totalCards,
    visibleCards,
    tableRows,
  };
}

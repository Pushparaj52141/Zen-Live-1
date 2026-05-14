import { useCallback, useEffect, useRef, useState } from "react";
import { DASHBOARD_STATUS_ORDER } from "../constants/dashboardStatusOrder";
import { dashboardService } from "../services/dashboardService";
import { buildDashboardQueryParams } from "../utils/buildDashboardQueryParams";

const STATUS_ORDER = DASHBOARD_STATUS_ORDER;

export function useDashboardBoard() {
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [appliedFilters, setAppliedFilters] = useState({});
  const [courses, setCourses] = useState([]);
  const appliedFiltersRef = useRef(appliedFilters);

  useEffect(() => {
    appliedFiltersRef.current = appliedFilters;
  }, [appliedFilters]);

  const loadBoard = useCallback(async (filters = {}) => {
      setLoading(true);
      try {
        const queryString = buildDashboardQueryParams(filters);
        const res = await dashboardService.getLeads(queryString);
        const leads = res.data;
        const allLeads = Array.isArray(leads) ? leads : [];

        let mergedLeads = [...allLeads];
        const hasPriorityFilter = filters.priority && filters.priority !== "all";
        if (!hasPriorityFilter) {
          try {
            const metaRes = await dashboardService.getMetaLeads();
            if (Array.isArray(metaRes.data)) {
              const mappedMetaLeads = metaRes.data
                .filter((ml) => ml.status !== "converted")
                .map((ml) => ({
                  lead_id: `meta_${ml.id}`,
                  name: ml.lead_name,
                  mobile_number: ml.phone,
                  email: ml.email,
                  status: ml.status === "new" ? "enquiry" : ml.status,
                  course_name: ml.campaign_source,
                  created_at: ml.created_date,
                  is_meta: true,
                }));
              mergedLeads = [...mergedLeads, ...mappedMetaLeads];
            }
          } catch {
            console.warn("Dashboard: Failed to fetch Meta Leads for board integration");
          }
        }

        const statusMap = {};
        for (const lead of mergedLeads) {
          const status = (lead.status || "enquiry").toLowerCase().replace(/\s+/g, "");
          if (!statusMap[status]) statusMap[status] = [];
          statusMap[status].push(lead);
        }

        const colArr = STATUS_ORDER.map((col) => ({
          key: col.key,
          title: col.title,
          color: col.color,
          leads: statusMap[col.key] || [],
        }));

        setColumns(colArr);
      } catch {
        setColumns(STATUS_ORDER.map((col) => ({ ...col, leads: [] })));
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    loadBoard();
  }, [loadBoard]);

  useEffect(() => {
    const handleLeadUpdated = () => {
      loadBoard(appliedFiltersRef.current);
    };
    if (typeof window !== "undefined" && window.addEventListener) {
      window.addEventListener("zen:leadUpdated", handleLeadUpdated);
    }
    return () => {
      if (typeof window !== "undefined" && window.removeEventListener) {
        window.removeEventListener("zen:leadUpdated", handleLeadUpdated);
      }
    };
  }, [loadBoard]);

  useEffect(() => {
    function onGlobalFilters(e) {
      try {
        const filters = e?.detail || {};
        setAppliedFilters(filters || {});
        loadBoard(filters || {});
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
  }, [loadBoard]);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await dashboardService.getCourses();
        setCourses(res.data);
      } catch {
        // Silent fail
      }
    };
    fetchCourses();
  }, []);

  return {
    columns,
    setColumns,
    loading,
    appliedFilters,
    setAppliedFilters,
    loadBoard,
    appliedFiltersRef,
    courses,
  };
}

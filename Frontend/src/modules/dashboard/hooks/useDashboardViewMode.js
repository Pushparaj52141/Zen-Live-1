import { useEffect, useState } from "react";

export function useDashboardViewMode() {
  const [viewMode, setViewMode] = useState(() => {
    if (typeof window === "undefined") return "cards";
    const saved = window.localStorage.getItem("dashboard_view_mode");
    return saved === "table" ? "table" : "cards";
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("dashboard_view_mode", viewMode);
  }, [viewMode]);

  return [viewMode, setViewMode];
}

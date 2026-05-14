import { useMemo } from "react";

export function useFilteredUsers(users, searchQuery, filterRole, filterUnit) {
  return useMemo(() => {
    let result = users;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (u) =>
          (u.username || "").toLowerCase().includes(q) ||
          (u.email || "").toLowerCase().includes(q) ||
          (u.mobile || "").toLowerCase().includes(q) ||
          (u.role_name || u.role || "").toLowerCase().includes(q) ||
          (u.unit_name || u.unit || "").toLowerCase().includes(q)
      );
    }

    if (filterRole) {
      result = result.filter((u) => String(u.role_id) === String(filterRole));
    }
    if (filterUnit) {
      result = result.filter((u) => String(u.unit_id) === String(filterUnit));
    }

    return result;
  }, [users, searchQuery, filterRole, filterUnit]);
}

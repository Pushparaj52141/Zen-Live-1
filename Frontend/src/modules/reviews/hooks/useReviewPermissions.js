import { useMemo } from "react";
import { useSelector } from "react-redux";

export function useReviewPermissions() {
  const authUser = useSelector((state) => state.auth.user);

  const roleIds = useMemo(() => {
    if (Array.isArray(authUser?.role_ids)) {
      return authUser.role_ids.map((r) => Number(r));
    }
    if (authUser?.role_id != null) {
      return [Number(authUser.role_id)];
    }
    return [];
  }, [authUser]);

  return {
    roleIds,
    isAdmin: roleIds.includes(1),
  };
}

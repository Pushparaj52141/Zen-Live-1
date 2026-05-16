import { buildDashboardQueryParams } from "@modules/dashboard/utils/buildDashboardQueryParams";

/**
 * Same filter shape as dashboard; always scopes results to archived leads.
 */
export function buildArchivedLeadsQueryParams(filters = {}) {
  const { statuses: _statuses, ...rest } = filters;
  const baseQuery = buildDashboardQueryParams(rest);
  const params = new URLSearchParams(baseQuery);
  params.set("status", "archived");
  return params.toString();
}

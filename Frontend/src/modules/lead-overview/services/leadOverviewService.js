import apiClient from "@shared/api/client";
import { endpoints } from "@shared/api/endpoints";

export const leadOverviewService = {
  async getAllLeadsWithArchived() {
    const [regularRes, archivedRes] = await Promise.all([
      apiClient.get(endpoints.leads.root),
      apiClient.get(endpoints.leads.archived).catch(() => ({ data: [] })),
    ]);

    const leads = Array.isArray(regularRes.data) ? regularRes.data : [];
    const archived = Array.isArray(archivedRes.data)
      ? archivedRes.data.map((lead) => ({ ...lead, status: "archived" }))
      : [];

    return { leads, archived };
  },
};


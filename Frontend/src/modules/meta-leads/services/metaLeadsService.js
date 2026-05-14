import apiClient from "@shared/api/client";
import { endpoints } from "@shared/api/endpoints";

export const metaLeadsService = {
  getFormsSummary() {
    return apiClient.get("/api/meta-leads/forms-summary");
  },

  list(formId = "all") {
    const url =
      formId && formId !== "all"
        ? `/api/meta-leads?form_id=${formId}`
        : endpoints.metaLeads?.apiRoot || "/api/meta-leads";
    return apiClient.get(url);
  },

  detail(id) {
    return apiClient.get(
      endpoints.metaLeads?.detail?.(id) || `/api/meta-leads/${id}`
    );
  },

  update(id, payload) {
    return apiClient.put(`/api/meta-leads/${id}`, payload);
  },

  updateStatus(id, payload) {
    return apiClient.put(
      endpoints.metaLeads?.detail?.(id) || `/api/meta-leads/${id}`,
      payload
    );
  },

  convert(id) {
    return apiClient.post(endpoints.metaLeads.convert(id));
  },

  syncAll(pageId) {
    return apiClient.post("/api/meta-leads/sync-all", { pageId });
  },

  remove(id) {
    return apiClient.delete(
      endpoints.metaLeads?.detail?.(id) || `/api/meta-leads/${id}`
    );
  },
};

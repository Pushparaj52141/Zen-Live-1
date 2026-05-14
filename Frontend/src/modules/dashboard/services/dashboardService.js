import apiClient from "@shared/api/client";
import { endpoints } from "@shared/api/endpoints";

export const dashboardService = {
  getCourses() {
    return apiClient.get(endpoints.courses.root);
  },

  getLeads(queryString = "") {
    const url = queryString
      ? `${endpoints.leads.root}?${queryString}`
      : endpoints.leads.root;
    return apiClient.get(url);
  },

  getMetaLeads() {
    return apiClient.get(endpoints.metaLeads.apiRoot);
  },

  convertMetaLead(metaId) {
    return apiClient.post(endpoints.metaLeads.convert(metaId));
  },
};

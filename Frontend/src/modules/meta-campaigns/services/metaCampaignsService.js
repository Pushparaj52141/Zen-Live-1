import apiClient from "@shared/api/client";
import { endpoints } from "@shared/api/endpoints";

export const metaCampaignsService = {
  list() {
    return apiClient.get(endpoints.metaCampaigns.apiRoot);
  },

  create(payload) {
    return apiClient.post(endpoints.metaCampaigns.apiRoot, payload);
  },

  getById(id) {
    return apiClient.get(endpoints.metaCampaigns.detail(id));
  },

  update(id, payload) {
    return apiClient.put(endpoints.metaCampaigns.detail(id), payload);
  },

  remove(id) {
    return apiClient.delete(endpoints.metaCampaigns.detail(id));
  },
};

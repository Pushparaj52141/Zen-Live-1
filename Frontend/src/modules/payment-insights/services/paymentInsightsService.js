import apiClient from "@shared/api/client";
import { endpoints } from "@shared/api/endpoints";

export const paymentInsightsService = {
  fetchLeads() {
    return apiClient.get(endpoints.leads.root);
  },
  fetchInstallments() {
    return apiClient.get("leads/all-installments");
  },

  fetchPlacementInstallments() {
    return apiClient.get("leads/all-placement-installments");
  },
};

import apiClient from "@shared/api/client";
import { endpoints } from "@shared/api/endpoints";
import archivedLeadService from "@shared/services/leads/archivedLeadService";
import { buildArchivedLeadsQueryParams } from "../utils/buildArchivedLeadsQueryParams";

export const archivedLeadsService = {
  async getArchivedLeads(filters = {}) {
    try {
      const queryString = buildArchivedLeadsQueryParams(filters);
      const url = queryString
        ? `${endpoints.leads.root}?${queryString}`
        : `${endpoints.leads.root}?status=archived`;
      const res = await apiClient.get(url);
      const data = res.data;
      if (Array.isArray(data)) return data;
      if (Array.isArray(data?.leads)) return data.leads;
      return [];
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      };
    }
  },

  unarchiveLead(leadId) {
    return archivedLeadService.unarchiveLead(leadId);
  },
};

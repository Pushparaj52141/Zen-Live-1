import archivedLeadService from "@shared/services/leads/archivedLeadService";

export const archivedLeadsService = {
  getArchivedLeads() {
    return archivedLeadService.getArchivedLeads();
  },

  unarchiveLead(leadId) {
    return archivedLeadService.unarchiveLead(leadId);
  },
};

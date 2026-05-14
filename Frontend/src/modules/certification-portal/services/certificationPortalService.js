import apiClient from "@shared/api/client";
import { endpoints } from "@shared/api/endpoints";

export const certificationPortalService = {
  fetchCertifiedLeads(statusQuery) {
    return apiClient.get(`${endpoints.leads.root}?status=${statusQuery}&limit=1000`);
  },
  fetchCertificateStats() {
    return apiClient.get(`${endpoints.leads.root}/certificate-stats`);
  },
  downloadCertificate(leadId) {
    return apiClient.get(`${endpoints.leads.root}/${leadId}/download-certificate`, {
      responseType: "blob",
    });
  },
  generateCertificate(leadId) {
    return apiClient.post(`${endpoints.leads.root}/${leadId}/generate-certificate`);
  },
};

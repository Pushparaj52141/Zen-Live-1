import apiClient from "@shared/api/client";
import { endpoints } from "@shared/api/endpoints";

export const leadBulkUploadService = {
  getCourses() {
    return apiClient.get(endpoints.courses.root);
  },

  uploadCsv(formData) {
    return apiClient.post(endpoints.leads.bulkUpload, formData);
  },

  exportLeadsCsv() {
    return apiClient.get(endpoints.exportLeads, { responseType: "blob" });
  },

  downloadSampleCsv() {
    return apiClient.get(endpoints.leads.sampleCsv, { responseType: "blob" });
  },
};


import apiClient from "@shared/api/client";
import { endpoints } from "@shared/api/endpoints";
import courseService from "@shared/services/courses/courseService";
import lookupService from "@shared/services/lookups/lookupService";
import leadService from "@shared/services/leads/leadService";

export const addLeadModalService = {
  fetchDropdownData() {
    return Promise.all([
      courseService.getCourseTypes(),
      courseService.getCourses(),
      lookupService.getTrainers(),
      lookupService.getBatches(),
      lookupService.getAssignees(),
      lookupService.getUnits(),
      lookupService.getCardTypes(),
      lookupService.getSources(),
      lookupService.getRoles(),
    ]);
  },

  async getSubCoursesByCourseId(courseId) {
    const response = await apiClient.get(endpoints.courses.subCourses, {
      params: { course_id: courseId },
    });
    return Array.isArray(response.data) ? response.data : [];
  },

  async getMetaCampaigns() {
    const response = await apiClient.get(endpoints.metaCampaigns.apiRoot);
    return Array.isArray(response.data) ? response.data : [];
  },

  createLead(payload) {
    return leadService.createLead(payload);
  },

  async checkDuplicateLead({ name, mobile_number, course_id }) {
    const response = await apiClient.get(`${endpoints.leads.root}/check-duplicate`, {
      params: { name, mobile_number, course_id },
    });
    return response.data;
  },
};

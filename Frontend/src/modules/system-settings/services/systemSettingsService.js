import apiClient, { API_BASE_URL } from "@shared/api/client";

export const systemSettingsService = {
  fetchSettings() {
    return apiClient.get(`${API_BASE_URL}/api/settings`);
  },
  fetchHolidays() {
    return apiClient.get(`${API_BASE_URL}/api/holidays`);
  },
  fetchLeaveTypes() {
    return apiClient.get(`${API_BASE_URL}/api/leave/config/types`);
  },
  saveSettings(payload) {
    return apiClient.put(`${API_BASE_URL}/api/settings`, payload);
  },
  addHoliday(payload) {
    return apiClient.post(`${API_BASE_URL}/api/holidays`, payload);
  },
  updateHoliday(id, payload) {
    return apiClient.put(`${API_BASE_URL}/api/holidays/${id}`, payload);
  },
  deleteHoliday(id) {
    return apiClient.delete(`${API_BASE_URL}/api/holidays/${id}`);
  },
  updateLeaveType(id, payload) {
    return apiClient.put(`${API_BASE_URL}/api/leave/config/types/${id}`, payload);
  },
};

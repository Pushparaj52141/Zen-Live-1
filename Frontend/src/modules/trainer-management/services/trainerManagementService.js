import apiClient from "@shared/api/client";

export const trainerManagementService = {
  fetchTrainers(viewStatus) {
    return apiClient.get(`/api/trainers?status=${viewStatus}`);
  },
  fetchCourses() {
    return apiClient.get("/courses");
  },
  createTrainer(payload) {
    return apiClient.post("/api/trainers", payload);
  },
  updateTrainer(id, payload) {
    return apiClient.put(`/api/trainers/${encodeURIComponent(id)}`, payload);
  },
  deleteTrainer(id) {
    return apiClient.delete(`/api/trainers/${encodeURIComponent(id)}`);
  },
  toggleStatus(id, isActive) {
    return apiClient.patch(`/api/trainers/${encodeURIComponent(id)}/toggle-status`, {
      is_active: isActive,
    });
  },
};

import apiClient from "@shared/api/client";

export const trainerEnrollmentsService = {
  fetchAll() {
    return apiClient.get("/api/enrollment/trainers");
  },
  accept(id) {
    return apiClient.post(`/api/enrollment/trainers/${id}/accept`);
  },
  approve(id) {
    return apiClient.post(`/api/enrollment/trainers/${id}/approve`);
  },
  reject(id, rejectionReason) {
    return apiClient.post(`/api/enrollment/trainers/${id}/reject`, {
      rejection_reason: rejectionReason,
    });
  },
};

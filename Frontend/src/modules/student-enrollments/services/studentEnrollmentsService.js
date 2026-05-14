import apiClient from "@shared/api/client";

export const studentEnrollmentsService = {
  fetchAll() {
    return apiClient.get("/api/enrollment/students");
  },
  accept(id) {
    return apiClient.post(`/api/enrollment/students/${id}/accept`);
  },
  approve(id) {
    return apiClient.post(`/api/enrollment/students/${id}/approve`);
  },
  reject(id, rejectionReason) {
    return apiClient.post(`/api/enrollment/students/${id}/reject`, {
      rejection_reason: rejectionReason,
    });
  },
};

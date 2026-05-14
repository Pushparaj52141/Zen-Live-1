import apiClient from "@shared/api/client";

export const reviewsService = {
  async fetchAll() {
    const res = await apiClient.get("/api/reviews/all");
    const data = res.data;
    return Array.isArray(data.reviews)
      ? data.reviews
      : Array.isArray(data)
        ? data
        : [];
  },

  async fetchSyncStatus() {
    const res = await apiClient.get("/api/reviews/sync-status");
    return res.data?.lastSync || null;
  },

  async fetchStats() {
    const res = await apiClient.get("/api/reviews/stats");
    return res.data?.stats || null;
  },

  syncGoogle() {
    return apiClient.post("/api/reviews/sync-google");
  },

  create(payload) {
    return apiClient.post("/api/reviews", payload);
  },

  fetchManualById(id) {
    return apiClient.get(`/api/reviews/${id}?source=manual`);
  },

  update(id, payload) {
    return apiClient.put(`/api/reviews/${id}`, payload);
  },

  remove(id) {
    return apiClient.delete(`/api/reviews/${id}`);
  },
};

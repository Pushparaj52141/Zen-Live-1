import apiClient from "@shared/api/client";
import { endpoints } from "@shared/api/endpoints";

export const batchManagementService = {
  async fetchTrainers() {
    const res = await apiClient.get(endpoints.trainers.root);
    const data = res.data;
    if (Array.isArray(data?.trainers)) return data.trainers;
    return Array.isArray(data) ? data : [];
  },

  async fetchBatchTrainer(batchId) {
    const res = await apiClient.get(endpoints.leads.batchTrainers(batchId));
    const trainer = res.data?.[0];
    if (!trainer) return { trainer_id: "", trainer_name: "Not Assigned" };
    return {
      trainer_id: String(trainer.trainer_id),
      trainer_name: trainer.trainer_name,
    };
  },

  async clearBatchTrainer(batchId, trainerId) {
    return apiClient.delete(`${endpoints.leads.batchTrainers(batchId)}/${trainerId}`);
  },

  async assignBatchTrainer(batchId, trainerId) {
    return apiClient.put(endpoints.leads.batchTrainers(batchId), {
      trainers: [{ trainer_id: Number(trainerId), share_percentage: 100 }],
    });
  },
};

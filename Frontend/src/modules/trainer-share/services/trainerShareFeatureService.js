import trainerShareService from "@shared/services/trainers/trainerShareService";

export const trainerShareFeatureService = {
  fetchPayouts: () => trainerShareService.fetchPayouts(),
  fetchTrainers: () => trainerShareService.fetchTrainers(),
  fetchBatches: () => trainerShareService.fetchBatches(),
  updateStatus: (payoutId, status) => trainerShareService.updateStatus(payoutId, status),
  sendSummary: (paymentPeriod, customDateFrom, customDateTo) =>
    trainerShareService.sendSummary(paymentPeriod, customDateFrom, customDateTo),
};

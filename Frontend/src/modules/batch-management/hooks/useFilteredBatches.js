import { useMemo } from "react";

export function useFilteredBatches({
  batches,
  searchQuery,
  filterTrainer,
  batchTrainerAssignments,
  trainers,
}) {
  const trainerMap = useMemo(() => {
    const map = new Map();
    trainers.forEach((t) => map.set(String(t.trainer_id), t.trainer_name));
    return map;
  }, [trainers]);

  const filteredBatches = useMemo(() => {
    let filtered = [...batches];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((batch) => {
        const batchName = (batch.batch_name || "").toLowerCase();
        const batchId = String(batch.batch_id || "").toLowerCase();
        const trainerName = (
          batchTrainerAssignments[batch.batch_id]?.trainer_name ||
          batch.trainer_name ||
          trainerMap.get(String(batch.trainer_id)) ||
          ""
        ).toLowerCase();
        const days = Array.isArray(batch.days_of_week)
          ? batch.days_of_week.join(", ").toLowerCase()
          : "";

        return (
          batchName.includes(query) ||
          batchId.includes(query) ||
          trainerName.includes(query) ||
          days.includes(query)
        );
      });
    }

    if (filterTrainer) {
      filtered = filtered.filter((batch) => {
        const assignedTrainerId = batchTrainerAssignments[batch.batch_id]?.trainer_id || "";
        const batchTrainerId = String(batch.trainer_id || "");
        return assignedTrainerId === filterTrainer || batchTrainerId === filterTrainer;
      });
    }

    return filtered;
  }, [batches, searchQuery, filterTrainer, batchTrainerAssignments, trainerMap]);

  return { filteredBatches, trainerMap };
}

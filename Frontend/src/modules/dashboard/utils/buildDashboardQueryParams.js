/**
 * Maps dashboard filter UI shape to backend query string.
 */
export function buildDashboardQueryParams(filters = {}) {
  const params = new URLSearchParams();

  const joinValues = (arr) =>
    Array.isArray(arr) && arr.length > 0 ? arr.join(",") : null;

  if (filters.priority && filters.priority !== "all") {
    params.append("priority", filters.priority);
  }

  const courseType = joinValues(filters.courseTypes);
  if (courseType) {
    params.append("courseType", courseType);
  }

  const course = joinValues(filters.courses);
  if (course) {
    params.append("course", course);
  }

  if (filters.statuses && filters.statuses.length > 0) {
    params.append("status", filters.statuses.map((s) => s.toLowerCase()).join(","));
  }

  const trainer = joinValues(filters.trainers);
  if (trainer) {
    params.append("trainer", trainer);
  }

  const batch = joinValues(filters.batches);
  if (batch) {
    params.append("batch", batch);
  }

  const feeStatus = joinValues(filters.paidStatuses);
  if (feeStatus) {
    params.append("feeStatus", feeStatus.toLowerCase());
  }

  const source = joinValues(filters.sources);
  if (source) {
    params.append("source", source);
  }

  const assignee = joinValues(filters.assignees);
  if (assignee) {
    params.append("user_id", assignee);
  }

  const unit = joinValues(filters.businessUnits);
  if (unit) {
    params.append("unit", unit);
  }

  const cardType = joinValues(filters.cardTypes);
  if (cardType) {
    params.append("cardType", cardType);
  }

  const timePeriod =
    Array.isArray(filters.timePeriods) && filters.timePeriods.length > 0
      ? filters.timePeriods.find((tp) => tp !== "All Time") || filters.timePeriods[0]
      : null;
  if (timePeriod && timePeriod !== "All Time") {
    params.append("timePeriod", timePeriod);
  }
  return params.toString();
}

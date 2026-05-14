import apiClient from "@shared/api/client";

export const attendanceTrackingService = {
  getHolidays() {
    return apiClient.get("/api/holidays");
  },

  getTodayAttendance() {
    return apiClient.get("/api/attendance/today");
  },

  getAttendanceHistory(params) {
    return apiClient.get("/api/attendance/history", { params });
  },

  getAttendanceStats(params) {
    return apiClient.get("/api/attendance/stats", { params });
  },

  checkIn(payload) {
    return apiClient.post("/api/attendance/check-in", payload);
  },

  checkOut(payload) {
    return apiClient.post("/api/attendance/check-out", payload);
  },
};

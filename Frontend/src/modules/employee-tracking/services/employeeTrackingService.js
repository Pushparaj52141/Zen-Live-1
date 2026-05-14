import apiClient from "@shared/api/client";
import attendanceService from "@shared/services/attendanceService";

export const employeeTrackingService = {
  fetchUsers() {
    return apiClient.get("api/users");
  },
  fetchAttendance(dateStr) {
    return attendanceService.getAllUsersAttendance(dateStr);
  },
};


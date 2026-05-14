import apiClient from '../api/client';

export const attendanceService = {
    // Get today's attendance
    getTodayAttendance: async () => {
        const response = await apiClient.get('/api/attendance/today');
        return response.data;
    },

    // Check in
    checkIn: async (photo) => {
        const response = await apiClient.post(
            '/api/attendance/check-in',
            { photo }
        );
        return response.data;
    },

    // Check out
    checkOut: async (photo) => {
        const response = await apiClient.post(
            '/api/attendance/check-out',
            { photo }
        );
        return response.data;
    },

    // Start break
    startBreak: async () => {
        const response = await apiClient.post(
            '/api/attendance/break/start',
            {}
        );
        return response.data;
    },

    // End break
    endBreak: async (breakId) => {
        const response = await apiClient.post(
            '/api/attendance/break/end',
            { breakId }
        );
        return response.data;
    },

    // Get attendance history
    getAttendanceHistory: async (startDate, endDate, limit = 30) => {
        const params = { limit };
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;

        const response = await apiClient.get(
            '/api/attendance/history',
            { params }
        );
        return response.data;
    },

    // Get attendance statistics
    getAttendanceStats: async (startDate, endDate) => {
        const response = await apiClient.get(
            '/api/attendance/stats',
            { params: { startDate, endDate } }
        );
        return response.data;
    },

    // Admin: Get all users' attendance
    getAllUsersAttendance: async (date) => {
        const response = await apiClient.get('api/attendance/all', {
            params: date ? { date } : undefined
        });
        return response.data;
    }
};

export default attendanceService;

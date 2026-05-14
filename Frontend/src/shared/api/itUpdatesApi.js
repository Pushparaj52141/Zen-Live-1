import apiClient from './client';

const BASE_PATH = '/api/it-updates';

export const itUpdatesApi = {
    // ============ PROJECTS ============
    getProjects: (status) => {
        const params = status ? { status } : {};
        return apiClient.get(`${BASE_PATH}/projects`, { params });
    },

    createProject: (projectData) => {
        return apiClient.post(`${BASE_PATH}/projects`, projectData);
    },

    updateProject: (projectId, projectData) => {
        return apiClient.put(`${BASE_PATH}/projects/${projectId}`, projectData);
    },

    deleteProject: (projectId) => {
        return apiClient.delete(`${BASE_PATH}/projects/${projectId}`);
    },

    // ============ TASKS ============
    getTasks: (filters = {}) => {
        return apiClient.get(`${BASE_PATH}/tasks`, { params: filters });
    },

    createTask: (taskData) => {
        return apiClient.post(`${BASE_PATH}/tasks`, taskData);
    },

    updateTask: (taskId, taskData) => {
        return apiClient.put(`${BASE_PATH}/tasks/${taskId}`, taskData);
    },

    deleteTask: (taskId) => {
        return apiClient.delete(`${BASE_PATH}/tasks/${taskId}`);
    },

    // ============ TASK COMMENTS ============
    getTaskComments: (taskId) => {
        return apiClient.get(`${BASE_PATH}/tasks/${taskId}/comments`);
    },

    addTaskComment: (taskId, commentData) => {
        return apiClient.post(`${BASE_PATH}/tasks/${taskId}/comments`, commentData);
    },

    // ============ DASHBOARD ============
    getDashboardStats: () => {
        return apiClient.get(`${BASE_PATH}/dashboard/stats`);
    },

    getTeamOverview: () => {
        return apiClient.get(`${BASE_PATH}/team-overview`);
    },
};

export default itUpdatesApi;

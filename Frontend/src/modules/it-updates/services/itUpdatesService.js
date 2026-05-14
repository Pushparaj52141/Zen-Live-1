import itUpdatesApi from "@shared/api/itUpdatesApi";

export const itUpdatesService = {
  getDashboardStats: () => itUpdatesApi.getDashboardStats(),
  getProjects: () => itUpdatesApi.getProjects(),
  getTasks: (filters = {}) => itUpdatesApi.getTasks(filters),
  getTeamOverview: () => itUpdatesApi.getTeamOverview(),
  updateTask: (taskId, data) => itUpdatesApi.updateTask(taskId, data),
  createTask: (data) => itUpdatesApi.createTask(data),
  updateProject: (projectId, data) => itUpdatesApi.updateProject(projectId, data),
  createProject: (data) => itUpdatesApi.createProject(data),
};


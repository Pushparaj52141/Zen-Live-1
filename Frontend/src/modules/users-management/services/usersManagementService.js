import apiClient from "@shared/api/client";

export const usersManagementService = {
  getUsers(params) {
    return apiClient.get("/api/users", { params });
  },

  getRoles() {
    return apiClient.get("/api/user_roles");
  },

  getUnits() {
    return apiClient.get("/leads/units");
  },

  updateUserRoles(userId, roleIds) {
    return apiClient.patch(`/api/users/${encodeURIComponent(userId)}/roles`, {
      role_ids: roleIds,
    });
  },

  updateUser(userId, body) {
    return apiClient.put(`/api/users/${encodeURIComponent(userId)}`, body);
  },

  deleteUser(userId) {
    return apiClient.delete(`/api/users/${encodeURIComponent(userId)}`);
  },

  createUser(formData) {
    return apiClient.post("/api/users", formData);
  },
};

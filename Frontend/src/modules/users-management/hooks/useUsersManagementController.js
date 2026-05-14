import { useEffect, useRef, useState } from "react";
import Swal from "sweetalert2";
import { INITIAL_EDIT_DATA, INITIAL_NEW_USER } from "../constants/usersManagementDefaults";
import { useFilteredUsers } from "./useFilteredUsers";
import { usersManagementService } from "../services/usersManagementService";
import {
  buildUpdateUserPayload,
  ensureUserImageNormalized,
  hasValidProfileImage,
  normalizeUsers,
} from "../utils/usersManagementUtils";

export function useUsersManagementController() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [units, setUnits] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [loadingUnits, setLoadingUnits] = useState(true);

  const [editingId, setEditingId] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState(INITIAL_EDIT_DATA);
  const [previewImage, setPreviewImage] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);
  const lastUpdatedUserIdRef = useRef(null);
  const [showRolesModal, setShowRolesModal] = useState(false);
  const [roleEditingUser, setRoleEditingUser] = useState(null);
  const [selectedRoleIds, setSelectedRoleIds] = useState([]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newUser, setNewUser] = useState(INITIAL_NEW_USER);
  const [showAddPassword, setShowAddPassword] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [filterUnit, setFilterUnit] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const filteredUsers = useFilteredUsers(
    users,
    searchQuery,
    filterRole,
    filterUnit
  );

  useEffect(() => {
    fetchUsers();
    fetchRoles();
    fetchUnits();
  }, []);

  async function fetchUsers() {
    setLoadingUsers(true);
    try {
      const timestamp = new Date().getTime();
      const res = await usersManagementService.getUsers({ t: timestamp });
      const data = res.data;
      const usersArray = Array.isArray(data) ? data : [];
      let normalizedUsers = normalizeUsers(usersArray);

      if (lastUpdatedUserIdRef.current) {
        normalizedUsers = ensureUserImageNormalized(
          normalizedUsers,
          lastUpdatedUserIdRef.current
        );
        lastUpdatedUserIdRef.current = null;
      }
      setUsers([...normalizedUsers]);
    } catch {
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  }

  async function fetchRoles() {
    setLoadingRoles(true);
    try {
      const res = await usersManagementService.getRoles();
      setRoles(Array.isArray(res.data) ? res.data : []);
    } catch {
      setRoles([]);
    } finally {
      setLoadingRoles(false);
    }
  }

  async function fetchUnits() {
    setLoadingUnits(true);
    try {
      const res = await usersManagementService.getUnits();
      setUnits(Array.isArray(res.data) ? res.data : []);
    } catch {
      setUnits([]);
    } finally {
      setLoadingUnits(false);
    }
  }

  function startEdit(user) {
    setEditingId(user.id);
    setEditData({
      username: user.username || "",
      email: user.email || "",
      mobile: user.mobile || "",
      password: "",
      role_id: user.role_id || "",
      unit_id: user.unit_id || "",
      profile_image: null,
    });
    setPreviewImage(null);
    setRemoveImage(false);
    setShowEditPassword(false);
    setShowEditModal(true);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditData(INITIAL_EDIT_DATA);
    setPreviewImage(null);
    setRemoveImage(false);
    setShowEditPassword(false);
    setShowEditModal(false);
  }

  function handleEditChange(field, value) {
    setEditData((prev) => ({ ...prev, [field]: value }));
  }

  function openRolesModal(user) {
    setRoleEditingUser(user);
    const currentRoles =
      Array.isArray(user.role_ids) && user.role_ids.length
        ? user.role_ids
        : user.role_id
          ? [user.role_id]
          : [];
    setSelectedRoleIds(currentRoles.map((id) => Number(id)));
    setShowRolesModal(true);
  }

  function closeRolesModal() {
    setShowRolesModal(false);
    setRoleEditingUser(null);
    setSelectedRoleIds([]);
  }

  function toggleRoleSelection(roleId) {
    const numericRoleId = Number(roleId);
    setSelectedRoleIds((prev) =>
      prev.includes(numericRoleId)
        ? prev.filter((id) => id !== numericRoleId)
        : [...prev, numericRoleId]
    );
  }

  async function saveRoles() {
    if (!roleEditingUser) return;
    if (!selectedRoleIds.length) {
      Swal.fire({ icon: "warning", title: "Select at least one role" });
      return;
    }
    try {
      await usersManagementService.updateUserRoles(
        roleEditingUser.id,
        selectedRoleIds
      );
      Swal.fire({
        icon: "success",
        title: "Roles updated!",
        timer: 1200,
        showConfirmButton: false,
      });
      closeRolesModal();
      await fetchUsers();
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Failed to update roles",
        text: err.message,
      });
    }
  }

  async function saveEdit(id) {
    try {
      const body = buildUpdateUserPayload(editData, removeImage);
      const res = await usersManagementService.updateUser(id, body);
      const data = res.data;
      const updatedUserId = id;
      lastUpdatedUserIdRef.current = id;

      setUsers((prevUsers) =>
        prevUsers.map((u) => {
          if (u.id !== updatedUserId) return u;
          if (removeImage) return { ...u, ...data, profile_image: null };
          if (editData.profile_image) {
            return { ...u, ...data, profile_image: data.profile_image || previewImage };
          }
          const hasValidImageInResponse = hasValidProfileImage(data.profile_image);
          return {
            ...u,
            ...data,
            profile_image: hasValidImageInResponse ? data.profile_image : null,
          };
        })
      );

      cancelEdit();
      Swal.fire({
        icon: "success",
        title: "User updated!",
        timer: 1200,
        showConfirmButton: false,
      });
      await new Promise((resolve) => setTimeout(resolve, 300));
      await fetchUsers();
    } catch (err) {
      Swal.fire({ icon: "error", title: "Update failed", text: err.message });
    }
  }

  async function deleteUser(id) {
    const result = await Swal.fire({
      title: "Delete this user?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#d33",
    });
    if (!result.isConfirmed) return;
    try {
      await usersManagementService.deleteUser(id);
      Swal.fire({
        icon: "success",
        title: "User deleted!",
        timer: 1200,
        showConfirmButton: false,
      });
      await fetchUsers();
    } catch (err) {
      Swal.fire({ icon: "error", title: "Delete failed", text: err.message });
    }
  }

  function openAddModal() {
    setShowAddModal(true);
    setShowAddPassword(false);
    setNewUser(INITIAL_NEW_USER);
  }

  function closeAddModal() {
    setShowAddModal(false);
    setShowAddPassword(false);
  }

  async function saveNewUser() {
    try {
      const fd = new FormData();
      fd.append("username", newUser.username.trim());
      fd.append("email", newUser.email.trim());
      if (newUser.password) fd.append("password", newUser.password);
      if (newUser.mobile) fd.append("mobile", newUser.mobile.trim());
      if (newUser.role_id) fd.append("role_id", newUser.role_id);
      if (newUser.unit_id) fd.append("unit_id", newUser.unit_id);
      if (newUser.profile_image) fd.append("profile_image", newUser.profile_image);
      await usersManagementService.createUser(fd);
      Swal.fire({
        icon: "success",
        title: "User added!",
        timer: 1200,
        showConfirmButton: false,
      });
      await fetchUsers();
      closeAddModal();
    } catch (err) {
      Swal.fire({ icon: "error", title: "Add failed", text: err.message });
    }
  }

  const roleName = (user) => {
    if (Array.isArray(user.role_names) && user.role_names.length) {
      return user.role_names.join(", ");
    }
    return user.role_name || user.role || "";
  };

  const unitName = (user) => user.unit_name || user.unit || "";

  return {
    users,
    roles,
    units,
    loadingUsers,
    loadingRoles,
    loadingUnits,
    editingId,
    showEditModal,
    editData,
    previewImage,
    removeImage,
    showEditPassword,
    showRolesModal,
    roleEditingUser,
    selectedRoleIds,
    showAddModal,
    newUser,
    showAddPassword,
    searchQuery,
    filterRole,
    filterUnit,
    showFilters,
    filteredUsers,
    setShowEditPassword,
    setPreviewImage,
    setRemoveImage,
    setShowRolesModal,
    setRoleEditingUser,
    setSelectedRoleIds,
    setShowAddModal,
    setNewUser,
    setShowAddPassword,
    setSearchQuery,
    setFilterRole,
    setFilterUnit,
    setShowFilters,
    handleEditChange,
    openRolesModal,
    closeRolesModal,
    toggleRoleSelection,
    saveRoles,
    startEdit,
    cancelEdit,
    saveEdit,
    deleteUser,
    openAddModal,
    closeAddModal,
    saveNewUser,
    roleName,
    unitName,
  };
}

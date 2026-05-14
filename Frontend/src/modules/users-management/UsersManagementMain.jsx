import React from "react";
import { useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { useUsersManagementController } from "./hooks/useUsersManagementController";
import { getPageColors } from "@shared/utils/pageColors";
import { FiUserPlus, FiEdit, FiTrash2, FiSearch, FiFilter, FiX, FiEye, FiEyeOff, FiCheck } from "react-icons/fi";

export default function UsersManagementMain() {
  const authUser = useSelector((state) => state.auth.user);

  const location = useLocation();
  const colors = getPageColors(location.pathname);
  const {
    users,
    roles,
    units,
    loadingUsers,
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
  } = useUsersManagementController();

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <button
          onClick={openAddModal}
          className="group flex items-center gap-3 rounded-xl border bg-white shadow-sm hover:shadow-md px-6 py-3 transition-all duration-300 hover:-translate-y-0.5 min-w-[220px]"
          style={{ borderColor: `${colors.primary}40` }}
        >
          <div className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors group-hover:scale-110"
                style={{ backgroundColor: `${colors.primary}15` }}>
            <FiUserPlus className="text-lg" style={{ color: colors.primary }} />
          </div>
          <span className="text-sm font-bold tracking-wide" style={{ color: colors.primary }}>Add New User</span>
        </button>

        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:flex-initial md:w-64">
             <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
             <input
               type="text"
               placeholder="Search users..."
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-0 text-sm"
               style={{ 
                 borderColor: `${colors.primary}50`,
                 focusRingColor: colors.primary 
               }}
               onFocus={(e) => {
                 e.target.style.borderColor = colors.primary;
                 e.target.style.boxShadow = `0 0 0 2px ${colors.primary}40`;
               }}
               onBlur={(e) => {
                 e.target.style.borderColor = `${colors.primary}50`;
                 e.target.style.boxShadow = '';
               }}
             />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
              showFilters || filterRole || filterUnit
                ? 'text-white'
                : 'text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
            style={showFilters || filterRole || filterUnit ? { 
              backgroundColor: colors.primary,
              borderColor: colors.primary 
            } : {}}
          >
            <FiFilter size={18} />
            Filters
            {(filterRole || filterUnit) && (
              <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-white/20">
                {(filterRole ? 1 : 0) + (filterUnit ? 1 : 0)}
              </span>
            )}
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="mb-4 p-4 rounded-lg border bg-white shadow-sm" style={{ borderColor: `${colors.primary}30` }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold" style={{ color: colors.primaryDark }}>
              Filter Options
            </h3>
            <button
              onClick={() => {
                setFilterRole("");
                setFilterUnit("");
                setShowFilters(false);
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              <FiX size={18} />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Filter by Role
              </label>
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none"
                style={{ borderColor: `${colors.primary}50` }}
                onFocus={(e) => {
                  e.target.style.borderColor = colors.primary;
                  e.target.style.boxShadow = `0 0 0 2px ${colors.primary}40`;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = `${colors.primary}50`;
                  e.target.style.boxShadow = '';
                }}
              >
                <option value="">All Roles</option>
                {roles.map((r) => (
                  <option key={r.role_id} value={r.role_id}>
                    {r.role_name}
                  </option>
                ))}
              </select>
            </div>

             <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Filter by Unit
              </label>
              <select
                value={filterUnit}
                onChange={(e) => setFilterUnit(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none"
                style={{ borderColor: `${colors.primary}50` }}
                onFocus={(e) => {
                  e.target.style.borderColor = colors.primary;
                  e.target.style.boxShadow = `0 0 0 2px ${colors.primary}40`;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = `${colors.primary}50`;
                  e.target.style.boxShadow = '';
                }}
              >
                <option value="">All Units</option>
                {units.map((u) => (
                  <option key={u.unit_id} value={u.unit_id}>
                    {u.unit_name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {(searchQuery || filterRole || filterUnit) && (
        <div className="mb-4 text-sm text-gray-600">
          Showing {filteredUsers.length} of {users.length} users
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="w-full max-w-3xl mx-4 rounded-2xl shadow-2xl ring-1 ring-black/5 bg-white overflow-hidden">
            <div className="px-6 py-4 text-white flex items-center justify-between"
                 style={{ background: `linear-gradient(to right, ${colors.primary}, ${colors.primaryDark})` }}>
              <h5 className="text-lg font-semibold">Create New User</h5>
              <button
                onClick={closeAddModal}
                className="text-white/90 hover:text-white text-2xl leading-none"
                aria-label="Close"
              >
                <FiX />
              </button>
            </div>

            <form onSubmit={e => { e.preventDefault(); saveNewUser(); }} className="px-6 py-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium mb-1">Username</label>
                  <Input
                    placeholder="Username"
                    value={newUser.username}
                    onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                    required
                    focusColor={colors.primary}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <Input
                    type="email"
                    placeholder="Email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    required
                    focusColor={colors.primary}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Password</label>
                  <div className="relative">
                    <Input
                      type={showAddPassword ? "text" : "password"}
                      placeholder="Password"
                      value={newUser.password}
                      onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                      required
                      focusColor={colors.primary}
                      className="w-full pr-10"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      onClick={() => setShowAddPassword(!showAddPassword)}
                    >
                      {showAddPassword ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Mobile</label>
                  <Input
                    placeholder="Enter Mobile Number"
                    value={newUser.mobile}
                    onChange={(e) => setNewUser({ ...newUser, mobile: e.target.value.replace(/\s/g, "") })}
                    focusColor={colors.primary}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Role</label>
                  <Select
                    value={newUser.role_id || ""}
                    onChange={(e) => setNewUser({ ...newUser, role_id: e.target.value })}
                    required
                    focusColor={colors.primary}
                  >
                    <option value="">Select Role</option>
                    {roles.map((r) => (
                      <option key={r.role_id} value={r.role_id}>
                        {r.role_name}
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Unit</label>
                  <Select
                    value={newUser.unit_id || ""}
                    onChange={(e) => setNewUser({ ...newUser, unit_id: e.target.value })}
                    required
                    focusColor={colors.primary}
                  >
                    <option value="">Select Unit</option>
                    {units.map((u) => (
                      <option key={u.unit_id} value={u.unit_id}>
                        {u.unit_name}
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Profile Image (optional)</label>
                  <div className="flex items-center gap-4">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-500 text-white text-lg font-semibold">
                      {(newUser.username && newUser.username[0]?.toUpperCase()) || "U"}
                    </div>
                    <input
                      type="file"
                      className="text-sm"
                      onChange={(e) => setNewUser({ ...newUser, profile_image: e.target.files?.[0] || null })}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-6 border-t mt-6">
                <button
                  type="button"
                  onClick={closeAddModal}
                  className="px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-lg text-white"
                  style={{ backgroundColor: colors.primary }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = colors.primaryDark;
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = colors.primary;
                  }}
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="w-full max-w-3xl mx-4 rounded-2xl shadow-2xl ring-1 ring-black/5 bg-white overflow-hidden">
            <div
              className="px-6 py-4 text-white flex items-center justify-between"
              style={{ background: `linear-gradient(to right, ${colors.primary}, ${colors.primaryDark})` }}
            >
              <h5 className="text-lg font-semibold">Edit User</h5>
              <button
                onClick={cancelEdit}
                className="text-white/90 hover:text-white text-2xl leading-none"
              >
                &times;
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (editingId) {
                  saveEdit(editingId);
                }
              }}
              className="px-6 py-5"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium mb-1">Username</label>
                  <Input
                    value={editData.username}
                    onChange={(e) => handleEditChange("username", e.target.value)}
                    focusColor={colors.primary}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <Input
                    type="email"
                    value={editData.email}
                    onChange={(e) => handleEditChange("email", e.target.value)}
                    focusColor={colors.primary}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Mobile</label>
                  <Input
                    value={editData.mobile}
                    onChange={(e) => handleEditChange("mobile", e.target.value.replace(/\s/g, ""))}
                    placeholder="Enter Mobile Number"
                    focusColor={colors.primary}
                  />
                </div>
                {(() => {
                  const currentRoleIds = Array.isArray(authUser?.role_ids)
                    ? authUser.role_ids.map((r) => Number(r))
                    : (authUser?.role_id ? [Number(authUser.role_id)] : []);
                  return currentRoleIds.includes(1);
                })() && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Password (Leave blank to keep current)</label>
                    <div className="relative">
                      <Input
                        type={showEditPassword ? "text" : "password"}
                        placeholder="New Password"
                        value={editData.password || ""}
                        onChange={(e) => handleEditChange("password", e.target.value)}
                        focusColor={colors.primary}
                        className="w-full pr-10"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        onClick={() => setShowEditPassword(!showEditPassword)}
                      >
                        {showEditPassword ? <FiEyeOff /> : <FiEye />}
                      </button>
                    </div>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium mb-1">Role</label>
                  <Select
                    value={editData.role_id}
                    onChange={(e) => handleEditChange("role_id", e.target.value)}
                    focusColor={colors.primary}
                  >
                    <option value="">Select Role</option>
                    {roles.map((r) => (
                      <option key={r.role_id} value={r.role_id}>
                        {r.role_name}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Unit</label>
                  <Select
                    value={editData.unit_id}
                    onChange={(e) => handleEditChange("unit_id", e.target.value)}
                    focusColor={colors.primary}
                  >
                    <option value="">Select Unit</option>
                    {units.map((u) => (
                      <option key={u.unit_id} value={u.unit_id}>
                        {u.unit_name}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Profile Photo</label>
                  <div className="flex items-center gap-4">
                    {previewImage ? (
                      <div className="relative">
                        <img
                          src={previewImage}
                          alt="Preview"
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setPreviewImage(null);
                            handleEditChange("profile_image", null);
                          }}
                          className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                          title="Remove preview"
                        >
                          <FiX />
                        </button>
                      </div>
                    ) : removeImage || !(editingId && users.find((u) => u.id === editingId)?.profile_image) ? (
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-500 text-white text-lg font-semibold">
                        {(editData.username && editData.username[0]?.toUpperCase()) || "U"}
                      </div>
                    ) : (
                      <div className="relative">
                        <img
                          src={`data:image/png;base64,${
                            users.find((u) => u.id === editingId)?.profile_image
                          }`}
                          alt={editData.username || "user"}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setRemoveImage(true);
                            setPreviewImage(null);
                            handleEditChange("profile_image", null);
                          }}
                          className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                          title="Delete image"
                        >
                          <FiX />
                        </button>
                      </div>
                    )}
                    <div className="flex flex-col gap-2">
                      <input
                        type="file"
                        accept="image/*"
                        className="text-sm"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setPreviewImage(reader.result);
                            };
                            reader.readAsDataURL(file);
                            handleEditChange("profile_image", file);
                            setRemoveImage(false);
                          } else {
                            setPreviewImage(null);
                            handleEditChange("profile_image", null);
                          }
                        }}
                      />
                      {removeImage && (
                        <button
                          type="button"
                          onClick={() => {
                            setRemoveImage(false);
                          }}
                          className="text-xs text-blue-600 hover:text-blue-700 underline"
                        >
                          Cancel remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-6 mt-6 border-t">
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="px-4 py-2.5 rounded-lg border text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-lg text-white"
                  style={{ backgroundColor: colors.primary }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = colors.primaryDark;
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = colors.primary;
                  }}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showRolesModal && roleEditingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="w-full max-w-md mx-4 rounded-2xl shadow-2xl ring-1 ring-black/5 bg-white overflow-hidden">
            <div
              className="px-6 py-4 text-white flex items-center justify-between"
              style={{ background: `linear-gradient(to right, ${colors.primary}, ${colors.primaryDark})` }}
            >
              <h5 className="text-lg font-semibold">Assign roles: {roleEditingUser.username}</h5>
              <button onClick={closeRolesModal} className="text-white/90 hover:text-white text-2xl leading-none">
                <FiX />
              </button>
            </div>
            <div className="px-6 py-5">
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {roles.map((r) => {
                  const checked = selectedRoleIds.includes(Number(r.role_id));
                  return (
                    <label key={r.role_id} className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleRoleSelection(r.role_id)}
                        className="rounded"
                      />
                      <span className="text-sm text-gray-800">{r.role_name}</span>
                    </label>
                  );
                })}
              </div>
            
              <div className="flex items-center justify-end gap-2 pt-4 mt-4 border-t">
                <button type="button" onClick={closeRolesModal} className="px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveRoles}
                  className="px-5 py-2.5 rounded-lg text-white inline-flex items-center gap-2"
                  style={{ backgroundColor: colors.primary }}
                >
                  <FiCheck />
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-md border overflow-hidden bg-white" style={{ borderColor: `${colors.primary}30` }}>
        <div className="max-h-[800px] overflow-y-auto">
          <table className="min-w-full text-center">
            <thead className="sticky top-0 text-white text-sm" style={{ backgroundColor: colors.primary }}>
              <tr>
                <th className="px-6 py-3 font-semibold text-center">USERNAME</th>
                <th className="px-6 py-3 font-semibold text-center">EMAIL</th>
                <th className="px-6 py-3 font-semibold text-center">MOBILE</th>
                <th className="px-6 py-3 font-semibold text-center">ROLE</th>
                <th className="px-6 py-3 font-semibold text-center">UNIT</th>
                <th className="px-6 py-3 font-semibold text-center">IMAGE</th>
                <th className="px-6 py-3 font-semibold text-center">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {loadingUsers ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center" style={{ color: `${colors.primary}80` }}>
                    Loading…
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center" style={{ color: `${colors.primary}80` }}>
                    {users.length === 0 ? "No users found" : "No users match your search/filters"}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user, idx) => {
                  try {
                    return (
                      <tr key={`${user.id}-${user.profile_image ? 'img' : 'no-img'}-${idx}`} style={{ 
                        backgroundColor: idx % 2 ? `${colors.primary}08` : 'white',
                        transition: 'background-color 0.2s'
                      }}>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="w-full rounded-md px-6 py-3 text-center font-semibold"
                               style={{ 
                                 backgroundColor: `${colors.primary}12`,
                                 color: colors.primaryDark
                               }}>
                            {user.username ?? "-"}
                          </div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="w-full bg-gray-100 rounded-md px-6 py-3 text-center font-semibold text-gray-800 truncate">
                            {user.email ?? "-"}
                          </div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="w-full rounded-md px-6 py-3 text-center font-semibold"
                               style={{ 
                                 backgroundColor: `${colors.primary}12`,
                                 color: colors.primaryDark
                               }}>
                            {user.mobile ?? "-"}
                          </div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="w-full rounded-md px-6 py-3 text-center font-semibold"
                               style={{ 
                                 backgroundColor: `${colors.primary}12`,
                                 color: colors.primaryDark
                               }}>
                            {roleName(user) || "-"}
                          </div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="w-full rounded-md px-6 py-3 text-center font-semibold"
                               style={{ 
                                 backgroundColor: `${colors.primary}12`,
                                 color: colors.primaryDark
                               }}>
                            {unitName(user) || "-"}
                          </div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {(() => {
                            const hasImage = user.profile_image && 
                                           typeof user.profile_image === 'string' && 
                                           user.profile_image.trim() !== '' &&
                                           user.profile_image !== 'null' &&
                                           user.profile_image !== 'undefined';
                            
                            if (hasImage) {
                              return (
                                <img
                                  src={`data:image/png;base64,${user.profile_image}`}
                                  alt={user.username || "user"}
                                  className="w-9 h-9 rounded-full object-cover inline-block"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    const initialsDiv = e.target.parentElement?.querySelector('.user-initials');
                                    if (initialsDiv) {
                                      initialsDiv.style.display = 'flex';
                                    }
                                  }}
                                />
                              );
                            } else {
                              return (
                                <div className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-blue-500 text-white text-sm font-semibold user-initials">
                                  {(user.username && user.username[0]?.toUpperCase()) || "U"}
                                </div>
                              );
                            }
                          })()}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center gap-4">
                            <button
                              onClick={() => openRolesModal(user)}
                              title="Assign Roles"
                              className="px-2 py-1 text-xs rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
                            >
                              Roles
                            </button>

                            <button
                              onClick={() => startEdit(user)}
                              title="Edit"
                              style={{ color: colors.primary }}
                              onMouseEnter={(e) => {
                                e.target.style.color = colors.primaryDark;
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.color = colors.primary;
                              }}
                            >
                              <FiEdit />
                            </button>

                            <button
                              onClick={() => deleteUser(user.id)}
                              title="Delete"
                              className="text-red-600 hover:text-red-700"
                            >
                              <FiTrash2 />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  } catch (err) {
                    return null;
                  }
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Input({ className = "", focusColor, ...props }) {
  return (
    <input
      {...props}
      className={`rounded-md border px-3 py-1.5 text-sm outline-none transition ${className}`}
      onFocus={(e) => {
        if (focusColor) {
          e.target.style.borderColor = focusColor;
          e.target.style.boxShadow = `0 0 0 2px ${focusColor}40`;
        }
      }}
      onBlur={(e) => {
        if (focusColor) {
          e.target.style.borderColor = '';
          e.target.style.boxShadow = '';
        }
      }}
    />
  );
}

function Select({ className = "", focusColor, ...props }) {
  return (
    <select
      {...props}
      className={`rounded-md border px-3 py-1.5 text-sm outline-none transition w-full ${className}`}
      onFocus={(e) => {
        if (focusColor) {
          e.target.style.borderColor = focusColor;
          e.target.style.boxShadow = `0 0 0 2px ${focusColor}40`;
        }
      }}
      onBlur={(e) => {
        if (focusColor) {
          e.target.style.borderColor = '';
          e.target.style.boxShadow = '';
        }
      }}
    />
  );
}

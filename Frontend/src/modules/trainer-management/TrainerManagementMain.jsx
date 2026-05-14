import React from "react";
import { useLocation } from "react-router-dom";
import { getPageColors } from "@shared/utils/pageColors";
import { FiUserPlus, FiEdit, FiTrash2, FiSearch, FiFilter, FiX } from "react-icons/fi";
import { Toaster } from "react-hot-toast";
import { useNotification } from "@shared/hooks/useNotification";
import { CourseMultiSelect } from "./components/CourseMultiSelect";
import { TRAINER_VIEW_STATUS_OPTIONS } from "./constants/trainerManagementConstants";
import { useTrainerManagementController } from "./hooks/useTrainerManagementController";

export default function TrainerManagementPage() {
  const location = useLocation();
  const colors = getPageColors(location.pathname);
  const { showSuccess, showError } = useNotification();
  const {
    trainers,
    courses,
    loading,
    showAdd,
    setShowAdd,
    tName,
    setTName,
    tMobile,
    setTMobile,
    tEmail,
    setTEmail,
    tCourses,
    saving,
    showEditModal,
    editForm,
    searchQuery,
    setSearchQuery,
    showFilters,
    setShowFilters,
    viewStatus,
    setViewStatus,
    startEdit,
    cancelEdit,
    handleEditChange,
    toggleCourseSelection,
    saveEdit,
    deleteTrainer,
    submitAddTrainer,
    filteredTrainers,
    handleToggleTrainerStatus,
  } = useTrainerManagementController({ showSuccess, showError });

  return (
    <div className="p-4 md:p-6">
      <Toaster
        position="top-center"
        containerStyle={{
          top: 80,
          zIndex: 9999,
        }}
        toastOptions={{
          duration: 3000,
          style: {
            fontSize: "0.95rem",
            borderRadius: "12px",
            background: "#333",
            color: "#fff",
            padding: "12px 20px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          },
          success: {
            style: {
              background: "#10B981",
            },
            iconTheme: {
              primary: "#fff",
              secondary: "#10B981",
            },
          },
          error: {
            style: {
              background: "#EF4444",
            },
            iconTheme: {
              primary: "#fff",
              secondary: "#EF4444",
            },
          },
        }}
      />
      <div className="mb-6 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <button
          onClick={() => setShowAdd(true)}
          className="group flex items-center gap-3 rounded-xl border bg-white shadow-sm hover:shadow-md px-6 py-3 transition-all duration-300 hover:-translate-y-0.5 min-w-[220px]"
          style={{ borderColor: `${colors.primary}40` }}
        >
           <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 transition-colors group-hover:scale-110">
           <FiUserPlus className="text-blue-600 text-lg" style={{ color: colors.primary }} />

          </div>
          <span className="text-sm font-bold tracking-wide text-gray-800" style={{ color: colors.primary }}>
              Add New Trainer
          </span>
        </button>

        <div className="flex items-center bg-white rounded-lg p-1 shadow-sm border border-gray-200">
          {TRAINER_VIEW_STATUS_OPTIONS.map((opt) => {
            const isActive = viewStatus === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => setViewStatus(opt.id)}
                className={`px-3 py-1.5 text-[11px] font-bold rounded-md transition-all duration-200 ${
                  isActive
                    ? opt.activeClass
                    : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:flex-initial md:w-64">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search trainers..."
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
              showFilters
                ? 'text-white'
                : 'text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
            style={showFilters ? {
              backgroundColor: colors.primary,
              borderColor: colors.primary
            } : {}}
          >
            <FiFilter size={18} />
            Filters
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
              onClick={() => setShowFilters(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <FiX size={18} />
            </button>
          </div>
          <p className="text-sm text-gray-500">No additional filters available for trainers yet.</p>
        </div>
      )}

      {searchQuery && (
        <div className="mb-4 text-sm text-gray-600">
          Showing {filteredTrainers.length} of {trainers.length} trainers
        </div>
      )}

      <div className="rounded-md border overflow-hidden bg-white" style={{ borderColor: `${colors.primary}30` }}>
        <div className="max-h-[800px] overflow-y-auto">
          <table className="min-w-full text-center table-fixed">
            <thead className="sticky top-0 z-10 text-white text-sm" style={{ backgroundColor: colors.primary }}>
              <tr>
                <th className="px-4 py-3 font-semibold text-center w-[100px]">TRAINER ID</th>
                <th className="px-4 py-3 font-semibold text-center w-[160px]">TRAINER NAME</th>
                <th className="px-4 py-3 font-semibold text-center w-[130px]">MOBILE</th>
                <th className="px-4 py-3 font-semibold text-center w-[180px]">EMAIL</th>
                <th className="px-4 py-3 font-semibold text-center">COURSES</th>
                <th className="px-4 py-3 font-semibold text-center w-[140px]">STATUS</th>
                <th className="px-4 py-3 font-semibold text-center w-[100px]">ACTIONS</th>
              </tr>
            </thead>

            <tbody className="text-sm">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">Loading…</td>
                </tr>
              ) : filteredTrainers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    {trainers.length === 0 ? "No trainers found" : "No trainers match your search"}
                  </td>
                </tr>
              ) : (
                filteredTrainers.map((row, idx) => {
                  return (
                    <tr
                      key={row.trainer_id || idx}
                      style={{
                        backgroundColor: idx % 2 ? `${colors.primary}08` : 'white',
                        transition: 'background-color 0.2s'
                      }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-center" style={{ color: colors.primaryDark }}>
                        {row.trainer_id}
                      </td>

                      <td className="px-6 py-4 text-center">
                          <div className="w-full rounded-md px-4 py-2 text-center font-semibold"
                               style={{
                                 backgroundColor: `${colors.primary}12`,
                                 color: colors.primaryDark
                               }}>
                            {row.trainer_name}
                          </div>
                      </td>

                      <td className="px-6 py-4 text-center">
                          <div className="w-full rounded-md px-4 py-2 text-center font-semibold"
                               style={{
                                 backgroundColor: `${colors.primary}12`,
                                 color: colors.primaryDark
                               }}>
                            {row.trainer_mobile}
                          </div>
                      </td>

                      <td className="px-6 py-4 text-center">
                          <div className="w-full rounded-md px-4 py-2 text-center font-semibold truncate"
                            style={{
                              backgroundColor: `${colors.primary}12`,
                              color: colors.primaryDark,
                            }}
                          >
                            {row.trainer_email}
                          </div>
                      </td>

                      <td className="px-6 py-4 text-center">
                        <div className="flex flex-wrap justify-center gap-1">
                          {Array.isArray(row.courses) && row.courses.length > 0 ? (
                            row.courses.map(c => (
                              <span
                                key={c.course_id}
                                className="px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wider"
                                style={{ backgroundColor: `${colors.primary}20`, color: colors.primaryDark }}
                              >
                                {c.course_name}
                              </span>
                            ))
                          ) : (
                            <span className="text-gray-400 text-xs italic">No courses</span>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleToggleTrainerStatus(row)}
                          className="group relative inline-flex items-center gap-2 transition-all duration-200"
                          title={row.is_active ? 'Click to deactivate' : 'Click to activate'}
                        >
                          <div
                            className={`relative w-11 h-6 rounded-full transition-colors duration-300 ${
                              row.is_active ? 'bg-emerald-500' : 'bg-gray-300'
                            }`}
                          >
                            <div
                              className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 ${
                                row.is_active ? 'translate-x-[22px]' : 'translate-x-0.5'
                              }`}
                            />
                          </div>
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${
                            row.is_active ? 'text-emerald-600' : 'text-gray-400'
                          }`}>
                            {row.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </button>
                      </td>

                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-4">
                            <button
                              onClick={() => startEdit(row)}
                              title="Edit"
                              style={{ color: colors.primary }}
                              className="hover:scale-125 transition-transform"
                            >
                              <FiEdit />
                            </button>
                          <button
                            onClick={() => deleteTrainer(row.trainer_id)}
                            title="Delete"
                            className="text-red-600 hover:text-red-700 hover:scale-125 transition-transform"
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="w-full max-w-md mx-4 rounded-2xl shadow-2xl ring-1 ring-black/5 bg-white">
            <div
              className="px-6 py-4 text-white flex items-center justify-between rounded-t-2xl"
              style={{ background: `linear-gradient(to right, ${colors.primary}, ${colors.primaryDark})` }}
            >
              <h5 className="text-lg font-semibold">Edit Trainer</h5>
              <button onClick={cancelEdit} className="text-white/90 hover:text-white text-2xl leading-none">&times;</button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); saveEdit(); }} className="px-6 py-5">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Trainer Name</label>
                  <input
                    value={editForm.trainer_name}
                    onChange={(e) => handleEditChange("trainer_name", e.target.value)}
                    required
                    className="w-full rounded-lg border px-3 py-2.5 focus:outline-none transition"
                    style={{ borderColor: `${colors.primary}80` }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input
                    type="email"
                    value={editForm.trainer_email}
                    onChange={(e) => handleEditChange("trainer_email", e.target.value)}
                    required
                    className="w-full rounded-lg border px-3 py-2.5 focus:outline-none transition"
                    style={{ borderColor: `${colors.primary}80` }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Mobile</label>
                  <input
                    value={editForm.trainer_mobile}
                    onChange={(e) => handleEditChange("trainer_mobile", e.target.value.replace(/\s/g, ""))}
                    placeholder="Enter Mobile Number"
                    required
                    className="w-full rounded-lg border px-3 py-2.5 focus:outline-none transition"
                    style={{ borderColor: `${colors.primary}80` }}
                  />
                </div>

                <CourseMultiSelect
                  label="Courses Handling"
                  selectedIds={editForm.course_ids}
                  onChange={(id) => toggleCourseSelection(id, true)}
                  courses={courses}
                  primaryColor={colors.primary}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-6 mt-6 border-t font-bold">
                <button type="button" onClick={cancelEdit} className="px-4 py-2.5 rounded-lg border text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-5 py-2.5 rounded-lg text-white" style={{ backgroundColor: colors.primary }}>Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="w-full max-w-md mx-4 rounded-2xl shadow-2xl ring-1 ring-black/5 bg-white">
            <div className="px-6 py-4 text-white flex items-center justify-between rounded-t-2xl"
                 style={{ background: `linear-gradient(to right, ${colors.primary}, ${colors.primaryDark})` }}>
              <h5 className="text-lg font-semibold">Create New Trainer</h5>
              <button onClick={() => setShowAdd(false)} className="text-white/90 hover:text-white text-2xl leading-none">&times;</button>
            </div>

            <form onSubmit={submitAddTrainer} className="px-6 py-5">
              <div className="mb-3">
                <label className="block text-sm font-medium mb-1" style={{ color: colors.primary }}>Trainer Name</label>
                <input
                  value={tName}
                  onChange={(e) => setTName(e.target.value)}
                  required
                  className="w-full rounded-lg border px-3 py-2.5 focus:outline-none transition"
                  style={{ borderColor: `${colors.primary}80` }}
                />
              </div>
              <div className="mb-3">
                <label className="block text-sm font-medium mb-1" style={{ color: colors.primary }}>Mobile Number</label>
                <input
                  value={tMobile}
                  onChange={(e) => setTMobile(e.target.value.replace(/\s/g, ""))}
                  placeholder="Enter Mobile Number"
                  required
                  className="w-full rounded-lg border px-3 py-2.5 focus:outline-none transition"
                  style={{ borderColor: `${colors.primary}80` }}
                />
              </div>
              <div className="mb-3">
                <label className="block text-sm font-medium mb-1" style={{ color: colors.primary }}>Email</label>
                <input
                  type="email"
                  value={tEmail}
                  onChange={(e) => setTEmail(e.target.value)}
                  required
                  className="w-full rounded-lg border px-3 py-2.5 focus:outline-none transition"
                  style={{ borderColor: `${colors.primary}80` }}
                />
              </div>

              <CourseMultiSelect
                label="Courses Handling"
                selectedIds={tCourses}
                onChange={(id) => toggleCourseSelection(id, false)}
                courses={courses}
                primaryColor={colors.primary}
              />

              <div className="flex items-center justify-end gap-2 pt-6 border-t mt-6 font-bold">
                <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving} className="px-5 py-2.5 rounded-lg text-white disabled:opacity-60" style={{ backgroundColor: colors.primary }}>
                  {saving ? "Saving…" : "Create Trainer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

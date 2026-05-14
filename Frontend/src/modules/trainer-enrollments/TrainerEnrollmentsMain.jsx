import React from "react";
import { API_BASE_URL } from "@shared/api/client";
import { EnrollmentStatusBadge } from "@shared/components/EnrollmentStatusBadge";
import {
  MdSearch,
  MdFilterList,
  MdCheckCircle,
  MdCancel,
  MdVisibility,
  MdRefresh,
  MdThumbUp,
  MdWork,
  MdDescription,
  MdBadge,
  MdHourglassEmpty,
} from "react-icons/md";
import { Toaster } from "react-hot-toast";
import {
  STATUS_STYLE,
  STATUS_TABS,
  TAB_ACTIVE_CLASS,
} from "./constants/trainerEnrollmentsConstants";
import { useTrainerEnrollmentsController } from "./hooks/useTrainerEnrollmentsController";

export default function TrainerEnrollmentsMain() {
  const {
    loading,
    filterStatus,
    setFilterStatus,
    searchTerm,
    setSearchTerm,
    selectedEnrollment,
    setSelectedEnrollment,
    showModal,
    setShowModal,
    rejectionReason,
    setRejectionReason,
    showRejectionInput,
    setShowRejectionInput,
    actionLoading,
    fetchEnrollments,
    handleAccept,
    handleApprove,
    handleReject,
    closeModal,
    displayList,
    countFor,
  } = useTrainerEnrollmentsController();

  return (
    <div className="p-6 bg-[#f0f1f5] min-h-screen">
      <Toaster position="top-center" reverseOrder={false} />
      <div className="flex flex-wrap gap-2 mb-6">
        {STATUS_TABS.map(({ key, label }) => {
          const count = countFor(key);
          const isActive = filterStatus === key;
          return (
            <button
              key={key}
              onClick={() => setFilterStatus(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold transition-all duration-150 ${
                isActive
                  ? TAB_ACTIVE_CLASS[key]
                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-400 hover:bg-gray-50"
              }`}
            >
              {label}
              <span
                className={`inline-flex items-center justify-center min-w-[22px] h-5 rounded-full text-[11px] font-bold px-1.5 ${
                  isActive ? "bg-white/25 text-white" : "bg-gray-100 text-gray-600"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
        <button
          onClick={fetchEnrollments}
          className="ml-auto flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm"
        >
          <MdRefresh className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row md:items-center gap-4">
          <div className="relative flex-1">
            <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
            <input
              type="text"
              placeholder="Search by name, email, phone or specialization..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-400 outline-none text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <MdFilterList className="text-xl" />
            {displayList.length} application{displayList.length !== 1 ? "s" : ""}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs font-semibold uppercase tracking-wider">
                <th className="px-6 py-4">Trainer Details</th>
                <th className="px-6 py-4">Specialization</th>
                <th className="px-6 py-4 text-center">Experience</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <MdRefresh className="text-4xl animate-spin text-orange-500" />
                      Loading applications...
                    </div>
                  </td>
                </tr>
              ) : displayList.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-400">
                    <MdHourglassEmpty className="text-4xl mx-auto mb-2 opacity-40" />
                    No records found.
                  </td>
                </tr>
              ) : (
                displayList.map((e) => (
                  <tr key={e.enrollment_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">{e.trainer_name}</div>
                      <div className="text-xs text-gray-500">{e.trainer_email}</div>
                      <div className="text-xs text-gray-400">{e.trainer_mobile}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="inline-flex items-center gap-1.5 text-sm text-gray-700 font-medium">
                        <MdWork className="text-orange-500" />
                        {e.specialization || "Not specified"}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="text-sm font-bold text-gray-700">
                        {e.experience_years ? `${e.experience_years} yrs` : "N/A"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={e.status} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedEnrollment(e);
                            setShowModal(true);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <MdVisibility className="text-xl" />
                        </button>
                        {e.status === "submitted" && (
                          <>
                            <button
                              onClick={() => handleAccept(e.enrollment_id)}
                              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-700 rounded-lg"
                            >
                              <MdThumbUp className="text-sm" /> Accept
                            </button>
                            <button
                              onClick={() => {
                                setSelectedEnrollment(e);
                                setShowModal(true);
                                setShowRejectionInput(true);
                              }}
                              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-white bg-red-500 hover:bg-red-600 rounded-lg"
                            >
                              <MdCancel className="text-sm" /> Reject
                            </button>
                          </>
                        )}
                        {e.status === "accepted" && (
                          <>
                            <button
                              onClick={() => handleApprove(e.enrollment_id)}
                              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-white bg-green-600 hover:bg-green-700 rounded-lg"
                            >
                              <MdCheckCircle className="text-sm" /> Approve
                            </button>
                            <button
                              onClick={() => {
                                setSelectedEnrollment(e);
                                setShowModal(true);
                                setShowRejectionInput(true);
                              }}
                              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-white bg-red-500 hover:bg-red-600 rounded-lg"
                            >
                              <MdCancel className="text-sm" /> Reject
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && selectedEnrollment && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={(ev) => ev.target === ev.currentTarget && closeModal()}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div
              className={`h-1.5 ${
                selectedEnrollment.status === "submitted"
                  ? "bg-blue-500"
                  : selectedEnrollment.status === "accepted"
                  ? "bg-cyan-500"
                  : selectedEnrollment.status === "approved"
                  ? "bg-orange-500"
                  : "bg-red-500"
              }`}
            />
            <div className="px-6 pt-5 pb-4 flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-100 flex-shrink-0 border-2 border-gray-200 flex items-center justify-center">
                  {selectedEnrollment.photo_url ? (
                    <img
                      src={`${API_BASE_URL}/uploads/${selectedEnrollment.photo_url}`}
                      alt={selectedEnrollment.trainer_name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                    />
                  ) : (
                    <span className="text-gray-400 text-xl font-bold">
                      {selectedEnrollment.trainer_name?.charAt(0)?.toUpperCase() || "T"}
                    </span>
                  )}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{selectedEnrollment.trainer_name}</h2>
                  <p className="text-sm text-gray-500">{selectedEnrollment.trainer_email}</p>
                  <div className="mt-1">
                    <EnrollmentStatusBadge status={selectedEnrollment.status} statusStyleMap={STATUS_STYLE} />
                  </div>
                </div>
              </div>
              <button onClick={closeModal} className="text-gray-300 hover:text-gray-500 transition-colors">
                <MdCancel className="text-xl" />
              </button>
            </div>
            <div className="px-6 pb-5 max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-x-8 gap-y-4 py-4 border-t border-gray-100">
                {[
                  ["Mobile", selectedEnrollment.trainer_mobile],
                  ["Specialization", selectedEnrollment.specialization],
                  [
                    "Experience",
                    selectedEnrollment.experience_years
                      ? `${selectedEnrollment.experience_years} Years`
                      : null,
                  ],
                  ["Languages", selectedEnrollment.language],
                  ["Work Experience", selectedEnrollment.role],
                  ["Employee ID", selectedEnrollment.employee_id],
                  [
                    "Applied Date",
                    new Date(selectedEnrollment.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "2-digit",
                      year: "numeric",
                    }),
                  ],
                ].map(([label, value]) => (
                  <div key={label}>
                    <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-0.5">
                      {label}
                    </p>
                    <p className="text-sm font-semibold text-gray-800">{value || "—"}</p>
                  </div>
                ))}
              </div>
              {(selectedEnrollment.resume_url || selectedEnrollment.aadhar_card_url) && (
                <div className="flex items-center gap-3 py-4 border-t border-gray-100">
                  {selectedEnrollment.resume_url && (
                    <a
                      href={`${API_BASE_URL}/uploads/${selectedEnrollment.resume_url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 border border-gray-200 text-sm font-medium"
                    >
                      <MdDescription className="text-gray-400" /> View Resume
                    </a>
                  )}
                  {selectedEnrollment.aadhar_card_url && (
                    <a
                      href={`${API_BASE_URL}/uploads/${selectedEnrollment.aadhar_card_url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 border border-gray-200 text-sm font-medium"
                    >
                      <MdBadge className="text-gray-400" /> View Aadhar
                    </a>
                  )}
                </div>
              )}
              <div className="py-4 border-t border-gray-100">
                <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1.5">
                  Professional Bio
                </p>
                <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 rounded-lg px-4 py-3 border border-gray-100">
                  {selectedEnrollment.bio || "No bio provided."}
                </p>
              </div>
              <div className="py-4 border-t border-gray-100">
                <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1.5">
                  Certifications
                </p>
                <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 rounded-lg px-4 py-3 border border-gray-100">
                  {selectedEnrollment.certifications || "No certifications listed."}
                </p>
              </div>
              {selectedEnrollment.status === "rejected" && selectedEnrollment.rejection_reason && (
                <div className="py-4 border-t border-gray-100">
                  <p className="text-[11px] font-medium text-red-400 uppercase tracking-wide mb-1.5">
                    Rejection Reason
                  </p>
                  <p className="text-sm text-red-700 leading-relaxed bg-red-50 rounded-lg px-4 py-3 border border-red-100">
                    {selectedEnrollment.rejection_reason}
                  </p>
                </div>
              )}
              {showRejectionInput && (
                <div className="py-4 border-t border-gray-100 space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Rejection Reason <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-300 outline-none resize-none text-sm"
                    rows="3"
                    placeholder="Enter the reason for rejection..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                  />
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3">
              {!showRejectionInput && selectedEnrollment.status === "submitted" && (
                <>
                  <button
                    onClick={() => setShowRejectionInput(true)}
                    className="px-5 py-2 text-sm font-semibold text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleAccept(selectedEnrollment.enrollment_id)}
                    disabled={actionLoading}
                    className="px-5 py-2 text-sm font-semibold bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 disabled:opacity-60 flex items-center gap-2"
                  >
                    {actionLoading ? <MdRefresh className="animate-spin" /> : <MdThumbUp />} Accept
                    Application
                  </button>
                </>
              )}
              {!showRejectionInput && selectedEnrollment.status === "accepted" && (
                <>
                  <button
                    onClick={() => setShowRejectionInput(true)}
                    className="px-5 py-2 text-sm font-semibold text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleApprove(selectedEnrollment.enrollment_id)}
                    disabled={actionLoading}
                    className="px-5 py-2 text-sm font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-60 flex items-center gap-2"
                  >
                    {actionLoading ? <MdRefresh className="animate-spin" /> : <MdCheckCircle />} Approve
                    Trainer
                  </button>
                </>
              )}
              {showRejectionInput && (
                <>
                  <button
                    onClick={() => setShowRejectionInput(false)}
                    className="px-5 py-2 text-sm font-semibold text-gray-500 hover:text-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleReject(selectedEnrollment.enrollment_id)}
                    disabled={actionLoading}
                    className="px-5 py-2 text-sm font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-60 flex items-center gap-2"
                  >
                    {actionLoading ? <MdRefresh className="animate-spin" /> : null} Confirm Rejection
                  </button>
                </>
              )}
              {!showRejectionInput &&
                ["approved", "rejected"].includes(selectedEnrollment.status) && (
                  <button
                    onClick={closeModal}
                    className="px-6 py-2 text-sm font-semibold bg-gray-800 text-white rounded-lg hover:bg-gray-700"
                  >
                    Close
                  </button>
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }) {
  return <EnrollmentStatusBadge status={status} statusStyleMap={STATUS_STYLE} />;
}

import React from "react";
import { FiFacebook, FiTrash2, FiX } from "react-icons/fi";

export default function MetaLeadDetailsModal({
  viewModalOpen,
  selectedLead,
  setViewModalOpen,
  colors,
  editData,
  setEditData,
  updateLeadStatus,
  statusOptions,
  formatDate,
  saveLoading,
  handleSaveEdit,
  handleConvert,
  deleteLead,
}) {
  if (!viewModalOpen || !selectedLead) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl border overflow-hidden max-h-[90vh] overflow-y-auto"
        style={{ borderColor: `${colors.primary}30` }}
      >
        <div
          className="px-6 py-4 flex items-center justify-between text-white sticky top-0"
          style={{ background: `linear-gradient(to right, ${colors.primary}, ${colors.primaryDark})` }}
        >
          <div className="flex items-center gap-3">
            <FiFacebook size={24} />
            <h3 className="text-xl font-semibold">Lead Details</h3>
          </div>
          <button onClick={() => setViewModalOpen(false)} className="text-white/90 hover:text-white text-2xl leading-none">
            <FiX />
          </button>
        </div>

        <div className="px-6 py-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <label className="text-xs font-medium text-gray-500 block mb-1">Lead Name</label>
              <input
                type="text"
                value={editData.lead_name}
                onChange={(e) => setEditData({ ...editData, lead_name: e.target.value })}
                className="w-full bg-white rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
              />
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <label className="text-xs font-medium text-gray-500 block mb-1">Status</label>
              <select
                value={selectedLead.status || "new"}
                onChange={(e) => updateLeadStatus(selectedLead.id, e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2"
                style={{ borderColor: `${colors.primary}50` }}
              >
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <span className="w-1 h-4 rounded" style={{ backgroundColor: colors.primary }}></span>
              Contact Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-xs font-medium text-gray-500 block mb-1">Email</label>
                <input
                  type="email"
                  value={editData.email}
                  onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                  className="w-full bg-white rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-xs font-medium text-gray-500 block mb-1">Phone</label>
                <input
                  type="text"
                  value={editData.phone}
                  onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                  className="w-full bg-white rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <span className="w-1 h-4 rounded" style={{ backgroundColor: colors.primary }}></span>
              Timestamps
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-xs font-medium text-gray-500 block mb-1">Received At</label>
                <p className="text-gray-800">{formatDate(selectedLead.created_date)}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-xs font-medium text-gray-500 block mb-1">Last Updated</label>
                <p className="text-gray-800">{formatDate(selectedLead.updated_at)}</p>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <span className="w-1 h-4 rounded" style={{ backgroundColor: colors.primary }}></span>
              Facebook Ad Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-xs font-medium text-gray-500 block mb-1">Campaign</label>
                <p className="text-gray-800">{selectedLead.campaign_source || "-"}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-xs font-medium text-gray-500 block mb-1">Ad Name</label>
                <p className="text-gray-800">{selectedLead.ad_name || "-"}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-xs font-medium text-gray-500 block mb-1">Form ID</label>
                <p className="text-gray-800 text-sm font-mono">{selectedLead.form_id || "-"}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-xs font-medium text-gray-500 block mb-1">Lead ID</label>
                <p className="text-gray-800 text-sm font-mono">{selectedLead.lead_id || "-"}</p>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <span className="w-1 h-4 rounded" style={{ backgroundColor: colors.primary }}></span>
              Notes & Details
            </h4>
            <div className="bg-gray-50 rounded-lg p-4">
              <textarea
                value={editData.notes}
                onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                className="w-full bg-white rounded-lg border border-gray-200 px-3 py-2 text-sm min-h-[100px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Add notes about this lead..."
              ></textarea>
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t">
            <button
              onClick={() => deleteLead(selectedLead.id)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
            >
              <FiTrash2 size={18} />
              Delete Lead
            </button>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setViewModalOpen(false)}
                className="px-6 py-2 rounded-lg font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConvert}
                className="flex items-center gap-1.5 px-6 py-2 rounded-lg font-semibold text-white transition-all shadow-md hover:shadow-lg bg-green-600 hover:bg-green-700"
              >
                Promote to CRM
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={saveLoading}
                className="px-6 py-2 rounded-lg font-semibold text-white transition-all shadow-md hover:shadow-lg disabled:opacity-50"
                style={{ backgroundColor: colors.primary }}
              >
                {saveLoading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

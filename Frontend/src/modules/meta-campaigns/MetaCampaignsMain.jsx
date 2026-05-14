import React from 'react'
import { useLocation } from 'react-router-dom'
import { getPageColors } from '@shared/utils/pageColors'
import { FiX, FiEye, FiTrash2, FiSearch, FiFilter } from 'react-icons/fi'
import { useMetaCampaignsController } from './hooks/useMetaCampaignsController'

export default function MetaCampaignsMain() {
  const location = useLocation()
  const colors = getPageColors(location.pathname)
  const {
    campaigns,
    loading,
    addModalOpen,
    setAddModalOpen,
    editModalOpen,
    setEditModalOpen,
    editCampaign,
    searchQuery,
    setSearchQuery,
    filterStatus,
    setFilterStatus,
    showFilters,
    setShowFilters,
    statusOptions,
    filteredCampaigns,
    handleAdd,
    openEditModal,
    handleEdit,
    handleDelete,
  } = useMetaCampaignsController();

  const fieldStyle = {
    borderColor: `${colors.primary}50`,
  }

  const inputClass =
    "w-full rounded-lg border px-4 py-3 text-[15px] focus:outline-none transition";

  const focusHandlers = {
    onFocus: (e) => {
      e.target.style.borderColor = colors.primary
      e.target.style.boxShadow = `0 0 0 2px ${colors.primary}40`
    },
    onBlur: (e) => {
      e.target.style.borderColor = `${colors.primary}50`
      e.target.style.boxShadow = ''
    },
  }

  const pillStyle = {
    backgroundColor: `${colors.primary}12`,
    color: colors.primaryDark,
    borderRadius: '0.65rem',
    padding: '0.35rem 0.75rem',
    fontWeight: 600,
    display: 'inline-block',
    minWidth: '90px',
    textAlign: 'center',
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <button
          className="group flex items-center gap-3 rounded-xl border bg-white shadow-sm hover:shadow-md px-6 py-3 transition-all duration-300 hover:-translate-y-0.5 min-w-[220px]"
          style={{ borderColor: `${colors.primary}40` }}
          onClick={() => setAddModalOpen(true)}
        >
          <div
            className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors group-hover:scale-110"
            style={{ backgroundColor: `${colors.primary}15`, color: colors.primary }}
          >
            <span className="text-xl leading-none font-bold">+</span>
          </div>
          <span className="text-sm font-bold tracking-wide" style={{ color: colors.primary }}>
            Add Meta Campaign
          </span>
        </button>

        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:flex-initial md:w-64">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search campaigns..."
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
              showFilters || filterStatus
                ? 'text-white'
                : 'text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
            style={showFilters || filterStatus ? {
              backgroundColor: colors.primary,
              borderColor: colors.primary
            } : {}}
          >
            <FiFilter size={18} />
            Filters
            {filterStatus && (
              <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-white/20">
                1
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
                setFilterStatus("");
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
                Filter by Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
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
                <option value="">All Status</option>
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {(searchQuery || filterStatus) && (
        <div className="mb-4 text-sm text-gray-600">
          Showing {filteredCampaigns.length} of {campaigns.length} campaigns
        </div>
      )}

      <div className="overflow-x-auto overflow-y-auto max-h-[70vh] rounded-md border bg-white" style={{ borderColor: `${colors.primary}30` }}>
        <table className="min-w-[1100px] w-full text-center">
          <thead className="sticky top-0 z-10 text-white text-sm" style={{ backgroundColor: colors.primary }}>
            <tr>
              <th className="px-4 py-3 font-semibold text-center">ID</th>
              <th className="px-4 py-3 font-semibold text-center">NAME</th>
              <th className="px-4 py-3 font-semibold text-center">START DATE</th>
              <th className="px-4 py-3 font-semibold text-center">END DATE</th>
              <th className="px-4 py-3 font-semibold text-center">TOTAL BUDGET</th>
              <th className="px-4 py-3 font-semibold text-center">STATUS</th>
              <th className="px-4 py-3 font-semibold text-center">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {loading ? (
              <tr>
                <td colSpan={8} className="text-center py-6" style={{ color: `${colors.primary}80` }}>
                  Loading...
                </td>
              </tr>
            ) : filteredCampaigns.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-6" style={{ color: `${colors.primary}80` }}>
                  {campaigns.length === 0 ? "No campaigns found." : "No campaigns match your search/filters"}
                </td>
              </tr>
            ) : (
              filteredCampaigns.map((c, idx) => {
                const isActive = (c.status || "").toLowerCase() === "active"
                return (
                <tr
                  key={c.id}
                  onClick={() => openEditModal(c.id)}
                  className="cursor-pointer hover:opacity-90"
                  style={{
                    backgroundColor: idx % 2 ? `${colors.primary}04` : 'white',
                    transition: 'background-color 0.2s',
                  }}
                >
                  <td className="px-4 py-3 whitespace-nowrap text-center">
                    <div className="w-full rounded-md px-4 py-2 font-semibold" style={pillStyle}>
                      {c.id}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="w-full rounded-md px-4 py-2 font-semibold" style={pillStyle}>
                      {c.name}
                    </div>
                  </td>

                  <td className="px-4 py-3 text-center">
                    <div className="w-full rounded-md px-4 py-2 font-semibold" style={pillStyle}>
                      {c.start_date ? c.start_date.split('T')[0] : ''}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="w-full rounded-md px-4 py-2 font-semibold" style={pillStyle}>
                      {c.end_date ? c.end_date.split('T')[0] : ''}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="w-full rounded-md px-4 py-2 font-semibold" style={pillStyle}>
                      {c.total_budget !== undefined && c.total_budget !== null
                        ? Number(c.total_budget).toFixed(2)
                        : ''}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                      }`}
                    >
                      {isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center">
                      <button
                        title="View Details"
                        onClick={(e) => { e.stopPropagation(); openEditModal(c.id); }}
                        className="p-2 rounded-full transition-colors hover:opacity-80"
                        style={{
                          color: colors.primary,
                          backgroundColor: `${colors.primary}15`
                        }}
                      >
                        <FiEye size={20} />
                      </button>
                    </div>
                  </td>
                </tr>
              )})
            )}
          </tbody>
        </table>
      </div>

      {addModalOpen && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <form
            className="bg-white rounded-2xl shadow-lg w-full max-w-2xl border overflow-hidden"
            style={{ borderColor: `${colors.primary}30` }}
            onSubmit={handleAdd}
          >
            <div
              className="px-6 py-4 flex items-center justify-between text-white"
              style={{ background: `linear-gradient(to right, ${colors.primary}, ${colors.primaryDark})` }}
            >
              <h3 className="text-xl font-semibold">Add Meta Campaign</h3>
              <button
                type="button"
                onClick={() => setAddModalOpen(false)}
                className="text-white/90 hover:text-white text-2xl leading-none"
              >
                <FiX />
              </button>
            </div>
            <div className="px-6 py-5 grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-600 mb-1">Name</label>
                <input
                  name="name"
                  className={inputClass}
                  placeholder=""
                  required
                  style={fieldStyle}
                  {...focusHandlers}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-600 mb-1">Description</label>
                <textarea
                  name="description"
                  className={inputClass}
                  placeholder=""
                  style={fieldStyle}
                  {...focusHandlers}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Start Date</label>
                <input
                  name="start_date"
                  type="date"
                  className={inputClass}
                  placeholder="dd-mm-yyyy"
                  required
                  style={fieldStyle}
                  {...focusHandlers}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">End Date</label>
                <input
                  name="end_date"
                  type="date"
                  className={inputClass}
                  placeholder="dd-mm-yyyy"
                  required
                  style={fieldStyle}
                  {...focusHandlers}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Total Budget</label>
                <input
                  name="total_budget"
                  type="number"
                  className={inputClass}
                  placeholder=""
                  style={fieldStyle}
                  {...focusHandlers}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Status</label>
                <select
                  name="status"
                  className={inputClass}
                  defaultValue="active"
                  required
                  style={fieldStyle}
                  {...focusHandlers}
                >
                  {statusOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2 flex justify-end gap-2 pt-6 border-t mt-4">
                <button
                  type="button"
                  className="px-6 py-2 rounded font-semibold border text-gray-700 hover:bg-gray-50"
                  onClick={() => setAddModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded font-semibold text-white"
                  style={{ backgroundColor: colors.primary }}
                  onMouseEnter={(e) => (e.target.style.backgroundColor = colors.primaryDark)}
                  onMouseLeave={(e) => (e.target.style.backgroundColor = colors.primary)}
                >
                  Save
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {editModalOpen && editCampaign && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <form
            className="bg-white rounded-2xl shadow-lg w-full max-w-2xl border overflow-hidden"
            style={{ borderColor: `${colors.primary}30` }}
            onSubmit={handleEdit}
          >
            <div
              className="px-6 py-4 flex items-center justify-between text-white"
              style={{ background: `linear-gradient(to right, ${colors.primary}, ${colors.primaryDark})` }}
            >
              <h3 className="text-xl font-semibold">Edit Meta Campaign</h3>
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="text-white/90 hover:text-white text-2xl leading-none"
              >
                <FiX />
              </button>
            </div>
            <input type="hidden" name="id" value={editCampaign.id} />
            <div className="px-6 py-5 grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-600 mb-1">Name</label>
                <input
                  name="name"
                  className={inputClass}
                  placeholder=""
                  defaultValue={editCampaign.name}
                  required
                  style={fieldStyle}
                  {...focusHandlers}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-600 mb-1">Description</label>
                <textarea
                  name="description"
                  className={inputClass}
                  placeholder=""
                  defaultValue={editCampaign.description}
                  style={fieldStyle}
                  {...focusHandlers}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Start Date</label>
                <input
                  name="start_date"
                  type="date"
                  className={inputClass}
                  placeholder="dd-mm-yyyy"
                  defaultValue={editCampaign.start_date ? editCampaign.start_date.split('T')[0] : ''}
                  required
                  style={fieldStyle}
                  {...focusHandlers}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">End Date</label>
                <input
                  name="end_date"
                  type="date"
                  className={inputClass}
                  placeholder="dd-mm-yyyy"
                  defaultValue={editCampaign.end_date ? editCampaign.end_date.split('T')[0] : ''}
                  required
                  style={fieldStyle}
                  {...focusHandlers}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Total Budget</label>
                <input
                  name="total_budget"
                  type="number"
                  className={inputClass}
                  placeholder=""
                  defaultValue={editCampaign.total_budget}
                  style={fieldStyle}
                  {...focusHandlers}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Status</label>
                <select
                  name="status"
                  className={inputClass}
                  defaultValue={editCampaign.status || "inactive"}
                  required
                  style={fieldStyle}
                  {...focusHandlers}
                >
                  {statusOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2 flex justify-between items-center pt-6 border-t mt-4">
                <button
                  type="button"
                  title="Delete Campaign"
                  className="p-2 rounded-full text-red-600 bg-red-100 hover:bg-red-200 transition-colors"
                  onClick={() => handleDelete(editCampaign.id)}
                >
                  <FiTrash2 size={20} />
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="px-6 py-2 rounded font-semibold border text-gray-700 hover:bg-gray-50"
                    onClick={() => setEditModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 rounded font-semibold text-white"
                    style={{ backgroundColor: colors.primary }}
                    onMouseEnter={(e) => (e.target.style.backgroundColor = colors.primaryDark)}
                    onMouseLeave={(e) => (e.target.style.backgroundColor = colors.primary)}
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

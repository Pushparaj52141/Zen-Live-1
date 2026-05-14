import React from "react";
import {
  FiEye,
  FiExternalLink,
  FiFacebook,
  FiFilter,
  FiRefreshCw,
  FiSearch,
  FiX,
} from "react-icons/fi";

export default function MetaLeadsTopSection({
  stats,
  selectedFormId,
  setSelectedFormId,
  formSummary,
  fetchMetaLeads,
  refreshing,
  loading,
  syncHistoricalLeads,
  searchQuery,
  setSearchQuery,
  showFilters,
  setShowFilters,
  filterStatus,
  setFilterStatus,
  statusOptions,
}) {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Leads", count: stats.total, color: "from-indigo-600 to-indigo-400", icon: <FiFacebook /> },
          {
            label: "New / Unprocessed",
            count: stats.newLeads,
            color: "from-blue-600 to-cyan-400",
            icon: <FiRefreshCw />,
          },
          { label: "Active Contact", count: stats.contacted, color: "from-amber-500 to-orange-400", icon: <FiEye /> },
          {
            label: "Lead Conversions",
            count: stats.converted,
            color: "from-emerald-600 to-teal-400",
            icon: <FiExternalLink />,
          },
        ].map((stat, i) => (
          <div
            key={i}
            className={`relative overflow-hidden bg-gradient-to-br ${stat.color} rounded-2xl p-5 shadow-lg shadow-indigo-200/20 group transition-all duration-300 hover:-translate-y-1`}
          >
            <div className="absolute -right-4 -top-4 text-white/10 group-hover:scale-110 transition-transform duration-500">
              {React.cloneElement(stat.icon, { size: 100 })}
            </div>
            <div className="relative z-10 flex flex-col items-center">
              <span className="text-white/80 text-xs font-bold uppercase tracking-widest mb-1">
                {stat.label}
              </span>
              <span className="text-white text-3xl font-black">{stat.count}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <FiFacebook size={22} />
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-800 tracking-tight">Lead Sources</h2>
              <p className="text-xs text-gray-400 font-medium italic">Explore leads by specific marketing forms</p>
            </div>
          </div>
          {selectedFormId !== "all" && (
            <button
              onClick={() => setSelectedFormId("all")}
              className="text-xs font-bold px-4 py-2 rounded-full transition-all bg-gray-100 text-gray-500 hover:bg-indigo-600 hover:text-white"
            >
              CLEAR FILTER
            </button>
          )}
        </div>

        <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar scroll-smooth">
          <div
            onClick={() => setSelectedFormId("all")}
            className={`flex-shrink-0 w-56 p-5 rounded-2xl border-2 cursor-pointer transition-all duration-300 relative ${
              selectedFormId === "all"
                ? "bg-indigo-600 border-indigo-600 shadow-xl shadow-indigo-200 -translate-y-1"
                : "bg-white border-gray-100 hover:border-indigo-200"
            }`}
          >
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${
                selectedFormId === "all" ? "bg-white/20 text-white" : "bg-indigo-50 text-indigo-600"
              }`}
            >
              <FiFacebook size={24} />
            </div>
            <h3 className={`font-black text-sm mb-1 ${selectedFormId === "all" ? "text-white" : "text-gray-800"}`}>
              Cumulative Data
            </h3>
            <p className={`text-xs font-bold ${selectedFormId === "all" ? "text-white/70" : "text-gray-400"}`}>
              {stats.total} total synced
            </p>
          </div>

          {formSummary
            .filter((f) => f.form_id !== "all")
            .map((form) => (
              <div
                key={form.form_id}
                onClick={() => setSelectedFormId(form.form_id)}
                className={`flex-shrink-0 w-56 p-5 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${
                  selectedFormId === form.form_id
                    ? "bg-indigo-600 border-indigo-600 shadow-xl shadow-indigo-200 -translate-y-1"
                    : "bg-white border-gray-100 hover:border-indigo-200"
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${
                    selectedFormId === form.form_id ? "bg-white/20 text-white" : "bg-indigo-50 text-indigo-600"
                  }`}
                >
                  {form.form_id === "messaging" ? <FiFacebook size={24} /> : <FiSearch size={22} />}
                </div>
                <h3
                  className={`font-black text-sm mb-1 truncate ${
                    selectedFormId === form.form_id ? "text-white" : "text-gray-800"
                  }`}
                  title={form.form_name}
                >
                  {form.form_name}
                </h3>
                <p
                  className={`text-xs font-bold ${
                    selectedFormId === form.form_id ? "text-white/70" : "text-gray-400"
                  }`}
                >
                  {form.lead_count} verified leads
                </p>
              </div>
            ))}
        </div>
      </div>

      <div className="mb-6 flex flex-col lg:flex-row gap-4 items-center justify-between bg-white/60 backdrop-blur-md p-4 rounded-3xl border border-white/40 shadow-sm sticky top-0 z-20">
        <div className="flex flex-wrap gap-2 w-full lg:w-auto">
          <button
            onClick={() => fetchMetaLeads(true)}
            disabled={refreshing}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-600 text-white font-bold text-xs transition-all hover:bg-indigo-700 shadow-md shadow-indigo-200 active:scale-95 ${
              refreshing ? "animate-pulse" : ""
            }`}
          >
            <FiRefreshCw className={refreshing ? "animate-spin" : ""} size={14} />
            REFRESH DATA
          </button>

          <button
            onClick={syncHistoricalLeads}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white text-indigo-600 border-2 border-indigo-100 font-bold text-xs transition-all hover:border-indigo-600 active:scale-95"
          >
            <FiFacebook size={14} />
            SYNC HISTORICAL
          </button>
        </div>

        <div className="flex gap-2 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-80 group">
            <FiSearch
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors"
              size={16}
            />
            <input
              type="text"
              placeholder="Quick search leads..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-2.5 rounded-2xl border-2 border-gray-100 bg-gray-50/50 focus:bg-white focus:border-indigo-600 focus:outline-none transition-all text-sm font-medium"
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-xs transition-all border-2 ${
              showFilters || filterStatus
                ? "bg-indigo-50 border-indigo-600 text-indigo-600"
                : "bg-white border-gray-100 text-gray-500 hover:border-gray-300"
            }`}
          >
            <FiFilter size={14} />
            {filterStatus ? "FILTERED" : "FILTERS"}
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="mb-6 p-6 rounded-3xl bg-white border border-indigo-50 shadow-xl shadow-indigo-100/20 animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-black text-indigo-600 uppercase tracking-widest">Refine Search</h3>
            <button onClick={() => setShowFilters(false)} className="text-gray-400 hover:text-indigo-600 p-1 rounded-lg">
              <FiX size={18} />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2">
                Lead Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full rounded-xl border-2 border-gray-100 px-4 py-2.5 text-sm font-bold text-gray-600 focus:border-indigo-600 focus:outline-none transition-all appearance-none bg-gray-50/30"
              >
                <option value="">All Categories</option>
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
    </>
  );
}

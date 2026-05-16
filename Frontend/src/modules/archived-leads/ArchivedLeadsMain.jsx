import React, { lazy, Suspense, useCallback, useState } from "react";
import {
  FiArchive,
  FiSearch,
  FiX,
  FiPhone,
  FiMail,
  FiUsers,
  FiBookOpen,
  FiRotateCw,
  FiArrowLeft,
} from "react-icons/fi";
import { useArchivedLeadsStyles } from "./hooks/useArchivedLeadsStyles";
import { useArchivedLeadsController } from "./hooks/useArchivedLeadsController";

const EditLeadForm = lazy(() => import("@modules/leads/modals/EditLeadFormWrapper"));

// Format date like "10 Aug 2025, 20:00"
function formatDateDisplay(dateString) {
  if (!dateString) return "—";
  try {
    const date = new Date(dateString);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${day} ${month} ${year}, ${hours}:${minutes}`;
  } catch (e) {
    return "—";
  }
}
function LeadCard({ lead, onUnarchive, onCardClick }) {
  const formattedName = (lead.name || "").trim();
  const assigneeName = lead.assignee_name || "Unassigned";
  const archivedDate = lead.updated_at || lead.created_at; // Use updated_at as archived date if status is archived
  const createdDate = lead.created_at;
  const courseName = lead.course_name || "Course Not Found";
  const courseId = lead.course_id ? `CRS-${String(lead.course_id).padStart(3, "0")}` : "";
  const mobileNumber = lead.mobile_number ? `${lead.country_code || ""} ${lead.mobile_number}`.trim() : "—";
  const email = lead.email || "Not provided";

  const handleCardClick = () => {
    onCardClick?.(lead);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleCardClick();
        }
      }}
      className="relative bg-white rounded-lg border border-gray-200 shadow-sm group cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500/40"
      style={{
        padding: "12px",
        minHeight: "200px",
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        transform: "translateY(0) scale(1)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-8px) scale(1.02)";
        e.currentTarget.style.boxShadow =
          "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0) scale(1)";
        e.currentTarget.style.boxShadow = "";
      }}
      data-lead-id={lead.lead_id}
    >
      {/* Archived Badge */}
      <div className="absolute top-2 right-2 transition-transform duration-300 group-hover:scale-110">
        <span className="bg-blue-500 text-white text-[9px] font-semibold px-1.5 py-0.5 rounded-full shadow-sm">
          Archived
        </span>
      </div>

      {/* Lead Name */}
      <h3 className="text-sm font-bold text-slate-900 mb-1 pr-14 transition-colors duration-300 group-hover:text-purple-600">
        {formattedName}
      </h3>

      {/* Archived Date */}
      <p className="text-[10px] text-slate-500 mb-2">Archived on {formatDateDisplay(archivedDate)}</p>

      {/* Contact Info */}
      <div className="space-y-1 mb-2">
        <div className="flex items-center gap-1 text-[11px] text-slate-700 transition-colors duration-300 group-hover:text-slate-900">
          <FiPhone className="w-3 h-3 text-slate-500 flex-shrink-0 transition-colors duration-300 group-hover:text-purple-600" />
          <span className="truncate">{mobileNumber}</span>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-slate-700 transition-colors duration-300 group-hover:text-slate-900">
          <FiMail className="w-3 h-3 text-slate-500 flex-shrink-0 transition-colors duration-300 group-hover:text-purple-600" />
          <span className="truncate">{email}</span>
        </div>
      </div>

      {/* Course Info */}
      <div className="flex items-center gap-1 text-[11px] text-slate-700 mb-1 transition-colors duration-300 group-hover:text-slate-900">
        <FiBookOpen className="w-3 h-3 text-slate-500 flex-shrink-0 transition-colors duration-300 group-hover:text-purple-600" />
        <span className="truncate">
          {courseName} {courseId ? `(${courseId})` : ""}
        </span>
      </div>

      {/* Assignee */}
      <div className="flex items-center gap-1 text-[11px] text-slate-700 mb-2 transition-colors duration-300 group-hover:text-slate-900">
        <FiUsers className="w-3 h-3 text-slate-500 flex-shrink-0 transition-colors duration-300 group-hover:text-purple-600" />
        <span className="truncate">{assigneeName}</span>
      </div>

      {/* Created Date */}
      <p className="text-[10px] text-slate-500 mb-2 mt-auto">Created {formatDateDisplay(createdDate)}</p>

      {/* Restore Button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onUnarchive?.(lead);
        }}
        className="w-full bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-medium py-1.5 px-2 rounded-lg flex items-center justify-center gap-1 transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-sm hover:shadow-md group-hover:shadow-lg"
      >
        <FiRotateCw className="w-3 h-3 transition-transform duration-300 group-hover:rotate-180" />
        Restore to Enquiry
      </button>
    </div>
  );
}

export default function ArchivedLeadsMain() {
  useArchivedLeadsStyles();
  const {
    leads,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    filteredLeads,
    handleUnarchive,
    handleRefresh,
    hasActiveFilters,
    navbarSearchQuery,
  } = useArchivedLeadsController();

  const [editOpen, setEditOpen] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState(null);

  const handleCardClick = useCallback((lead) => {
    const leadId = lead?.lead_id ?? lead?.id ?? null;
    if (!leadId) return;
    setSelectedLeadId(leadId);
    setEditOpen(true);
  }, []);

  const handleEditClose = useCallback(() => {
    setEditOpen(false);
    setSelectedLeadId(null);
  }, []);

  const handleEditSaved = useCallback(async () => {
    setEditOpen(false);
    setSelectedLeadId(null);
    await handleRefresh();
  }, [handleRefresh]);

  return (
    <div
      className="archived-leads-container w-full overflow-y-auto bg-slate-50"
      style={{
        height: "100vh",
        scrollbarWidth: "none", /* Firefox */
        msOverflowStyle: "none", /* IE and Edge */
      }}
    >
      <div className="max-w-[1800px] mx-auto space-y-6 p-4 md:p-6 " style={{ paddingBottom: "150px" }}>
        {/* Header Section with Purple Gradient */}
        <div className="px-4 md:px-6">
          <div
            className="rounded-2xl shadow-lg p-6 md:p-8 text-white mx-auto"
            style={{
              background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
              maxWidth: "95%",
            }}
          >
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              <div className="flex-1">
                <h1 className="text-3xl md:text-4xl font-bold mb-3">Archived Leads</h1>
                <p className="text-purple-100 text-sm md:text-base mb-6">
                  Review leads you previously archived and move them back to the Enquiry pipeline whenever
                  they&apos;re ready for a fresh follow-up. Use the filter icon in the top navbar to filter
                  by course, trainer, assignee, and more — same as the dashboard.
                </p>

                <div className="flex flex-wrap items-center gap-4 md:gap-6 mb-6">
                  <div>
                    <p className="text-purple-200 text-xs md:text-sm font-medium mb-1">TOTAL ARCHIVED</p>
                    <p className="text-2xl md:text-3xl font-bold">{leads.length}</p>
                  </div>
                  <div>
                    <p className="text-purple-200 text-xs md:text-sm font-medium mb-1">CURRENTLY SHOWING</p>
                    <p className="text-2xl md:text-3xl font-bold">
                      {loading
                        ? "—"
                        : searchQuery.trim() || navbarSearchQuery.trim() || hasActiveFilters
                          ? filteredLeads.length
                          : leads.length}
                    </p>
                    {hasActiveFilters && (
                      <p className="text-purple-200 text-[10px] md:text-xs mt-1">Navbar filters active</p>
                    )}
                  </div>
                  <button
                    onClick={() => window.history.back()}
                    className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white text-sm font-medium px-4 md:px-5 py-2 md:py-2.5 rounded-lg transition-colors backdrop-blur-sm"
                  >
                    <FiArrowLeft className="w-4 h-4" />
                    Back to pipeline
                  </button>
                </div>
              </div>

              {/* Search Input */}
              <div className="w-full lg:w-72">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 md:pl-4 flex items-center pointer-events-none">
                    <FiSearch className="h-4 w-4 md:h-5 md:w-5 text-purple-300" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name, mobile, course or"
                    className="block w-full pl-10 md:pl-12 pr-4 py-2.5 md:py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg md:rounded-xl text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 text-sm md:text-base"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute inset-y-0 right-0 pr-3 md:pr-4 flex items-center text-purple-200 hover:text-white"
                    >
                      <FiX className="h-4 w-4 md:h-5 md:w-5" />
                    </button>
                  )}
                </div>
                <p className="text-purple-200 text-[10px] md:text-xs mt-1.5 md:mt-2 ml-1">/ Focus search instantly</p>
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600 mb-4"></div>
            <p className="text-slate-600">Loading archived leads...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-2xl shadow-sm p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-red-800 font-semibold">Error Loading Archived Leads</h3>
                <p className="text-red-600 text-sm mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Leads Grid */}
        {!loading && !error && (
          <div>
            {leads.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-12 text-center">
                <div className="inline-block p-4 bg-slate-100 rounded-full mb-4">
                  <FiArchive className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-700 mb-2">No Archived Leads</h3>
                <p className="text-slate-500">There are no archived leads at the moment.</p>
              </div>
            ) : filteredLeads.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-12 text-center">
                <div className="inline-block p-4 bg-slate-100 rounded-full mb-4">
                  <FiSearch className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-700 mb-2">No Results Found</h3>
                <p className="text-slate-500">No archived leads match your search query "{searchQuery}".</p>
                <button
                  onClick={() => setSearchQuery("")}
                  className="mt-4 text-sm text-slate-600 hover:text-slate-900 underline"
                >
                  Clear search
                </button>
              </div>
            ) : (
              <div className="flex justify-center px-4">
                <div className="w-full max-w-[1400px]">
                  <div
                    className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5"
                    style={{ gridAutoRows: "minmax(200px, auto)" }}
                  >
                    {filteredLeads.map((lead, index) => (
                      <div
                        key={lead.lead_id || lead.id}
                        className="flex justify-center"
                        style={{
                          animation: `fadeInUp 0.4s ease-out ${index * 0.05}s both`,
                        }}
                      >
                        <div style={{ width: "100%", maxWidth: "280px" }}>
                          <LeadCard
                            lead={lead}
                            onUnarchive={handleUnarchive}
                            onCardClick={handleCardClick}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {editOpen && selectedLeadId && (
        <Suspense
          fallback={
            <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
            </div>
          }
        >
          <EditLeadForm
            key={String(selectedLeadId)}
            open={editOpen}
            leadId={selectedLeadId}
            onClose={handleEditClose}
            onSaved={handleEditSaved}
          />
        </Suspense>
      )}
    </div>
  );
}

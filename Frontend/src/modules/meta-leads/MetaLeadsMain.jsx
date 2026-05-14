import React from "react";
import { useLocation } from "react-router-dom";
import { getPageColors } from "@shared/utils/pageColors";
import { useMetaLeadsController } from "./hooks/useMetaLeadsController";
import MetaLeadsTopSection from "./components/MetaLeadsTopSection";
import MetaLeadsTable from "./components/MetaLeadsTable";
import MetaLeadDetailsModal from "./components/MetaLeadDetailsModal";

export default function MetaLeadsMain() {
  const location = useLocation();
  const colors = getPageColors(location.pathname);
  const {
    formSummary,
    loading,
    refreshing,
    viewModalOpen,
    setViewModalOpen,
    selectedLead,
    saveLoading,
    editData,
    setEditData,
    searchQuery,
    setSearchQuery,
    filterStatus,
    setFilterStatus,
    selectedFormId,
    setSelectedFormId,
    showFilters,
    setShowFilters,
    statusOptions,
    fetchMetaLeads,
    openViewModal,
    handleSaveEdit,
    updateLeadStatus,
    handleConvert,
    syncHistoricalLeads,
    deleteLead,
    formatDate,
    filteredMetaLeads,
    stats,
  } = useMetaLeadsController();

  return (
    <div className="p-0 md:p-2 bg-gray-50/30 min-h-screen">
      <MetaLeadsTopSection
        stats={stats}
        selectedFormId={selectedFormId}
        setSelectedFormId={setSelectedFormId}
        formSummary={formSummary}
        fetchMetaLeads={fetchMetaLeads}
        refreshing={refreshing}
        loading={loading}
        syncHistoricalLeads={syncHistoricalLeads}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        showFilters={showFilters}
        setShowFilters={setShowFilters}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        statusOptions={statusOptions}
      />

      <MetaLeadsTable loading={loading} filteredMetaLeads={filteredMetaLeads} openViewModal={openViewModal} />

      <MetaLeadDetailsModal
        viewModalOpen={viewModalOpen}
        selectedLead={selectedLead}
        setViewModalOpen={setViewModalOpen}
        colors={colors}
        editData={editData}
        setEditData={setEditData}
        updateLeadStatus={updateLeadStatus}
        statusOptions={statusOptions}
        formatDate={formatDate}
        saveLoading={saveLoading}
        handleSaveEdit={handleSaveEdit}
        handleConvert={handleConvert}
        deleteLead={deleteLead}
      />
    </div>
  );
}

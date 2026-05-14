


import React from 'react';
import { useLeadOverviewController } from "./hooks/useLeadOverviewController";

import LeadListModal from './components/LeadListModal';
import StatCard from "./components/StatCard";
import LeadOverviewFilters from "./components/LeadOverviewFilters";
import LeadOverviewSummary from "./components/LeadOverviewSummary";

export default function PageOverviewMain() {
  const {
    loading,
    fromDate,
    toDate,
    activeQuickFilter,
    isModalOpen,
    setIsModalOpen,
    modalLeads,
    modalStatus,
    modalColor,
    stats,
    totalLeads,
    handleQuickFilter,
    handleDateChange,
    handleResetFilters,
    setFromDate,
    setToDate,
    handleCardClick,
  } = useLeadOverviewController();

  return (
    <div className="h-full w-full overflow-y-auto bg-gray-50/50 no-scrollbar">
      <div className="mx-auto max-w-[1800px]  p-4">
        
        {/* Compact Header Section */}
        <div className="mb-4 flex flex-col gap-3">
          
          <LeadOverviewFilters
            fromDate={fromDate}
            toDate={toDate}
            activeQuickFilter={activeQuickFilter}
            onQuickFilter={handleQuickFilter}
            onFromDateChange={(value) => handleDateChange(setFromDate, value)}
            onToDateChange={(value) => handleDateChange(setToDate, value)}
            onReset={handleResetFilters}
          />

          {/* Row 2: Total Leads & Custom Range */}
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <LeadOverviewSummary totalLeads={totalLeads} />
          </div>
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
              <p className="text-xs font-medium text-gray-500">Loading insights...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {stats.map(({ key, ...item }) => (
              <StatCard 
                key={key}
                {...item} 
                total={totalLeads}
                onClick={() => handleCardClick(key, item.title, item.bgColor)}
              />
            ))}
          </div>
        )}

      <LeadListModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        leads={modalLeads}
        status={modalStatus}
        color={modalColor}
      />
      </div>
    </div>
  );
}

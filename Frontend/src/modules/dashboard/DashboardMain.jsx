import React, { useState, useMemo, useEffect } from "react";
import Swal from "sweetalert2";
import { countDueFollowUps } from "./utils/followUpUtils";
import { DashboardKanbanView } from "./components/DashboardKanbanView";
import { DashboardLeadModals } from "./components/DashboardLeadModals";
import { DashboardLoadingOverlay } from "./components/DashboardLoadingOverlay";
import { DashboardTableView } from "./components/DashboardTableView";
import { DashboardToolbar } from "./components/DashboardToolbar";
import { useDashboardBoard } from "./hooks/useDashboardBoard";
import { useDashboardCardActions } from "./hooks/useDashboardCardActions";
import { useDashboardDnD } from "./hooks/useDashboardDnD";
import {
  useDashboardBodyBackground,
  useDashboardNavbarUndoRedo,
} from "./hooks/useDashboardPageEffects";
import { useDashboardSearch } from "./hooks/useDashboardSearch";
import { useDashboardViewMode } from "./hooks/useDashboardViewMode";

export default function Dashboard({ setNavbarProps }) {
  useDashboardBodyBackground();

  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [columnHoverIndex, setColumnHoverIndex] = useState(null);
  const [scrollStates, setScrollStates] = useState({});
  const [viewMode, setViewMode] = useDashboardViewMode();

  const {
    columns,
    setColumns,
    loading,
    appliedFilters,
    setAppliedFilters,
    loadBoard,
    appliedFiltersRef,
    courses,
  } = useDashboardBoard();

  const {
    searchQuery,
    isSearchActive,
    filteredColumns,
    totalCards,
    visibleCards,
    tableRows,
  } = useDashboardSearch(columns);

  const { onDragEnd, handleUndo, handleRedo } = useDashboardDnD(filteredColumns, setColumns);

  useDashboardNavbarUndoRedo(setNavbarProps, handleUndo, handleRedo);

  const { handleCardClick } = useDashboardCardActions({
    loadBoard,
    appliedFiltersRef,
    setSelectedLead,
    setEditOpen,
  });

  const dueFollowUpCount = useMemo(
    () => countDueFollowUps(filteredColumns),
    [filteredColumns]
  );

  useEffect(() => {
    if (loading || dueFollowUpCount === 0) return;
    const key = `zen_followup_toast_${new Date().toDateString()}`;
    if (typeof sessionStorage !== "undefined" && sessionStorage.getItem(key)) {
      return;
    }
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.setItem(key, "1");
    }
    Swal.fire({
      toast: true,
      position: "top-end",
      icon: "info",
      title: `${dueFollowUpCount} follow-up${dueFollowUpCount !== 1 ? "s" : ""} due`,
      text: "Red border: due today or overdue. Yellow border: follow-up tomorrow.",
      showConfirmButton: false,
      timer: 6000,
      timerProgressBar: true,
    });
  }, [loading, dueFollowUpCount]);

  return (
    <div className="flex w-full flex-col overflow-hidden bg-[#f0f1f5] h-full min-h-0">
      <div className="flex flex-1 w-full flex-col rounded-2xl bg-[#f0f1f5] pb-2 shadow-md overflow-hidden h-full min-h-0">
        <DashboardToolbar
          onAddLead={() => setAddOpen(true)}
          appliedFilters={appliedFilters}
          setAppliedFilters={setAppliedFilters}
          loadBoard={loadBoard}
          isSearchActive={isSearchActive}
          visibleCards={visibleCards}
          totalCards={totalCards}
          searchQuery={searchQuery}
          viewMode={viewMode}
          setViewMode={setViewMode}
          dueFollowUpCount={dueFollowUpCount}
        />
        {viewMode === "cards" ? (
          <DashboardKanbanView
            filteredColumns={filteredColumns}
            columnHoverIndex={columnHoverIndex}
            setColumnHoverIndex={setColumnHoverIndex}
            scrollStates={scrollStates}
            setScrollStates={setScrollStates}
            onDragEnd={onDragEnd}
            handleCardClick={handleCardClick}
          />
        ) : (
          <DashboardTableView tableRows={tableRows} onRowClick={handleCardClick} />
        )}
      </div>

      <DashboardLoadingOverlay loading={loading} />

      <DashboardLeadModals
        addOpen={addOpen}
        editOpen={editOpen}
        setAddOpen={setAddOpen}
        setEditOpen={setEditOpen}
        loadBoard={loadBoard}
        appliedFiltersRef={appliedFiltersRef}
        courses={courses}
        selectedLead={selectedLead}
      />
    </div>
  );
}

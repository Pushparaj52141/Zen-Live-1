import React, { lazy, Suspense } from "react";

const AddLeadModal = lazy(() => import("@modules/leads/modals/AddLeadModal.jsx"));
const EditLeadForm = lazy(() => import("@modules/leads/modals/EditLeadFormWrapper"));

export function DashboardLeadModals({
  addOpen,
  editOpen,
  setAddOpen,
  setEditOpen,
  loadBoard,
  appliedFiltersRef,
  courses,
  selectedLead,
}) {
  const selectedLeadId = selectedLead?.lead_id ?? selectedLead?.id ?? null;

  return (
    <>
      {addOpen && (
        <Suspense
          fallback={
            <div className=" fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
            </div>
          }
        >
          <AddLeadModal
            open={addOpen}
            onClose={() => setAddOpen(false)}
            onSaved={async () => {
              await loadBoard(appliedFiltersRef.current);
              setAddOpen(false);
            }}
            courses={courses}
          />
        </Suspense>
      )}

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
            onClose={() => setEditOpen(false)}
            onSaved={async () => {
              await loadBoard(appliedFiltersRef.current);
              setEditOpen(false);
            }}
          />
        </Suspense>
      )}
    </>
  );
}

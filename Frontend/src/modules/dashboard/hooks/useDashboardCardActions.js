import { useCallback } from "react";
import { dashboardService } from "../services/dashboardService";

const loadSwal = () => import("sweetalert2");

export function useDashboardCardActions({
  loadBoard,
  appliedFiltersRef,
  setSelectedLead,
  setEditOpen,
}) {
  const resolveLeadId = useCallback(
    (lead) => lead?.lead_id ?? lead?.id ?? null,
    []
  );

  const handleCardClick = useCallback(
    async (lead) => {
      const leadId = resolveLeadId(lead);
      if (String(leadId).startsWith("meta_")) {
        const swal = await loadSwal();
        const metaId = String(leadId).replace("meta_", "");

        const result = await swal.default.fire({
          title: "Convert Meta Lead?",
          text: `Would you like to convert "${lead.name}" into a CRM lead for full processing?`,
          icon: "question",
          showCancelButton: true,
          confirmButtonColor: "#4f46e5",
          cancelButtonColor: "#64748b",
          confirmButtonText: "Yes, Convert Now",
          cancelButtonText: "Maybe Later",
          showLoaderOnConfirm: true,
          preConfirm: async () => {
            try {
              const res = await dashboardService.convertMetaLead(metaId);
              return res.data;
            } catch (error) {
              swal.default.showValidationMessage(`Request failed: ${error.message}`);
            }
          },
          allowOutsideClick: () => !swal.default.isLoading(),
        });

        if (result.isConfirmed && result.value?.success) {
          await swal.default.fire({
            title: "Success!",
            text: "Lead has been converted and added to the CRM.",
            icon: "success",
            timer: 1500,
            showConfirmButton: false,
          });

          await loadBoard(appliedFiltersRef.current);

          if (result.value.lead_id) {
            setSelectedLead({ lead_id: result.value.lead_id });
            setEditOpen(true);
          }
        }
        return;
      }

      if (!leadId) {
        return;
      }

      setSelectedLead({
        ...lead,
        lead_id: leadId,
      });
      setEditOpen(true);
    },
    [loadBoard, appliedFiltersRef, resolveLeadId, setSelectedLead, setEditOpen]
  );

  return { handleCardClick };
}

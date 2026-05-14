import { useCallback, useState } from "react";
import { handleCardDrop } from "@modules/leads/utils/leadBoardUtils";

const loadSwal = () => import("sweetalert2");

export function useDashboardDnD(filteredColumns, setColumns) {
  const [history, setHistory] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

  const onDragEnd = useCallback(
    async (result) => {
      const { destination, source, draggableId } = result;

      if (!destination) return;
      if (
        destination.droppableId === source.droppableId &&
        destination.index === source.index
      ) {
        return;
      }

      setColumns((prevColumns) => {
        const sourceColIdx = prevColumns.findIndex((c) => c.key === source.droppableId);
        const destColIdx = prevColumns.findIndex((c) => c.key === destination.droppableId);
        if (sourceColIdx === -1 || destColIdx === -1) return prevColumns;

        const sourceLeads = prevColumns[sourceColIdx].leads;
        const movedLeadIndex = sourceLeads.findIndex((l) => String(l.lead_id) === draggableId);

        if (movedLeadIndex === -1) {
          return prevColumns;
        }

        const movedLead = sourceLeads[movedLeadIndex];

        const destColFiltered = filteredColumns.find((c) => c.key === destination.droppableId);
        const leadsInDestFiltered = destColFiltered ? destColFiltered.leads : [];

        let insertIndex = -1;

        if (destination.index >= leadsInDestFiltered.length) {
          insertIndex = prevColumns[destColIdx].leads.length;
        } else {
          const targetLead = leadsInDestFiltered[destination.index];
          if (targetLead) {
            const targetIndex = prevColumns[destColIdx].leads.findIndex(
              (l) => String(l.lead_id) === String(targetLead.lead_id)
            );
            insertIndex = targetIndex !== -1 ? targetIndex : prevColumns[destColIdx].leads.length;
          } else {
            insertIndex = prevColumns[destColIdx].leads.length;
          }
        }

        const nextColumns = prevColumns.map((col) => ({
          ...col,
          leads: [...col.leads],
        }));

        nextColumns[sourceColIdx].leads.splice(movedLeadIndex, 1);

        let finalInsertIndex = insertIndex;
        if (sourceColIdx === destColIdx) {
          if (movedLeadIndex < finalInsertIndex) {
            finalInsertIndex -= 1;
          }
        }

        nextColumns[destColIdx].leads.splice(finalInsertIndex, 0, {
          ...movedLead,
          status: nextColumns[destColIdx].key,
        });

        setHistory((h) => [...h, prevColumns]);
        setRedoStack([]);

        loadSwal().then(({ default: Swal }) => {
          Swal.fire({
            icon: "success",
            title: "Lead moved",
            text: `Moved to ${nextColumns[destColIdx].title}.`,
            timer: 1000,
            showConfirmButton: false,
            position: "center",
            toast: false,
          });
        });

        handleCardDrop(movedLead.lead_id, nextColumns[destColIdx].key).catch(() => {
          setColumns(prevColumns);
        });

        return nextColumns;
      });
    },
    [filteredColumns, setColumns]
  );

  const handleUndo = useCallback(() => {
    if (history.length === 0) return false;

    setColumns((currentColumns) => {
      setHistory((h) => {
        if (h.length === 0) return h;
        setRedoStack((r) => [currentColumns, ...r]);
        return h.slice(0, -1);
      });
      return history[history.length - 1];
    });
    return true;
  }, [history, setColumns]);

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return false;

    setColumns((currentColumns) => {
      setHistory((h) => [...h, currentColumns]);
      const next = redoStack[0];
      setRedoStack((r) => r.slice(1));
      return next;
    });
    return true;
  }, [redoStack, setColumns]);

  return {
    onDragEnd,
    handleUndo,
    handleRedo,
    history,
    redoStack,
  };
}

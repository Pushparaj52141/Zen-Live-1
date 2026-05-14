import React from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import DashboardLeadCard from "./DashboardLeadCard";
import LeadColumnHeader from "./LeadColumnHeader";

export function DashboardKanbanView({
  filteredColumns,
  columnHoverIndex,
  setColumnHoverIndex,
  scrollStates,
  setScrollStates,
  onDragEnd,
  handleCardClick,
}) {
  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex-1 w-full relative min-h-0 bg-[#f0f1f5]">
        <div
          className="absolute inset-0 overflow-x-auto overflow-y-hidden custom-scrollbar px-4 pr-10 pb-4 flex flex-row flex-nowrap gap-6 items-start"
          id="dashboard-scroller"
        >
          {filteredColumns.map((col, colIdx) => {
            const isColumnHovered = columnHoverIndex === colIdx;

            return (
              <Droppable droppableId={col.key} key={col.key}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="flex h-full min-h-0 w-[226px] min-w-[226px] flex-col flex-none"
                    onMouseEnter={() => setColumnHoverIndex(colIdx)}
                    onMouseLeave={() => setColumnHoverIndex(null)}
                  >
                    <LeadColumnHeader
                      title={col.title}
                      color={col.color}
                      count={col.leads?.length}
                      isScrolled={scrollStates[col.key] || false}
                    />
                    <div
                      className="custom-scrollbar flex-1 min-h-0 h-full w-[226px] min-w-[226px] overflow-y-auto overflow-x-hidden pl-[1px] pr-[1px] rounded-md bg-transparent"
                      onScroll={(e) => {
                        const isScrolled = e.target.scrollTop > 0;
                        setScrollStates((prev) => ({
                          ...prev,
                          [col.key]: isScrolled,
                        }));
                      }}
                    >
                      {(col.leads || []).map((lead, idx) => (
                        <Draggable
                          key={lead.lead_id}
                          draggableId={String(lead.lead_id)}
                          index={idx}
                        >
                          {(dragProvided) => (
                            <div
                              ref={dragProvided.innerRef}
                              {...dragProvided.draggableProps}
                              {...dragProvided.dragHandleProps}
                              className="mb-3"
                            >
                              <DashboardLeadCard
                                lead={lead}
                                onClick={handleCardClick}
                                isColumnHovered={isColumnHovered}
                              />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  </div>
                )}
              </Droppable>
            );
          })}
        </div>
      </div>
    </DragDropContext>
  );
}

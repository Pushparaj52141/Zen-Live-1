import React, { useEffect, useState } from "react";
import { MdAdd } from "react-icons/md";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

export default function TasksView({
  tasks,
  loading,
  title,
  showFilters,
  filters,
  onFilterChange,
  projects = [],
  onAddTask,
  onEditTask,
  getPriorityColor,
  getStatusColor,
  onDragEnd,
}) {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const animation = requestAnimationFrame(() => setEnabled(true));
    return () => {
      cancelAnimationFrame(animation);
      setEnabled(false);
    };
  }, []);

  if (!enabled) return null;

  const groupedTasks = {
    in_progress: tasks.filter((t) => t.status === "in_progress"),
    review: tasks.filter((t) => t.status === "review"),
    completed: tasks.filter((t) => t.status === "completed"),
  };

  return (
    <div className="tasks-view">
      <div className="view-header">
        <h2>{title}</h2>
        <button className="btn-primary" onClick={onAddTask}>
          <MdAdd /> Add Task
        </button>
      </div>

      {showFilters && (
        <div className="filters-bar">
          <select value={filters.project_id} onChange={(e) => onFilterChange({ ...filters, project_id: e.target.value })}>
            <option value="">All Projects</option>
            {projects.map((p) => (
              <option key={p.project_id} value={p.project_id}>
                {p.project_name}
              </option>
            ))}
          </select>
          <select value={filters.status} onChange={(e) => onFilterChange({ ...filters, status: e.target.value })}>
            <option value="">All Status</option>
            <option value="in_progress">In Progress</option>
            <option value="review">Review</option>
            <option value="completed">Completed</option>
          </select>
          <select value={filters.priority} onChange={(e) => onFilterChange({ ...filters, priority: e.target.value })}>
            <option value="">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
      )}

      {loading ? (
        <div className="loading-state">Loading tasks...</div>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="kanban-board">
            {Object.entries(groupedTasks).map(([status, statusTasks]) => (
              <div key={status} className="kanban-column">
                <div className="column-header" style={{ borderTopColor: getStatusColor(status) }}>
                  <h3>{status.replace("_", " ").toUpperCase()}</h3>
                  <span className="task-count">{statusTasks.length}</span>
                </div>
                <Droppable droppableId={status}>
                  {(provided, snapshot) => (
                    <div
                      className={`tasks-list ${snapshot.isDraggingOver ? "dragging-over" : ""}`}
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                    >
                      {statusTasks.map((task, index) => (
                        <Draggable key={String(task.task_id)} draggableId={String(task.task_id)} index={index}>
                          {(dragProvided, dragSnapshot) => (
                            <div
                              className={`task-card ${dragSnapshot.isDragging ? "dragging" : ""}`}
                              onClick={() => onEditTask(task)}
                              ref={dragProvided.innerRef}
                              {...dragProvided.draggableProps}
                              {...dragProvided.dragHandleProps}
                              style={{ ...dragProvided.draggableProps.style }}
                            >
                              <div className="task-header">
                                <span className="priority-badge" style={{ backgroundColor: getPriorityColor(task.priority) }}>
                                  {task.priority}
                                </span>
                              </div>
                              <h4 className="task-title">{task.task_title}</h4>
                              {task.task_description && (
                                <p className="task-description">{task.task_description.substring(0, 80)}...</p>
                              )}
                              <div className="task-meta">
                                {task.project_name && <span className="project-tag">{task.project_name}</span>}
                                {task.assigned_to_name && <span className="assignee">{task.assigned_to_name}</span>}
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </DragDropContext>
      )}
    </div>
  );
}

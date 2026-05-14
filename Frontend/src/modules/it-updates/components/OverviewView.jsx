import React from "react";
import { MdEdit, MdRefresh } from "react-icons/md";

export default function OverviewView({
  tasks,
  users,
  projects,
  loading,
  filters,
  onFilterChange,
  onRefresh,
  onEditTask,
}) {
  return (
    <div className="overview-view">
      <div className="view-header">
        <h2>Tasks Overview</h2>
        <div className="header-actions">
          <button className="btn-refresh" onClick={onRefresh}>
            <MdRefresh /> Refresh
          </button>
        </div>
      </div>

      <div className="filters-bar">
        <div className="filter-group">
          <label>Date:</label>
          <input type="date" value={filters.task_date} onChange={(e) => onFilterChange({ ...filters, task_date: e.target.value })} />
        </div>
        <div className="filter-group">
          <label>Developer:</label>
          <select value={filters.assigned_to} onChange={(e) => onFilterChange({ ...filters, assigned_to: e.target.value })}>
            <option value="">All Developers</option>
            {users.filter((u) => u.is_it_developer).map((u) => (
              <option key={u.user_id} value={u.user_id}>
                {u.username}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label>Project:</label>
          <select value={filters.project_id} onChange={(e) => onFilterChange({ ...filters, project_id: e.target.value })}>
            <option value="">All Projects</option>
            {projects.map((p) => (
              <option key={p.project_id} value={p.project_id}>
                {p.project_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">Loading overview...</div>
      ) : (
        <div className="table-container">
          <table className="overview-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Project</th>
                <th>Task Title</th>
                <th>Assigned To</th>
                <th>Assigned By</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tasks.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center", padding: "24px" }}>
                    No tasks found for the selected filters.
                  </td>
                </tr>
              ) : (
                tasks.map((task) => (
                  <tr key={task.task_id}>
                    <td>{new Date(task.task_date).toLocaleDateString()}</td>
                    <td><span className="project-tag">{task.project_name}</span></td>
                    <td className="task-title-cell">{task.task_title}</td>
                    <td>{task.assigned_to_name}</td>
                    <td>{task.assigned_by_name}</td>
                    <td>
                      <span className="status-badge">{String(task.status || "").replace("_", " ").toUpperCase()}</span>
                    </td>
                    <td>
                      <button className="btn-icon" onClick={() => onEditTask(task)}>
                        <MdEdit />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

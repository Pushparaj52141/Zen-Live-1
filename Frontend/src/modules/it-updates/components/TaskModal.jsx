import React, { useState } from "react";

export default function TaskModal({ task, projects, users, onClose, onSave }) {
  const [formData, setFormData] = useState({
    project_id: task?.project_id || "",
    assigned_to: task?.assigned_to || "",
    assigned_by: task?.assigned_by || "",
    task_title: task?.task_title || "",
    task_description: task?.task_description || "",
    priority: task?.priority || "medium",
    status: task?.status || "in_progress",
    task_date: task?.task_date ? task.task_date.split("T")[0] : new Date().toISOString().split("T")[0],
    due_date: task?.due_date ? task.due_date.split("T")[0] : "",
  });

  const devUsers = users.filter((u) => u.is_it_developer);
  const managerUsers = users.filter((u) => u.is_it_manager);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{task ? "Edit Task" : "New Task"}</h2>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Task Title *</label>
            <input type="text" required value={formData.task_title} onChange={(e) => setFormData({ ...formData, task_title: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Project</label>
            <select value={formData.project_id} onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}>
              <option value="">Select Project</option>
              {projects.map((p) => (
                <option key={p.project_id} value={p.project_id}>{p.project_name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Assign To</label>
            <select value={formData.assigned_to} onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}>
              <option value="">Select Developer</option>
              {devUsers.map((u) => (
                <option key={u.user_id} value={u.user_id}>{u.username}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Assigned By</label>
            <select value={formData.assigned_by} onChange={(e) => setFormData({ ...formData, assigned_by: e.target.value })}>
              <option value="">Select User</option>
              {managerUsers.map((u) => (
                <option key={u.user_id} value={u.user_id}>{u.username}</option>
              ))}
            </select>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}

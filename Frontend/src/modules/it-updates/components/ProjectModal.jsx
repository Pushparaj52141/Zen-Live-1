import React, { useState } from "react";

export default function ProjectModal({ project, onClose, onSave }) {
  const [formData, setFormData] = useState({
    project_name: project?.project_name || "",
    project_code: project?.project_code || "",
    description: project?.description || "",
    status: project?.status || "active",
    priority: project?.priority || "medium",
    start_date: project?.start_date || "",
    end_date: project?.end_date || "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{project ? "Edit Project" : "New Project"}</h2>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Project Name *</label>
            <input type="text" required value={formData.project_name} onChange={(e) => setFormData({ ...formData, project_name: e.target.value })} />
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

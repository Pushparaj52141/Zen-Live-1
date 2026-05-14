import React from "react";
import { MdAdd } from "react-icons/md";

export default function ProjectsView({ projects, onAddProject, onEditProject, getPriorityColor, getStatusColor }) {
  return (
    <div className="projects-view">
      <div className="view-header">
        <h2>Projects</h2>
        <button className="btn-primary" onClick={onAddProject}>
          <MdAdd /> Add Project
        </button>
      </div>
      <div className="projects-list-grid">
        {projects.map((project) => (
          <div key={project.project_id} className="project-list-card" onClick={() => onEditProject(project)}>
            <div className="project-list-header">
              <h3>{project.project_name}</h3>
              <div className="badges">
                <span className="badge" style={{ backgroundColor: getStatusColor(project.status) }}>{project.status}</span>
                <span className="badge" style={{ backgroundColor: getPriorityColor(project.priority) }}>{project.priority}</span>
              </div>
            </div>
            {project.project_code && <div className="project-code">Code: {project.project_code}</div>}
            {project.description && <p className="project-description">{project.description}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

import React from "react";
import { API_BASE_URL } from "@shared/api/client";

export default function DashboardView({ data, teamOverview, loading, getPriorityColor }) {
  if (loading || !data) {
    return <div className="loading-state">Loading dashboard...</div>;
  }

  const stats = data.stats || { active_projects: 0, completed_tasks: 0 };
  const projects = Array.isArray(data.projects) ? data.projects : [];
  const teamActivity = Array.isArray(data.teamActivity) ? data.teamActivity : [];

  return (
    <div className="dashboard-view">
      <div className="stats-grid">
        <div className="stat-card" style={{ borderLeftColor: "#10b981" }}>
          <div className="stat-value">{stats.active_projects || 0}</div>
          <div className="stat-label">Active Projects</div>
        </div>
        <div className="stat-card" style={{ borderLeftColor: "#10b981" }}>
          <div className="stat-value">{stats.completed_tasks || 0}</div>
          <div className="stat-label">Completed Tasks Today</div>
        </div>
      </div>

      <div className="section-header">
        <h2>Project Progress</h2>
      </div>
      <div className="projects-grid">
        {projects.length === 0 ? (
          <div className="empty-state">No active projects found.</div>
        ) : (
          projects.map((project) => (
            <div key={project.project_id} className="project-card">
              <div className="project-card-header">
                <h3>{project.project_name}</h3>
                <span className="badge" style={{ backgroundColor: getPriorityColor(project.priority) }}>
                  {project.priority}
                </span>
              </div>
              <div className="project-progress">
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${project.completion_percentage || 0}%`, backgroundColor: "#10b981" }}
                  />
                </div>
                <span className="progress-text">{project.completion_percentage || 0}%</span>
              </div>
              <div className="project-stats">
                <span>{project.completed_tasks || 0} / {project.total_tasks || 0} tasks</span>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="section-header">
        <h2>Team Activity</h2>
      </div>
      <div className="team-grid">
        {teamActivity.length === 0 ? (
          <div className="empty-state">No team activity found today.</div>
        ) : (
          teamActivity.map((member) => {
            const username = member.username || "User";
            const initial = username.charAt(0).toUpperCase();
            const hasImage =
              member.profile_image &&
              member.profile_image !== "null" &&
              typeof member.profile_image === "string" &&
              member.profile_image.trim() !== "";
            const imageSrc = member.profile_image?.startsWith("http")
              ? member.profile_image
              : `${API_BASE_URL.replace(/\/$/, "")}/${String(member.profile_image || "")
                  .replace(/\\/g, "/")
                  .replace(/^\//, "")}`;

            return (
              <div key={member.user_id} className="team-member-card">
                <div className="team-member-info">
                  <div className="avatar">
                    {hasImage ? (
                      <img
                        src={imageSrc}
                        alt={username}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="avatar-placeholder">{initial}</div>
                    )}
                  </div>
                  <div>
                    <div className="team-member-name">{username}</div>
                    <div className="team-member-stats">
                      <span className="stat-badge in-progress">{member.in_progress_count || 0} in progress</span>
                      <span className="stat-badge completed">{member.completed_today || 0} done today</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

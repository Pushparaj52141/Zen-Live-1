import { MdDashboard, MdTask, MdFolder, MdFilterList } from "react-icons/md";

export const IT_UPDATES_TABS = [
  { id: "dashboard", label: "Dashboard", Icon: MdDashboard },
  { id: "mytasks", label: "My Tasks", Icon: MdTask },
  { id: "alltasks", label: "All Tasks", Icon: MdTask },
  { id: "projects", label: "Projects", Icon: MdFolder },
  { id: "overview", label: "Overview", Icon: MdFilterList },
];

export const getPriorityColor = (priority) => {
  const colors = {
    low: "#10b981",
    medium: "#f59e0b",
    high: "#f97316",
    critical: "#ef4444",
  };
  return colors[priority] || "#6b7280";
};

export const getStatusColor = (status) => {
  const colors = {
    in_progress: "#3b82f6",
    review: "#8b5cf6",
    completed: "#10b981",
    active: "#10b981",
    on_hold: "#f59e0b",
    archived: "#6b7280",
  };
  return colors[status] || "#6b7280";
};

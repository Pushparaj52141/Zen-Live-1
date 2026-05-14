import { MdRefresh } from "react-icons/md";
import { itUpdatesService } from "./services/itUpdatesService";
import { useITUpdatesController } from "./hooks/useITUpdatesController";
import {
  IT_UPDATES_TABS,
  getPriorityColor,
  getStatusColor,
} from "./constants/itUpdatesConstants";
import DashboardView from "./components/DashboardView";
import OverviewView from "./components/OverviewView";
import ProjectModal from "./components/ProjectModal";
import ProjectsView from "./components/ProjectsView";
import TaskModal from "./components/TaskModal";
import TasksView from "./components/TasksView";
import "./ITUpdatesMain.css";

export default function ITUpdatesMain() {
  const {
    activeTab,
    setActiveTab,
    loading,
    dashboardData,
    projects,
    tasks,
    teamOverview,
    showProjectModal,
    setShowProjectModal,
    showTaskModal,
    setShowTaskModal,
    editingItem,
    setEditingItem,
    taskFilters,
    setTaskFilters,
    fetchProjects,
    fetchTasks,
    handleRefresh,
    handleTaskDragEnd,
  } = useITUpdatesController();

  return (
    <div className="it-updates-container">
      <div className="it-updates-header">
        <div>
          <h1 className="it-updates-title">IT Updates</h1>
          <p className="it-updates-subtitle">
            Track tasks, projects, and daily progress
          </p>
        </div>
        <button className="btn-refresh" onClick={handleRefresh}>
          <MdRefresh /> Refresh
        </button>
      </div>

      <div className="it-updates-tabs">
        {IT_UPDATES_TABS.map((tab) => {
          const Icon = tab.Icon;
          return (
            <button
              key={tab.id}
              className={`tab-button ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <div className="it-updates-content">
        {activeTab === "dashboard" && (
          <DashboardView
            data={dashboardData}
            teamOverview={teamOverview}
            loading={loading}
            getPriorityColor={getPriorityColor}
          />
        )}
        {activeTab === "mytasks" && (
          <TasksView
            tasks={tasks}
            loading={loading}
            title="My Tasks"
            onAddTask={() => {
              setEditingItem(null);
              setShowTaskModal(true);
            }}
            onEditTask={(task) => {
              setEditingItem(task);
              setShowTaskModal(true);
            }}
            getPriorityColor={getPriorityColor}
            getStatusColor={getStatusColor}
            onDragEnd={handleTaskDragEnd}
          />
        )}
        {activeTab === "alltasks" && (
          <TasksView
            tasks={tasks}
            loading={loading}
            title="All Tasks"
            showFilters
            filters={taskFilters}
            onFilterChange={setTaskFilters}
            projects={projects}
            onAddTask={() => {
              setEditingItem(null);
              setShowTaskModal(true);
            }}
            onEditTask={(task) => {
              setEditingItem(task);
              setShowTaskModal(true);
            }}
            getPriorityColor={getPriorityColor}
            getStatusColor={getStatusColor}
            onDragEnd={handleTaskDragEnd}
          />
        )}
        {activeTab === "projects" && (
          <ProjectsView
            projects={projects}
            onAddProject={() => {
              setEditingItem(null);
              setShowProjectModal(true);
            }}
            onEditProject={(project) => {
              setEditingItem(project);
              setShowProjectModal(true);
            }}
            getPriorityColor={getPriorityColor}
            getStatusColor={getStatusColor}
          />
        )}
        {activeTab === "overview" && (
          <OverviewView
            tasks={tasks}
            users={teamOverview}
            projects={projects}
            loading={loading}
            filters={taskFilters}
            onFilterChange={setTaskFilters}
            onRefresh={() => fetchTasks(taskFilters)}
            onEditTask={(task) => {
              setEditingItem(task);
              setShowTaskModal(true);
            }}
          />
        )}
      </div>

      {showProjectModal && (
        <ProjectModal
          project={editingItem}
          onClose={() => {
            setShowProjectModal(false);
            setEditingItem(null);
          }}
          onSave={(data) => {
            if (editingItem) {
              itUpdatesService.updateProject(editingItem.project_id, data).then(() => {
                fetchProjects();
                setShowProjectModal(false);
                setEditingItem(null);
              });
            } else {
              itUpdatesService.createProject(data).then(() => {
                fetchProjects();
                setShowProjectModal(false);
              });
            }
          }}
        />
      )}

      {showTaskModal && (
        <TaskModal
          task={editingItem}
          projects={projects}
          users={teamOverview}
          onClose={() => {
            setShowTaskModal(false);
            setEditingItem(null);
          }}
          onSave={(data) => {
            if (editingItem) {
              itUpdatesService.updateTask(editingItem.task_id, data).then(() => {
                handleRefresh();
                setShowTaskModal(false);
                setEditingItem(null);
              });
            } else {
              itUpdatesService.createTask(data).then(() => {
                handleRefresh();
                setShowTaskModal(false);
              });
            }
          }}
        />
      )}
    </div>
  );
}

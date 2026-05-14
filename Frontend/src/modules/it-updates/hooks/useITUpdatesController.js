import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { itUpdatesService } from "../services/itUpdatesService";

export function useITUpdatesController() {
  const currentUser = useSelector((state) => state.auth.user || {});
  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [teamOverview, setTeamOverview] = useState([]);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [taskFilters, setTaskFilters] = useState({
    project_id: "",
    assigned_to: "",
    status: "",
    priority: "",
    task_date: "",
  });

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await itUpdatesService.getDashboardStats();
      setDashboardData(response.data);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await itUpdatesService.getProjects();
      setProjects(response.data);
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };

  const fetchTasks = async (filters = {}) => {
    try {
      setLoading(true);
      const response = await itUpdatesService.getTasks(filters);
      setTasks(response.data);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamOverview = async () => {
    try {
      const response = await itUpdatesService.getTeamOverview();
      setTeamOverview(response.data);
    } catch (error) {
      console.error("Error fetching team overview:", error);
    }
  };

  useEffect(() => {
    if (activeTab === "dashboard") {
      fetchDashboardData();
      fetchTeamOverview();
    } else if (activeTab === "projects") {
      fetchProjects();
    } else if (activeTab === "mytasks") {
      fetchTasks({ assigned_to: currentUser.user_id });
    } else if (activeTab === "alltasks" || activeTab === "overview") {
      fetchTasks(taskFilters);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, taskFilters, currentUser?.user_id]);

  useEffect(() => {
    fetchProjects();
    fetchTeamOverview();
  }, []);

  const handleRefresh = () => {
    if (activeTab === "dashboard") fetchDashboardData();
    else if (activeTab === "projects") fetchProjects();
    else if (activeTab === "mytasks")
      fetchTasks({ assigned_to: currentUser.user_id });
    else if (activeTab === "alltasks") fetchTasks(taskFilters);
    else if (activeTab === "overview") fetchTasks(taskFilters);
  };

  const handleTaskDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const newStatus = destination.droppableId;
    const taskId = draggableId;

    try {
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.task_id.toString() === taskId
            ? { ...task, status: newStatus }
            : task
        )
      );
      await itUpdatesService.updateTask(taskId, { status: newStatus });
    } catch (error) {
      console.error("Error updating task status via drag and drop:", error);
    }
  };

  return {
    currentUser,
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
  };
}


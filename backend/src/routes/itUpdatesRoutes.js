const express = require("express");
const router = express.Router();
const {
    getProjects,
    createProject,
    updateProject,
    deleteProject,
    getTasks,
    createTask,
    updateTask,
    deleteTask,
    getTaskComments,
    addTaskComment,
    getDashboardStats,
    getTeamOverview
} = require("../controllers/itUpdatesController");
const { authenticateToken } = require("../middlewares/authMiddleware");

// All routes require authentication
router.use(authenticateToken);

// ============ PROJECT ROUTES ============
router.get("/projects", getProjects);
router.post("/projects", createProject);
router.put("/projects/:id", updateProject);
router.delete("/projects/:id", deleteProject);

// ============ TASK ROUTES ============
router.get("/tasks", getTasks);
router.post("/tasks", createTask);
router.put("/tasks/:id", updateTask);
router.delete("/tasks/:id", deleteTask);

// ============ TASK COMMENT ROUTES ============
router.get("/tasks/:taskId/comments", getTaskComments);
router.post("/tasks/:taskId/comments", addTaskComment);

// ============ DASHBOARD ROUTES ============
router.get("/dashboard/stats", getDashboardStats);
router.get("/team-overview", getTeamOverview);

module.exports = router;

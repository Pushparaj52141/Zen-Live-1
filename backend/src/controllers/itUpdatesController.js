const pool = require("../config/db");

// ============ PROJECTS ============

// Get all projects
const getProjects = async (req, res) => {
    try {
        const { status } = req.query;

        let query = `
      SELECT 
        p.*,
        COUNT(DISTINCT t.task_id) as total_tasks,
        COUNT(DISTINCT CASE WHEN t.status = 'completed' THEN t.task_id END) as completed_tasks
      FROM it_projects p
      LEFT JOIN it_tasks t ON p.project_id = t.project_id
    `;

        const params = [];
        if (status) {
            query += ` WHERE p.status = $1`;
            params.push(status);
        }

        query += `
      GROUP BY p.project_id
      ORDER BY p.created_at DESC
    `;

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching projects:", error);
        res.status(500).json({ error: "Failed to fetch projects" });
    }
};

// Create project
const createProject = async (req, res) => {
    try {
        const {
            project_name,
            project_code,
            description,
            status,
            start_date,
            end_date,
            priority
        } = req.body;

        if (!project_name) {
            return res.status(400).json({ error: "Project name is required" });
        }

        const result = await pool.query(
            `INSERT INTO it_projects 
        (project_name, project_code, description, status, start_date, end_date, priority)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
            [project_name, project_code, description, status || 'active', start_date, end_date, priority || 'medium']
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error("Error creating project:", error);
        if (error.code === '23505') { // Unique violation
            return res.status(400).json({ error: "Project code already exists" });
        }
        res.status(500).json({ error: "Failed to create project" });
    }
};

// Update project
const updateProject = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            project_name,
            project_code,
            description,
            status,
            start_date,
            end_date,
            priority
        } = req.body;

        const result = await pool.query(
            `UPDATE it_projects 
       SET project_name = COALESCE($1, project_name),
           project_code = COALESCE($2, project_code),
           description = COALESCE($3, description),
           status = COALESCE($4, status),
           start_date = COALESCE($5, start_date),
           end_date = COALESCE($6, end_date),
           priority = COALESCE($7, priority),
           updated_at = CURRENT_TIMESTAMP
       WHERE project_id = $8
       RETURNING *`,
            [project_name, project_code, description, status, start_date, end_date, priority, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Project not found" });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error("Error updating project:", error);
        res.status(500).json({ error: "Failed to update project" });
    }
};

// Delete project
const deleteProject = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            "DELETE FROM it_projects WHERE project_id = $1 RETURNING *",
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Project not found" });
        }

        res.json({ message: "Project deleted successfully" });
    } catch (error) {
        console.error("Error deleting project:", error);
        res.status(500).json({ error: "Failed to delete project" });
    }
};

// ============ TASKS ============

// Get tasks with filters
const getTasks = async (req, res) => {
    try {
        const { project_id, assigned_to, status, priority, from_date, to_date } = req.query;

        let query = `
      SELECT 
        t.*,
        p.project_name,
        p.project_code,
        u.username as assigned_to_name,
        u.profile_image as assigned_to_image,
        assigner.username as assigned_by_name,
        creator.username as created_by_name,
        COUNT(DISTINCT c.comment_id) as comment_count
      FROM it_tasks t
      LEFT JOIN it_projects p ON t.project_id = p.project_id
      LEFT JOIN users u ON t.assigned_to = u.user_id
      LEFT JOIN users assigner ON t.assigned_by = assigner.user_id
      LEFT JOIN users creator ON t.created_by = creator.user_id
      LEFT JOIN task_comments c ON t.task_id = c.task_id
      WHERE 1=1
    `;

        const params = [];
        let paramCount = 1;

        if (project_id) {
            query += ` AND t.project_id = $${paramCount}`;
            params.push(project_id);
            paramCount++;
        }

        if (assigned_to) {
            query += ` AND t.assigned_to = $${paramCount}`;
            params.push(assigned_to);
            paramCount++;
        }

        if (status) {
            query += ` AND t.status = $${paramCount}`;
            params.push(status);
            paramCount++;
        }

        if (priority) {
            query += ` AND t.priority = $${paramCount}`;
            params.push(priority);
            paramCount++;
        }

        if (from_date) {
            query += ` AND t.created_at >= $${paramCount}`;
            params.push(from_date);
            paramCount++;
        }

        if (to_date) {
            query += ` AND t.created_at <= $${paramCount}`;
            params.push(to_date);
            paramCount++;
        }

        if (req.query.task_date) {
            query += ` AND t.task_date = $${paramCount}`;
            params.push(req.query.task_date);
            paramCount++;
        }

        query += `
      GROUP BY t.task_id, p.project_name, p.project_code, u.username, u.profile_image, assigner.username, creator.username
      ORDER BY t.created_at DESC
    `;

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching tasks:", error);
        res.status(500).json({ error: "Failed to fetch tasks" });
    }
};

// Create task
const createTask = async (req, res) => {
    try {
        const {
            project_id,
            assigned_to,
            assigned_by,
            task_title,
            task_description,
            priority,
            status,
            task_date,
            due_date
        } = req.body;

        const created_by = req.user?.user_id;

        if (!task_title) {
            return res.status(400).json({ error: "Task title is required" });
        }

        const result = await pool.query(
            `INSERT INTO it_tasks 
        (project_id, assigned_to, assigned_by, task_title, task_description, priority, status, task_date, due_date, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
            [
                project_id || null,
                assigned_to || null,
                assigned_by || null,
                task_title,
                task_description || null,
                priority || 'medium',
                status || 'in_progress',
                task_date || new Date().toISOString().split('T')[0],
                due_date || null,
                created_by
            ]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error("Error creating task:", error);
        res.status(500).json({ error: "Failed to create task" });
    }
};

// Update task
const updateTask = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            project_id,
            assigned_to,
            assigned_by,
            task_title,
            task_description,
            priority,
            status,
            task_date,
            due_date
        } = req.body;

        const updates = [];
        const params = [];
        let paramIndex = 1;

        const fields = {
            project_id,
            assigned_to,
            assigned_by,
            task_title,
            task_description,
            priority,
            status,
            task_date,
            due_date
        };

        Object.entries(fields).forEach(([key, value]) => {
            if (value !== undefined) {
                updates.push(`${key} = $${paramIndex}`);
                params.push(value);
                paramIndex++;
            }
        });

        if (status === 'completed') {
            updates.push(`completed_at = CURRENT_TIMESTAMP`);
        } else if (status && status !== 'completed') {
            updates.push(`completed_at = NULL`);
        }

        updates.push(`updated_at = CURRENT_TIMESTAMP`);

        if (updates.length === 0) {
            return res.json({ message: "No updates provided" });
        }

        params.push(id);
        const query = `
            UPDATE it_tasks 
            SET ${updates.join(', ')} 
            WHERE task_id = $${paramIndex} 
            RETURNING *
        `;

        const result = await pool.query(query, params);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Task not found" });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error("Error updating task:", error);
        res.status(500).json({ error: "Failed to update task" });
    }
};

// Delete task
const deleteTask = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            "DELETE FROM it_tasks WHERE task_id = $1 RETURNING *",
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Task not found" });
        }

        res.json({ message: "Task deleted successfully" });
    } catch (error) {
        console.error("Error deleting task:", error);
        res.status(500).json({ error: "Failed to delete task" });
    }
};

// ============ TASK COMMENTS ============

// Get task comments
const getTaskComments = async (req, res) => {
    try {
        const { taskId } = req.params;

        const result = await pool.query(
            `SELECT 
        c.*,
        u.username,
        u.profile_image
       FROM task_comments c
       LEFT JOIN users u ON c.user_id = u.user_id
       WHERE c.task_id = $1
       ORDER BY c.created_at ASC`,
            [taskId]
        );

        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching task comments:", error);
        res.status(500).json({ error: "Failed to fetch comments" });
    }
};

// Add task comment
const addTaskComment = async (req, res) => {
    try {
        const { taskId } = req.params;
        const { comment_text } = req.body;
        const user_id = req.user?.user_id;

        if (!comment_text) {
            return res.status(400).json({ error: "Comment text is required" });
        }

        const result = await pool.query(
            `INSERT INTO task_comments (task_id, user_id, comment_text)
       VALUES ($1, $2, $3)
       RETURNING *`,
            [taskId, user_id, comment_text]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error("Error adding comment:", error);
        res.status(500).json({ error: "Failed to add comment" });
    }
};

// ============ DASHBOARD STATS ============

const getDashboardStats = async (req, res) => {
    try {
        // Get overall statistics
        const stats = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM it_projects WHERE status = 'active') as active_projects,
        (SELECT COUNT(*) FROM it_tasks WHERE status != 'completed') as active_tasks,
        (SELECT COUNT(*) FROM it_tasks WHERE status = 'completed') as completed_tasks
    `);

        // Get project progress
        const projects = await pool.query(`
      SELECT 
        p.project_id,
        p.project_name,
        p.priority,
        p.status,
        COUNT(t.task_id) as total_tasks,
        COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_tasks,
        CASE 
          WHEN COUNT(t.task_id) > 0 
          THEN ROUND((COUNT(CASE WHEN t.status = 'completed' THEN 1 END)::numeric / COUNT(t.task_id)::numeric) * 100, 2)
          ELSE 0
        END as completion_percentage
      FROM it_projects p
      LEFT JOIN it_tasks t ON p.project_id = t.project_id
      WHERE p.status = 'active'
      GROUP BY p.project_id
      ORDER BY p.priority DESC, p.created_at DESC
    `);

        // Get team activity (tasks by user)
        const teamActivity = await pool.query(`
      SELECT 
        u.user_id,
        u.username,
        u.profile_image,
        COUNT(CASE WHEN t.status = 'in_progress' THEN 1 END) as in_progress_count,
        COUNT(CASE WHEN t.status = 'completed' AND DATE(t.completed_at) = CURRENT_DATE THEN 1 END) as completed_today,
        COUNT(t.task_id) as total_assigned
      FROM users u
      LEFT JOIN it_tasks t ON u.user_id = t.assigned_to
      GROUP BY u.user_id
      HAVING COUNT(t.task_id) > 0
      ORDER BY u.username
    `);

        res.json({
            stats: stats.rows[0],
            projects: projects.rows,
            teamActivity: teamActivity.rows,
            recentBlockers: []
        });
    } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        res.status(500).json({ error: "Failed to fetch dashboard statistics" });
    }
};

// Get team overview
const getTeamOverview = async (req, res) => {
    try {
        const result = await pool.query(`
      SELECT 
        u.user_id,
        u.username,
        u.email,
        u.profile_image,
        u.role_id,
        u.is_it_developer,
        u.is_it_manager,
        COUNT(DISTINCT t.task_id) as total_tasks,
        COUNT(DISTINCT CASE WHEN t.status = 'completed' THEN t.task_id END) as completed_tasks,
        COUNT(DISTINCT CASE WHEN t.status = 'in_progress' THEN t.task_id END) as in_progress_tasks
      FROM users u
      LEFT JOIN it_tasks t ON u.user_id = t.assigned_to
      GROUP BY u.user_id, u.username, u.email, u.profile_image, u.role_id, u.is_it_developer, u.is_it_manager
      ORDER BY u.username
    `);

        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching team overview:", error);
        res.status(500).json({ error: "Failed to fetch team overview" });
    }
};

module.exports = {
    // Projects
    getProjects,
    createProject,
    updateProject,
    deleteProject,

    // Tasks
    getTasks,
    createTask,
    updateTask,
    deleteTask,

    // Comments
    getTaskComments,
    addTaskComment,

    // Dashboard
    getDashboardStats,
    getTeamOverview
};

// const pool = require("../../config/db");
const pool = require("../../config/db");


// Add a comment to a specific lead
exports.createComment = async (req, res) => {
  const { lead_id } = req.params;
  const { comment_text } = req.body;
  const created_by = req.user.username;

  if (!comment_text) {
    return res.status(400).json({ error: "Comment text is required." });
  }

  try {
    const query = `
      INSERT INTO comments (lead_id, comment_text, created_by) 
      VALUES ($1, $2, $3) 
      RETURNING *`;
    const values = [lead_id, comment_text, created_by];

    const result = await pool.query(query, values);
    res.status(201).json({ success: true, comment: result.rows[0] });
  } catch (err) {
    console.error("Error adding comment:", err);
    res.status(500).json({ error: "Failed to add comment" });
  }
};

// Get all comments for a specific lead
exports.getComment = async (req, res) => {
  const { lead_id } = req.params;

  try {
    console.log('Fetching comments for lead_id:', lead_id);

    const query = `
      SELECT 
        c.comment_id, 
        c.comment_text, 
        c.created_at,
        c.updated_at,
        c.created_by,
        COALESCE(c.likes, '[]'::jsonb) as likes, 
        COALESCE(c.reactions, '{}'::jsonb) as reactions,
        u.username as user_username,
        u.email as user_email,
        CASE 
          WHEN u.profile_image IS NOT NULL 
          THEN 'data:image/png;base64,' || encode(u.profile_image, 'base64')
          ELSE NULL 
        END as user_profile_image
      FROM comments c
      LEFT JOIN users u ON c.created_by = u.username
      WHERE c.lead_id = $1 
      ORDER BY c.created_at ASC`;

    const result = await pool.query(query, [lead_id]);
    console.log(`✅ Fetched ${result.rows.length} comments`);

    res.status(200).json({ success: true, comments: result.rows });
  } catch (err) {
    console.error("❌ Error fetching comments:", err.message);
    console.error("Stack:", err.stack);
    res.status(500).json({ error: "Failed to fetch comments", details: err.message });
  }
};

// Edit a specific comment
exports.editComment = async (req, res) => {
  const { comment_id } = req.params;
  const { comment_text } = req.body;

  if (!comment_text) {
    return res.status(400).json({ error: "Comment text is required." });
  }

  try {
    const query = `
      UPDATE comments 
      SET comment_text = $1, updated_at = NOW() 
      WHERE comment_id = $2 
      RETURNING *`;
    const result = await pool.query(query, [comment_text, comment_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Comment not found." });
    }

    res.status(200).json({ success: true, comment: result.rows[0] });
  } catch (err) {
    console.error("Error updating comment:", err);
    res.status(500).json({ error: "Failed to update comment" });
  }
};

// Delete a specific comment
exports.deleteComment = async (req, res) => {
  const { comment_id } = req.params;

  try {
    const query = `DELETE FROM comments WHERE comment_id = $1 RETURNING *`;
    const result = await pool.query(query, [comment_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Comment not found." });
    }

    res.status(200).json({ success: true, message: "Comment deleted." });
  } catch (err) {
    console.error("Error deleting comment:", err);
    res.status(500).json({ error: "Failed to delete comment" });
  }
};

// Toggle like on a comment
exports.toggleLike = async (req, res) => {
  const { comment_id } = req.params;
  const username = req.user.username;

  try {
    const checkQuery = 'SELECT likes FROM comments WHERE comment_id = $1';
    const checkResult = await pool.query(checkQuery, [comment_id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: "Comment not found." });
    }

    let likes = checkResult.rows[0].likes || [];

    const index = likes.indexOf(username);
    if (index > -1) {
      likes.splice(index, 1);
    } else {
      likes.push(username);
    }

    const updateQuery = 'UPDATE comments SET likes = $1 WHERE comment_id = $2 RETURNING *';
    const result = await pool.query(updateQuery, [JSON.stringify(likes), comment_id]);

    res.status(200).json({ success: true, likes: result.rows[0].likes });
  } catch (err) {
    console.error("Error toggling like:", err);
    res.status(500).json({ error: "Failed to toggle like" });
  }
};

// Add reaction to a comment
exports.addReaction = async (req, res) => {
  const { comment_id } = req.params;
  const { emoji } = req.body;
  const username = req.user.username;

  if (!emoji) return res.status(400).json({ error: "Emoji is required" });

  try {
    const checkQuery = 'SELECT reactions FROM comments WHERE comment_id = $1';
    const checkResult = await pool.query(checkQuery, [comment_id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: "Comment not found." });
    }

    let reactions = checkResult.rows[0].reactions || {};

    if (!Array.isArray(reactions[emoji])) {
      reactions[emoji] = [];
    }

    const index = reactions[emoji].indexOf(username);
    if (index > -1) {
      reactions[emoji].splice(index, 1);
      if (reactions[emoji].length === 0) {
        delete reactions[emoji];
      }
    } else {
      reactions[emoji].push(username);
    }

    const updateQuery = 'UPDATE comments SET reactions = $1 WHERE comment_id = $2 RETURNING *';
    const result = await pool.query(updateQuery, [JSON.stringify(reactions), comment_id]);

    res.status(200).json({ success: true, reactions: result.rows[0].reactions });
  } catch (err) {
    console.error("Error adding reaction:", err);
    res.status(500).json({ error: "Failed to add reaction" });
  }
};

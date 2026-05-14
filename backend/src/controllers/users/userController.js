// src/controllers/users/userController.js

const bcrypt = require("bcryptjs");
const pool = require("../../config/db");

// Normalize and validate mobile: no spaces, 5–15 digits. Returns cleaned string or null; on invalid returns { error }.
function validateMobile(value) {
  if (value == null || value === "") return null;
  const stripped = String(value).trim().replace(/\s/g, "");
  if (stripped === "") return null;
  if (!/^\d{5,15}$/.test(stripped)) return { error: "Mobile must be 5–15 digits with no spaces." };
  return stripped;
}

function normalizeRoleIds(value) {
  if (value == null || value === "") return [];
  const raw = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? (() => {
        try {
          const parsed = JSON.parse(value);
          return Array.isArray(parsed) ? parsed : [value];
        } catch {
          return value.split(",");
        }
      })()
      : [value];

  return [...new Set(raw
    .map((v) => Number(v))
    .filter((v) => Number.isInteger(v) && v > 0))];
}

function pickPrimaryRoleId(roleIds = [], fallbackRoleId = null) {
  if (roleIds.includes(1)) return 1; // Admin takes precedence
  if (fallbackRoleId && roleIds.includes(Number(fallbackRoleId))) return Number(fallbackRoleId);
  return roleIds[0] || null;
}

// 👤 Create User with Profile Image and Unit
exports.createUser = async (req, res) => {
  try {
    const { username, email, password, mobile, role_id, unit_id, role_ids } = req.body;
    const profile_image = req.file?.buffer ?? null;
    const parsedRoleIds = normalizeRoleIds(role_ids);
    const combinedRoleIds = [...new Set([...(Number(role_id) ? [Number(role_id)] : []), ...parsedRoleIds])];
    const primaryRoleId = pickPrimaryRoleId(combinedRoleIds, role_id);

    if (!username || !email || !password || !primaryRoleId || !unit_id) {
      return res.status(400).json({ error: "All fields are required." });
    }

    const mobileValid = validateMobile(mobile);
    if (mobileValid && mobileValid.error) return res.status(400).json({ error: mobileValid.error });
    const mobileToStore = typeof mobileValid === "string" ? mobileValid : null;
    const hashedPassword = bcrypt.hashSync(password, 10);

    const client = await pool.connect();
    let result;
    try {
      await client.query("BEGIN");
      result = await client.query(
        `
        INSERT INTO users (
          user_id,
          username,
          email,
          password,
          mobile,
          role_id,
          profile_image,
          unit_id
        ) VALUES (
          gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7
        )
        RETURNING
          user_id   AS id,
          username,
          email,
          mobile,
          role_id,
          unit_id
        `,
        [username, email, hashedPassword, mobileToStore, primaryRoleId, profile_image, unit_id]
      );

      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ error: "Failed to create user." });
  }
};

// 📋 Get All Users (with unit name + role as `role`)
exports.getAllUsers = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        u.user_id   AS id,
        u.username,
        u.email,
        u.mobile,
        u.role_id,
        ur.role_name AS role,
        CASE WHEN u.role_id IS NOT NULL THEN ARRAY[u.role_id]::int[] ELSE ARRAY[]::int[] END AS role_ids,
        CASE WHEN ur.role_name IS NOT NULL THEN ARRAY[ur.role_name::text] ELSE ARRAY[]::text[] END AS role_names,
        u.unit_id,
        un.unit_name,
        u.profile_image
      FROM users u
      LEFT JOIN user_roles ur 
        ON u.role_id = ur.role_id
      LEFT JOIN unit un 
        ON u.unit_id = un.unit_id
      ORDER BY u.username;
    `);

    const users = result.rows.map((user) => ({
      id: user.id,
      username: user.username,
      email: user.email,
      mobile: user.mobile,
      role_id: user.role_id,
      role: user.role,
      role_ids: user.role_ids || [],
      role_names: user.role_names || [],
      unit_id: user.unit_id,
      unit_name: user.unit_name,
      has_image: !!user.profile_image,
      profile_image: user.profile_image
        ? user.profile_image.toString("base64")
        : null,
    }));

    res.json(users);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ error: "Failed to fetch users." });
  }
};


// ✏️ Update User (with optional password change)
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params; // UUID string
    // Read all fields from req.body (multer should parse FormData fields here)
    // Note: When using upload.any(), FormData text fields are in req.body
    // Multer parses FormData: files go to req.files, text fields go to req.body
    const {
      username,
      email,
      mobile,
      role_id,
      role_ids,
      unit_id,
      password, // ← grab the password field
      remove_image, // ← flag to remove image (comes as string "true" from FormData)
    } = req.body || {};
    const parsedRoleIds = normalizeRoleIds(role_ids);
    const combinedRoleIds = [...new Set([...(Number(role_id) ? [Number(role_id)] : []), ...parsedRoleIds])];
    const primaryRoleId = pickPrimaryRoleId(combinedRoleIds, role_id);

    // Handle file from upload.any() - files array or single file
    const profile_image = req.files?.find(f => f.fieldname === "profile_image")?.buffer
      ?? req.file?.buffer
      ?? null;

    // Debug logging - check what we received
    console.log("=== UPDATE USER REQUEST ===");
    console.log("User ID:", id);
    console.log("req.body keys:", Object.keys(req.body));
    console.log("remove_image from req.body:", remove_image, "type:", typeof remove_image);
    console.log("req.files:", req.files?.map(f => ({ fieldname: f.fieldname, size: f.size })) || []);
    console.log("req.file:", req.file ? { fieldname: req.file.fieldname, size: req.file.size } : null);
    console.log("profile_image buffer:", profile_image ? `${profile_image.length} bytes` : "null");
    console.log("===========================");

    // 1) Required fields
    if (!username || !email || !primaryRoleId || !unit_id) {
      return res
        .status(400)
        .json({ error: "Username, email, role_id, and unit_id are required." });
    }

    // 2) Email uniqueness
    const emailCheck = await pool.query(
      `SELECT 1 FROM users WHERE email = $1 AND user_id != $2`,
      [email, id]
    );
    if (emailCheck.rowCount > 0) {
      return res
        .status(409)
        .json({ error: "Email already in use by another user." });
    }

    // 2b) Mobile: no spaces, 5–15 digits if provided
    const mobileValid = validateMobile(mobile);
    if (mobileValid && mobileValid.error) return res.status(400).json({ error: mobileValid.error });
    const mobileToStore = typeof mobileValid === "string" ? mobileValid : null;

    // 3) Start building the UPDATE
    let idx = 1;
    const params = [username, email, mobileToStore, primaryRoleId, unit_id];
    let query = `
      UPDATE users SET
        username   = $${idx++},
        email      = $${idx++},
        mobile     = $${idx++},
        role_id    = $${idx++},
        unit_id    = $${idx++}
    `;

    // 4) Optional: password change
    if (password) {
      const hashed = bcrypt.hashSync(password, 10);
      query += `, password = $${idx++}`;
      params.push(hashed);
    }

    // 5) Optional: profile image removal or update
    // Handle remove_image flag (can be string "true", boolean true, or "1")
    // FormData sends values as strings, so "true" is a string
    const shouldRemoveImage = remove_image === "true" || remove_image === true || remove_image === "1" || remove_image === 1 || remove_image === "True";

    console.log("=== IMAGE UPDATE DECISION ===");
    console.log("remove_image value:", remove_image);
    console.log("remove_image type:", typeof remove_image);
    console.log("shouldRemoveImage:", shouldRemoveImage);
    console.log("has profile_image buffer:", !!profile_image);

    if (shouldRemoveImage) {
      // Remove the image by setting to NULL
      query += `, profile_image = NULL`;
      console.log("DECISION: Removing image (setting to NULL)");
    } else if (profile_image) {
      // Update with new image
      query += `, profile_image = $${idx++}`;
      params.push(profile_image);
      console.log("DECISION: Updating with new image");
    } else {
      console.log("DECISION: No image change");
    }
    console.log("==============================");

    // 6) Finalize and run
    query += ` WHERE user_id = $${idx} 
               RETURNING
                 user_id   AS id,
                 username,
                 email,
                 mobile,
                 role_id,
                 unit_id,
                 profile_image`;
    params.push(id);

    console.log("=== SQL QUERY EXECUTION ===");
    console.log("Full query:", query);
    console.log("Query params:", params);
    console.log("shouldRemoveImage:", shouldRemoveImage);
    console.log("remove_image value:", remove_image);
    console.log("remove_image type:", typeof remove_image);

    const client = await pool.connect();
    let result;
    try {
      await client.query("BEGIN");
      result = await client.query(query, params);
      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }

    if (!result.rows || result.rows.length === 0) {
      console.error("ERROR: Update query returned no rows!");
      return res.status(404).json({ error: "User not found." });
    }

    const user = result.rows[0];
    console.log("Update result for user", id, "- profile_image:", user.profile_image ? `exists (${user.profile_image.length} bytes)` : "NULL");

    // Verify the update by querying the user again immediately
    const verifyResult = await pool.query(
      `SELECT user_id, username, profile_image FROM users WHERE user_id = $1`,
      [id]
    );
    const verifiedUser = verifyResult.rows[0];
    console.log("=== VERIFICATION QUERY RESULT ===");
    console.log("User ID:", verifiedUser?.user_id);
    console.log("Username:", verifiedUser?.username);
    console.log("profile_image:", verifiedUser?.profile_image ? `EXISTS (${verifiedUser.profile_image.length} bytes)` : "NULL");
    console.log("================================");

    // Format response similar to getAllUsers
    return res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      mobile: user.mobile,
      role_id: user.role_id,
      unit_id: user.unit_id,
      profile_image: user.profile_image
        ? user.profile_image.toString("base64")
        : null,
    });
  } catch (err) {
    console.error("Error updating user:", err);
    return res.status(500).json({ error: "Failed to update user." });
  }
};

// 🗑️ Delete User
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query(`DELETE FROM users WHERE user_id = $1`, [id]);
    res.json({ message: "User deleted." });
  } catch (err) {
    console.error("Error deleting user:", err);
    res.status(500).json({ error: "Failed to delete user." });
  }
};

// 🖼️ Get User Profile Image
exports.getUserImage = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT profile_image FROM users WHERE user_id = $1`,
      [id]
    );

    if (!result.rows.length || !result.rows[0].profile_image) {
      return res.status(404).json({ error: "No image found." });
    }

    res.set("Content-Type", "image/png");
    res.send(result.rows[0].profile_image);
  } catch (err) {
    console.error("Error fetching image:", err);
    res.status(500).json({ error: "Image fetch failed." });
  }
};

exports.getAllRoles = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT role_id, role_name FROM user_roles ORDER BY role_id`
    );
    res.json(rows);
  } catch (err) {
    console.error("Fetch roles error:", err);
    res.status(500).json({ error: "Failed to fetch roles." });
  }
};

exports.assignUserRoles = async (req, res) => {
  const { id } = req.params;
  const { role_ids } = req.body || {};
  const parsedRoleIds = normalizeRoleIds(role_ids);
  if (!parsedRoleIds.length) {
    return res.status(400).json({ error: "At least one role is required." });
  }

  const primaryRoleId = pickPrimaryRoleId(parsedRoleIds);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const userCheck = await client.query(
      `SELECT user_id FROM users WHERE user_id = $1`,
      [id]
    );
    if (!userCheck.rowCount) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "User not found." });
    }

    await client.query(`UPDATE users SET role_id = $1 WHERE user_id = $2`, [primaryRoleId, id]);
    await client.query("COMMIT");
    return res.json({ success: true, user_id: id, role_id: primaryRoleId, role_ids: parsedRoleIds });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Assign roles error:", err);
    return res.status(500).json({ error: "Failed to assign roles." });
  } finally {
    client.release();
  }
};

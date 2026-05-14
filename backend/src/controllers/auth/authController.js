const bcrypt = require("bcryptjs");
const pool = require("../../config/db");
const jwtService = require("../../services/jwtService");
const refreshTokenService = require("../../services/refreshTokenService");

const isProduction = process.env.NODE_ENV === "production";

/** SameSite=Lax mitigates CSRF on cross-site POSTs; use COOKIE_SAME_SITE=strict if fully same-site */
const resolveSameSite = () => {
  const raw = (process.env.COOKIE_SAME_SITE || "lax").toLowerCase();
  if (raw === "strict" || raw === "lax") return raw;
  if (raw === "none" && isProduction) return "none";
  return "lax";
};

const authCookieBase = () => ({
  httpOnly: true,
  secure: isProduction,
  sameSite: resolveSameSite(),
  path: "/",
});

const buildRefreshCookieOptions = () => ({
  ...authCookieBase(),
  maxAge: jwtService.REFRESH_TOKEN_MAX_AGE,
});

const buildAccessCookieOptions = () => ({
  ...authCookieBase(),
  maxAge: jwtService.ACCESS_TOKEN_MAX_AGE,
});

const clearAuthCookies = (res) => {
  const base = authCookieBase();
  res.clearCookie("accessToken", base);
  res.clearCookie("refreshToken", base);
};

const createAuthPayload = (user) => ({
  id: user.id,
  r_id: user.role_id,
  role_ids: user.role_ids || (user.role_id != null ? [user.role_id] : []),
  username: user.username,
});

exports.login = async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res
      .status(400)
      .json({ error: "Username and password are required." });
  }

  try {
    const { rows } = await pool.query(
      `SELECT 
          user_id   AS id, 
          username, 
          password  AS hash, 
          role_id,
          profile_image
       FROM users 
      WHERE username = $1`,
      [username]
    );
    const user = rows[0];
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.hash);
    if (!isMatch) return res.status(401).json({ error: "Invalid credentials" });

    const role_ids = user.role_id != null ? [user.role_id] : [];
    const payload = createAuthPayload({
      ...user,
      role_ids,
    });
    const accessToken = jwtService.generateAccessToken(payload);
    const refreshToken = jwtService.generateRefreshToken(payload);

    await refreshTokenService.deleteTokensForUser(user.id);
    await refreshTokenService.storeRefreshToken(
      user.id,
      refreshToken,
      new Date(Date.now() + jwtService.REFRESH_TOKEN_MAX_AGE)
    );

    refreshTokenService.purgeExpiredTokens().catch((err) => {
      console.warn("Failed to purge expired refresh tokens", err);
    });

    // Handle profile_image
    let profileImageToSend = null;
    if (user.profile_image) {
      if (Buffer.isBuffer(user.profile_image)) {
        // Legacy support: If stored as binary blob, send as Data URI
        // Assuming JPEG usually, but strictly we don't know. 
        // Ideally we should move away from Blob storage.
        profileImageToSend = `data:image/jpeg;base64,${user.profile_image.toString("base64")}`;
      } else {
        // It's likely a path string (e.g. "uploads/...")
        // Send as is
        profileImageToSend = user.profile_image;
      }
    }

    res
      .cookie("accessToken", accessToken, buildAccessCookieOptions())
      .cookie("refreshToken", refreshToken, buildRefreshCookieOptions())
      .status(200)
      .json({
        success: true,
        user: {
          id: user.id,
          username: user.username,
          role_id: user.role_id,
          role_ids: payload.role_ids,
          profile_image: profileImageToSend,
        },
        expiresIn: jwtService.ACCESS_TOKEN_EXPIRY,
      });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error. Please try again later." });
  }
};

exports.logout = async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;

  try {
    if (refreshToken) {
      await refreshTokenService.deleteRefreshToken(refreshToken);
    }

    clearAuthCookies(res);

    let userId = req.user?.id || req.user?.userId;
    let username = req.user?.username;

    if (!userId && refreshToken) {
      try {
        const payload = jwtService.verifyRefreshToken(refreshToken);
        userId = payload.id;
        username = payload.username;
      } catch (err) {
        // ignore invalid refresh token when attempting to log
      }
    }

    if (!username && userId) {
      try {
        const { rows } = await pool.query(
          "SELECT username FROM users WHERE user_id = $1",
          [userId]
        );
        username = rows[0]?.username;
      } catch (err) {
        console.warn("Failed to fetch username for logout logging", err);
      }
    }

    if (username) {
      await pool.query(
        "INSERT INTO user_logs (username, action, timestamp) VALUES ($1, $2, $3)",
        [username, "Logout", new Date()]
      );
    }

    res.status(200).json({
      success: true,
      message: "Logout action completed successfully.",
    });
  } catch (err) {
    console.error("Logout error:", err);
    res.status(500).json({ error: "Failed to complete logout." });
  }
};

exports.refreshToken = async (req, res) => {
  const incomingToken = req.cookies?.refreshToken;

  if (!incomingToken) {
    return res.status(401).json({ error: "Refresh token missing." });
  }

  try {
    const payload = jwtService.verifyRefreshToken(incomingToken);
    const tokenRecord = await refreshTokenService.findRefreshToken(
      incomingToken
    );

    if (!tokenRecord || tokenRecord.user_id !== payload.id) {
      if (tokenRecord) {
        await refreshTokenService.deleteRefreshToken(incomingToken);
      }
      return res.status(401).json({ error: "Invalid refresh token." });
    }

    if (new Date(tokenRecord.expires_at) <= new Date()) {
      await refreshTokenService.deleteRefreshToken(incomingToken);
      return res.status(401).json({ error: "Refresh token expired." });
    }

    await refreshTokenService.deleteRefreshToken(incomingToken);

    const { rows: userRows } = await pool.query(
      `SELECT role_id FROM users WHERE user_id = $1`,
      [payload.id]
    );
    const dbRoleId = userRows[0]?.role_id;
    const role_ids =
      dbRoleId != null ? [dbRoleId] : payload.role_ids?.length ? payload.role_ids : [];
    const userPayload = {
      id: payload.id,
      r_id: dbRoleId ?? payload.r_id,
      role_ids,
      username: payload.username,
    };

    const accessToken = jwtService.generateAccessToken(userPayload);
    const newRefreshToken = jwtService.generateRefreshToken(userPayload);

    await refreshTokenService.storeRefreshToken(
      payload.id,
      newRefreshToken,
      new Date(Date.now() + jwtService.REFRESH_TOKEN_MAX_AGE)
    );

    refreshTokenService.purgeExpiredTokens().catch((err) => {
      console.warn("Failed to purge expired refresh tokens", err);
    });

    res
      .cookie("accessToken", accessToken, buildAccessCookieOptions())
      .cookie("refreshToken", newRefreshToken, buildRefreshCookieOptions())
      .status(200)
      .json({
        success: true,
        role_id: userPayload.r_id,
        r_id: userPayload.r_id,
        role_ids: userPayload.role_ids,
      });
  } catch (error) {
    console.error("Refresh token error:", error);
    await refreshTokenService.deleteRefreshToken(incomingToken).catch(() => { });
    res.status(401).json({ error: "Invalid refresh token." });
  }
};

// Auth state bootstrap for SPA: returns server-verified user/roles.
// Relies on HttpOnly `accessToken` cookie (authenticateToken middleware).
exports.me = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const roleIds = Array.isArray(req.user.role_ids) ? req.user.role_ids : [];
  const roleId = req.user.r_id ?? req.user.role_id ?? (roleIds.length ? roleIds[0] : null);

  return res.status(200).json({
    success: true,
    user: {
      id: req.user.id ?? req.user.userId,
      username: req.user.username,
      role_id: roleId,
      role_ids: roleIds,
    },
  });
};

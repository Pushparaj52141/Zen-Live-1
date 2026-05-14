const { verifyAccessToken } = require("../services/jwtService");

exports.authenticateToken = (req, res, next) => {
  // Prefer HttpOnly cookie (browser SPA); Authorization header optional for API clients
  let token = req.cookies?.accessToken;
  if (!token) {
    const authHeader = req.headers["authorization"];
    token = authHeader?.split(" ")[1];
  }

  if (!token)
    return res.status(401).json({ error: "Access Denied. No token provided." });

  try {
    const decoded = verifyAccessToken(token);
    const tokenRoleIds = Array.isArray(decoded.role_ids)
      ? decoded.role_ids.map((r) => Number(r)).filter((r) => Number.isInteger(r))
      : [];
    const primaryRole = decoded.role ?? decoded.r_id ?? decoded.role_id;
    req.user = {
      ...decoded,
      role: primaryRole,
      role_ids: tokenRoleIds.length ? tokenRoleIds : (primaryRole != null ? [Number(primaryRole)] : []),
    };
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};



exports.authorizeRoles = (...roles) => {
  return (req, res, next) => {
    const userRoleIds = Array.isArray(req.user.role_ids) ? req.user.role_ids : [req.user.role];
    const hasRole = userRoleIds.some((r) => roles.includes(r) || roles.includes(String(r)));
    if (!hasRole) {
      return res
        .status(403)
        .json({ error: "Access denied: Insufficient role permissions." });
    }
    next();
  };
};

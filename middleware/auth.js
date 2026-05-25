// middleware/auth.js — JWT Authentication + RBAC
import jwt from "jsonwebtoken";
import AuditLog from "../models/AuditLog.js";

// ── Verify JWT and attach user to request ───────────────────────
export const authenticate = (req, res, next) => {
  const token =
    req.cookies?.accessToken ||
    req.headers.authorization?.split(" ")[1];

  if (!token)
    return res.status(401).json({ message: "Authentication required" });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    const msg =
      err.name === "TokenExpiredError"
        ? "Token expired — please log in again"
        : "Invalid token";
    return res.status(401).json({ message: msg });
  }
};

// ── Role-based access guard ──────────────────────────────────────
// Usage: router.delete("/:id", authenticate, authorize("Admin"), handler)
export const authorize = (...roles) =>
  (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      // Log unauthorized access attempt
      AuditLog.create({
        action: "UNAUTHORIZED_ACCESS_ATTEMPT",
        userId: req.user?._id,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
        details: { route: req.originalUrl, requiredRoles: roles, userRole: req.user?.role },
      }).catch(() => {});
      return res.status(403).json({ message: "Insufficient permissions" });
    }
    next();
  };
// models/AuditLog.js — Immutable audit trail
import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    enum: [
      "USER_LOGIN", "USER_LOGOUT", "USER_REGISTERED",
      "CASE_CREATED", "CASE_UPDATED", "CASE_DELETED", "STATUS_CHANGED",
      "SIGHTING_ADDED", "ALERT_SENT",
      "UNAUTHORIZED_ACCESS_ATTEMPT", "RATE_LIMIT_HIT",
      "FILE_UPLOAD", "FACE_MATCH_RUN",
    ],
  },
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  userEmail: { type: String },
  caseId:    { type: String },
  ipAddress: { type: String },
  userAgent: { type: String },
  details:   { type: mongoose.Schema.Types.Mixed },
}, {
  timestamps: true,
  // Prevent updates — audit logs are append-only
});

// Block any update operations on audit logs
auditLogSchema.pre(["updateOne", "findOneAndUpdate", "updateMany"], function () {
  throw new Error("Audit logs are immutable");
});

export default mongoose.model("AuditLog", auditLogSchema);
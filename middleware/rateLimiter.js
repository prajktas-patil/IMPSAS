// middleware/rateLimiter.js — Rate limiting configs
import rateLimit from "express-rate-limit";

// ── Login endpoint: 5 attempts per 15 minutes ───────────────────
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    error: "Too many login attempts. Please try again in 15 minutes.",
    retryAfter: "15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip + ":" + (req.body?.email || ""),
});

// ── Registration: 10 per hour ────────────────────────────────────
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { error: "Too many registrations. Try again in an hour." },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── File upload / AI match: 20 per minute ───────────────────────
export const uploadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { error: "Upload rate limit exceeded. Please slow down." },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── General API: 100 per minute ─────────────────────────────────
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { error: "API rate limit exceeded." },
  standardHeaders: true,
  legacyHeaders: false,
});
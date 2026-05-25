// models/User.js — Secure user model with bcrypt
import mongoose from "mongoose";
import bcrypt   from "bcrypt";

const BCRYPT_ROUNDS = 12;

const userSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true, maxLength: 100 },
  email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minLength: 8, select: false }, // never returned by default
  role:     { type: String, enum: ["Admin", "Officer", "Public"], default: "Officer" },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date },
  loginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date },
}, { timestamps: true });

// ── Hash password before save ────────────────────────────────────
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, BCRYPT_ROUNDS);
  next();
});

// ── Compare plaintext password against hash ──────────────────────
userSchema.methods.comparePassword = async function (plaintext) {
  return bcrypt.compare(plaintext, this.password);
};

// ── Never expose password in JSON responses ──────────────────────
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.loginAttempts;
  delete obj.lockUntil;
  return obj;
};

export default mongoose.model("User", userSchema);
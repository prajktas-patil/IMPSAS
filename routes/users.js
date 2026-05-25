// routes/users.js — Real login with JWT token
import express from "express";
import bcrypt  from "bcrypt";
import jwt     from "jsonwebtoken";
import User    from "../models/User.js";

const router = express.Router();

// POST /api/users/register
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: "name, email and password are required" });

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing)
      return res.status(409).json({ message: "Email already registered" });

    const hashed  = await bcrypt.hash(password, 12);
    const newUser = new User({ name, email: email.toLowerCase(), password: hashed, role: role || "Public" });
    const saved   = await newUser.save();

    res.status(201).json({
      message: "User registered successfully",
      user: { id: saved._id, name: saved.name, email: saved.email, role: saved.role },
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// POST /api/users/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "Email and password are required" });

    const user = await User.findOne({ email: email.toLowerCase() });

    // Compare password — works whether stored as bcrypt hash or plain (legacy)
    let valid = false;
    if (user) {
      const isBcrypt = user.password?.startsWith("$2");
      valid = isBcrypt
        ? await bcrypt.compare(password, user.password)
        : user.password === password; // fallback for old plain-text accounts
    }

    if (!valid)
      return res.status(401).json({ message: "Invalid email or password" });

    // Issue JWT
    const token = jwt.sign(
      { id: user._id, name: user.name, email: user.email, role: user.role },
      process.env.JWT_SECRET || "impsas_dev_secret",
      { expiresIn: "8h" }
    );

    res.json({
      message: "Login successful",
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/users
router.get("/", async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
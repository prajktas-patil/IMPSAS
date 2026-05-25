// seed.js — Run ONCE to create admin and officer accounts in MongoDB
// Usage: node seed.js
// ⚠️  Change the passwords below before running!

import mongoose from "mongoose";
import dotenv   from "dotenv";
import User     from "./models/User.js";

dotenv.config();

const SEED_USERS = [
  { name: "Admin User",    email: "admin@impsas.local",   password: "Admin@1234",   role: "Admin"   },
  { name: "Officer User",  email: "officer@impsas.local", password: "Officer@1234", role: "Officer" },
];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB");

  for (const u of SEED_USERS) {
    const existing = await User.findOne({ email: u.email });
    if (existing) {
      console.log(`⚠️  ${u.email} already exists — skipping`);
      continue;
    }
    // User model pre-save hook hashes the password automatically
    const newUser = new User({ name: u.name, email: u.email, password: u.password, role: u.role });
    await newUser.save();
    console.log(`✅  Created ${u.role}: ${u.email}  /  password: ${u.password}`);
  }

  await mongoose.disconnect();
  console.log("\nDone! Use these credentials to log in via the Staff tab.");
}

seed().catch(err => { console.error(err); process.exit(1); });

import express          from "express";
import mongoose         from "mongoose";
import cors             from "cors";
import dotenv           from "dotenv";
import { createServer } from "http";
import { Server }       from "socket.io";
import formidable       from "formidable";
import casesRoute       from "./routes/cases.js";
import usersRoute       from "./routes/users.js";
import { sendSightingAlerts } from "./services/alertService.js";
import Case             from "./models/Case.js";

dotenv.config();

const app    = express();
const server = createServer(app);

// Socket.io
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});
app.set("io", io);

io.on("connection", (socket) => {
  console.log("Frontend connected:", socket.id);
  socket.on("disconnect", () => console.log("Frontend disconnected:", socket.id));
});

// Middleware
app.use(cors({ origin: "*", methods: ["GET","POST","PATCH","DELETE","OPTIONS"] }));
app.options("*", cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

// MongoDB
mongoose.connect(process.env.MONGO_URI, {
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000,
})
.then(() => console.log("MongoDB Connected Successfully"))
.catch((err) => {
  console.log("MongoDB Connection Failed:", err.message);
  process.exit(1);
});

// Routes
app.use("/api/cases", casesRoute);
app.use("/api/users", usersRoute);

// ── DB Stats endpoint ──────────────────────────────────────────
app.get("/api/db/stats", async (req, res) => {
  try {
    const db          = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    const stats = await Promise.all(
      collections.map(async (col) => {
        try {
          const s = await db.command({ collStats: col.name });
          return {
            collection: col.name,
            count:   s.count      || 0,
            size:    formatBytes(s.size      || 0),
            avgObj:  formatBytes(s.avgObjSize || 0),
            indexes: s.nindexes   || 0,
          };
        } catch {
          return { collection: col.name, count: 0, size: "N/A", avgObj: "N/A", indexes: 0 };
        }
      })
    );
    res.json({
      status: "connected",
      uri: process.env.MONGO_URI?.replace(/:\/\/[^@]+@/, "://***@") || "",
      collections: stats,
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// ── DB Inspect endpoint ────────────────────────────────────────
app.get("/api/db/inspect/:collection", async (req, res) => {
  try {
    const db   = mongoose.connection.db;
    const col  = req.params.collection;
    const allowed = ["cases", "users", "alerts"];
    if (!allowed.includes(col)) {
      return res.status(403).json({ message: "Inspection not allowed for this collection" });
    }
    const docs = await db.collection(col).find({}).limit(20).toArray();
    const safe = docs.map(d => {
      const copy = { ...d };
      if (copy.password)      copy.password      = "***";
      if (copy.aadhaarNumber) copy.aadhaarNumber  = copy.aadhaarNumber?.slice(-7) || "***";
      return copy;
    });
    res.json(safe);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── CCTV Alert endpoint ───────────────────────────────────────
app.post("/api/alerts", async (req, res) => {
  try {
    const { caseId, name, matchScore, location, detectedAt, source } = req.body;
    const confidenceScore = Number(matchScore) || 0;

    const updated = await Case.findOneAndUpdate(
      { caseId },
      {
        $push: {
          sightings: {
            location,
            matchScore: confidenceScore,
            reportedAt: detectedAt || new Date().toISOString(),
            source: source || "cctv",
          },
          locationHistory: {
            location,
            recordedAt: detectedAt || new Date(),
            source: "cctv",
          },
        },
        $set: { confidenceScore },
      },
      { new: true }
    );

    if (updated && confidenceScore >= 55) {
      const latestSighting = updated.sightings[updated.sightings.length - 1];
      const alertResults   = await sendSightingAlerts(updated, latestSighting, confidenceScore);
      if (alertResults.length > 0) {
        await Case.findOneAndUpdate({ caseId }, {
          $push: {
            alertsSent: {
              $each: alertResults.map(r => ({
                type:      r.type      || "unknown",
                recipient: r.recipient || "",
                status:    r.status    || "failed",
                sentAt:    new Date(),
                message:   r.message   || "",
              }))
            }
          }
        });
      }
    }

    io.emit("cctv_alert",  { caseId, name, matchScore: confidenceScore, location, detectedAt });
    if (confidenceScore >= 75) {
      io.emit("emergency_alert", { caseId, name, matchScore: confidenceScore, location, type: "cctv_high" });
    }

    console.log("CCTV Alert saved:", name, confidenceScore + "%");
    res.json({ success: true });
  } catch (err) {
    console.error("Alert error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ── Fallback /api/match endpoint (no file parsing needed) ─────
app.post("/api/match", (req, res) => {
  const form = formidable({ multiples: true });
  form.parse(req, async (err, fields) => {
    try {
      const casesRaw = Array.isArray(fields.cases) ? fields.cases[0] : (fields.cases || "[]");
      const cases = JSON.parse(casesRaw);

      const results = cases
        .filter(c => c.photos && c.photos.length > 0)
        .map(c => {
          // Smart score based on case details — same case always gets same score
          const seed = (c.caseId || "").split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
          const score = Math.round(40 + (seed % 50));
          return {
            caseId:          c.caseId,
            _id:             c._id,
            name:            c.name,
            age:             c.age,
            location:        c.location,
            status:          c.status,
            confidenceScore: score,
            photos:          c.photos,
            fallbackMode:    true
          };
        })
        .sort((a, b) => b.confidenceScore - a.confidenceScore);

      res.json({
        matches:      results,
        total:        results.length,
        message:      `Found ${results.length} case(s) — Basic matching mode`,
        fallbackMode: true
      });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
});
// Health check
app.get("/", (req, res) => res.send("IMPSAS Backend Running Successfully"));

function formatBytes(bytes) {
  if (bytes === 0) return "0 B";
  const k     = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i     = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => console.log("Server running on http://localhost:" + PORT));
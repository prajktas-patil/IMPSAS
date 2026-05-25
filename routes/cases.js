import express           from "express";
import path              from "path";
import fs                from "fs";
import { fileURLToPath } from "url";
import formidable        from "formidable";
import Case              from "../models/Case.js";
import { sendSightingAlerts, sendEmergencyAlert } from "../services/alertService.js";

const router     = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const UPLOAD_DIR = path.join(__dirname, "../uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const maskAadhaar = (num) => {
  const d = (num || "").replace(/\D/g, "");
  return d.length < 4 ? "" : "XXXX-XXXX-" + d.slice(-4);
};

// ── Derive a clean .ext from the original filename ──────────────
function getCleanExt(file) {
  const orig = file.originalFilename || file.newFilename || "";
  const ext  = path.extname(orig).toLowerCase(); // e.g. ".jpg", ".png"
  // Only allow safe image extensions
  const allowed = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
  return allowed.includes(ext) ? ext : ".jpg";
}

// ── Rename formidable temp file to a clean timestamped name ────
function renameToClean(file) {
  const ext     = getCleanExt(file);
  const newName = Date.now() + "-" + Math.floor(Math.random() * 1e9) + ext;
  const newPath = path.join(UPLOAD_DIR, newName);
  fs.renameSync(file.filepath, newPath);
  return newName; // just the filename, not the full path
}

function parseForm(req) {
  return new Promise((resolve, reject) => {
    const form = formidable({
      uploadDir: UPLOAD_DIR,
      keepExtensions: false,   // we handle extensions ourselves
      maxFileSize: 5 * 1024 * 1024,
      multiples: true,
    });
    form.parse(req, (err, fields, files) => {
      if (err) return reject(err);
      resolve({ fields, files });
    });
  });
}

router.get("/", async (req, res) => {
  try {
    const cases = await Case.find().sort({ createdAt: -1 });
    res.json(cases);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const found = await Case.findById(req.params.id);
    if (!found) return res.status(404).json({ message: "Case not found" });
    res.json(found);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const { fields, files } = await parseForm(req);
    const get = (key) => (Array.isArray(fields[key]) ? fields[key][0] : fields[key]) || "";

    const photoFiles   = files.photos       ? (Array.isArray(files.photos)       ? files.photos       : [files.photos])       : [];
    const aadhaarFiles = files.aadhaarPhoto ? (Array.isArray(files.aadhaarPhoto) ? files.aadhaarPhoto : [files.aadhaarPhoto]) : [];

    // Rename each uploaded file to a clean name with correct extension
    const photos       = photoFiles.map(f  => renameToClean(f));
    const aadhaarPhoto = aadhaarFiles[0]   ? renameToClean(aadhaarFiles[0]) : "";

    let familyMembers = [];
    try { familyMembers = JSON.parse(get("familyMembers") || "[]"); } catch (_) {}

    const caseId = "CASE-" + new Date().getFullYear() + "-" + (Math.floor(Math.random() * 900) + 100);

    const newCase = new Case({
      caseId,
      name:          get("name"),
      age:           Number(get("age")),
      gender:        get("gender"),
      height:        get("height") ? Number(get("height")) : null,
      location:      get("location"),
      clothing:      get("clothing"),
      timeMissing:   get("time"),
      photos,
      aadhaarNumber: maskAadhaar(get("aadhaarNumber")),
      aadhaarPhoto,
      familyMembers,
      alertLevel:    get("alertLevel") || "Medium",
      status:        "Active",
      locationHistory: get("location") ? [{ location: get("location"), recordedAt: new Date(), source: "registration" }] : [],
    });

    const saved = await newCase.save();
    const io = req.app.get("io");
    if (io) io.emit("case_registered", { caseId: saved.caseId, name: saved.name });
    res.status(201).json({ message: "Case registered successfully!", case: saved, caseId: saved.caseId });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.patch("/:id/status", async (req, res) => {
  try {
    const updated = await Case.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    const io = req.app.get("io");
    if (io) io.emit("status_changed", { caseId: updated.caseId, name: updated.name, status: updated.status });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.post("/:id/sighting", async (req, res) => {
  try {
    const { location, matchScore, lat, lng, source } = req.body;
    const confidenceScore = Number(matchScore) || 0;
    const caseDoc = await Case.findByIdAndUpdate(req.params.id, {
      $push: {
        sightings:       { location, matchScore: confidenceScore, lat: lat||null, lng: lng||null, reportedAt: new Date(), source: source||"manual" },
        locationHistory: { location, lat: lat||null, lng: lng||null, recordedAt: new Date(), source: source||"manual" },
      },
      $set: { confidenceScore },
    }, { new: true });

    let alertResults = [];
    if (confidenceScore >= 55) {
      const latestSighting = caseDoc.sightings[caseDoc.sightings.length - 1];
      alertResults = confidenceScore >= 75
        ? await sendEmergencyAlert(caseDoc, location, confidenceScore)
        : await sendSightingAlerts(caseDoc, latestSighting, confidenceScore);
    }
    const io = req.app.get("io");
    if (io) {
      io.emit("cctv_alert", { caseId: caseDoc.caseId, name: caseDoc.name, matchScore: confidenceScore, location });
      if (confidenceScore >= 75)
        io.emit("emergency_alert", { caseId: caseDoc.caseId, name: caseDoc.name, matchScore: confidenceScore, location });
    }
    res.json({ message: "Sighting added!", case: caseDoc, alertsSent: alertResults.length });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.post("/:id/emergency-alert", async (req, res) => {
  try {
    const { location, confidenceScore } = req.body;
    const caseDoc = await Case.findById(req.params.id);
    if (!caseDoc) return res.status(404).json({ message: "Case not found" });
    const alertResults = await sendEmergencyAlert(caseDoc, location || caseDoc.location, confidenceScore || 100);
    res.json({ message: "Emergency alert sent!", alertResults });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/:id/location", async (req, res) => {
  try {
    const { location, lat, lng, source } = req.body;
    const updated = await Case.findByIdAndUpdate(req.params.id, {
      $push: { locationHistory: { location, lat: lat||null, lng: lng||null, recordedAt: new Date(), source: source||"manual" } },
      $set:  { location },
    }, { new: true });
    res.json({ message: "Location updated!", case: updated });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.patch("/:id/confidence", async (req, res) => {
  try {
    const updated = await Case.findByIdAndUpdate(req.params.id, { confidenceScore: Number(req.body.confidenceScore) }, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await Case.findByIdAndDelete(req.params.id);
    res.json({ message: "Case deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
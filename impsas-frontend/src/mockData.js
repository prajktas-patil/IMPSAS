// ============================================================
// mockData.js — Simulated MongoDB documents for dev/demo
// Collections: cases, matches, alerts, users
// ============================================================

export const mockCases = [
  {
    id: "CASE-2024-001",
    name: "Arjun Mehta",
    age: 12,
    gender: "Male",
    location: "Shivaji Nagar, Pune",
    timeMissing: "14h ago",
    status: "active",
    confidence: null,
    clothingColor: "#E74C3C",
  },
  {
    id: "CASE-2024-002",
    name: "Sunita Devi",
    age: 67,
    gender: "Female",
    location: "Laxmi Road, Pune",
    timeMissing: "2d ago",
    status: "matched",
    confidence: 87,
    clothingColor: "#3498DB",
  },
  {
    id: "CASE-2024-003",
    name: "Rohan Patil",
    age: 8,
    gender: "Male",
    location: "Hadapsar, Pune",
    timeMissing: "6h ago",
    status: "active",
    confidence: null,
    clothingColor: "#F39C12",
  },
];

export const mockMatches = [
  {
    rank: 1,
    caseId: "CASE-2024-001",
    faceSim: 0.82,
    clothingSim: 0.71,
    ageMatch: 0.9,
    locScore: 0.65,
    confidence: 78.5,
    location: "MG Road CCTV",
    time: "2h ago",
    approved: false,
  },
  {
    rank: 2,
    caseId: "CASE-2024-001",
    faceSim: 0.74,
    clothingSim: 0.6,
    ageMatch: 0.8,
    locScore: 0.55,
    confidence: 68.2,
    location: "FC Road Camera",
    time: "3h ago",
    approved: false,
  },
  {
    rank: 3,
    caseId: "CASE-2024-001",
    faceSim: 0.65,
    clothingSim: 0.55,
    ageMatch: 0.7,
    locScore: 0.45,
    confidence: 60.1,
    location: "Deccan Area",
    time: "5h ago",
    approved: false,
  },
];

export const mockAlerts = [
  {
    id: "ALT-001",
    caseId: "CASE-2024-002",
    confidence: 87,
    location: "MG Road",
    time: "2 mins ago",
    approved: true,
  },
  {
    id: "ALT-002",
    caseId: "CASE-2024-001",
    confidence: 73,
    location: "FC Road",
    time: "1 hr ago",
    approved: true,
  },
  {
    id: "ALT-003",
    caseId: "CASE-2024-003",
    confidence: 61,
    location: "Deccan",
    time: "3 hrs ago",
    approved: false,
  },
];

export const mockUsers = [
  { name: "Ravi Kumar", role: "Admin", status: "active" },
  { name: "Priya Shah", role: "Officer", status: "active" },
  { name: "Amit Patil", role: "Officer", status: "inactive" },
];

export const mockDbCollections = [
  { collection: "cases", count: 24, size: "1.2 MB" },
  { collection: "embeddings", count: 120, size: "4.8 MB" },
  { collection: "matches", count: 87, size: "0.9 MB" },
  { collection: "alerts", count: 12, size: "0.2 MB" },
  { collection: "users", count: 8, size: "0.1 MB" },
];

export const mockModelResults = [
  { model: "FaceNet", acc: 91.2, prec: 88.4, rec: 89.1, f1: 88.7 },
  { model: "ArcFace", acc: 89.8, prec: 86.2, rec: 87.5, f1: 86.8 },
  { model: "DeepFace", acc: 84.3, prec: 81.0, rec: 82.3, f1: 81.6 },
];

export const mockSearchModels = [
  { name: "FaceNet", score: 82, time: "1.2s" },
  { name: "ArcFace", score: 79, time: "1.8s" },
  { name: "DeepFace", score: 74, time: "0.9s" },
];

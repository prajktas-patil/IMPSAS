import mongoose from "mongoose";

const sightingSchema = new mongoose.Schema({
  location:   { type: String },
  matchScore: { type: Number },
  lat:        { type: Number, default: null },
  lng:        { type: Number, default: null },
  reportedAt: { type: Date, default: Date.now },
  source:     { type: String, default: "manual" },
});

const locationHistorySchema = new mongoose.Schema({
  location:   { type: String },
  lat:        { type: Number, default: null },
  lng:        { type: Number, default: null },
  recordedAt: { type: Date, default: Date.now },
  source:     { type: String, default: "manual" },
});

const alertSentSchema = new mongoose.Schema({
  type:      { type: String },
  recipient: { type: String },
  status:    { type: String },
  sentAt:    { type: Date, default: Date.now },
  message:   { type: String },
});

const familyMemberSchema = new mongoose.Schema({
  name:           { type: String },
  relation:       { type: String },
  phone:          { type: String },
  email:          { type: String },
  aadhaarLast4:   { type: String },
  telegramChatId: { type: String },
});

const caseSchema = new mongoose.Schema({
  caseId:          { type: String, unique: true },
  name:            { type: String, required: true },
  age:             { type: Number },
  gender:          { type: String },
  height:          { type: Number, default: null },
  location:        { type: String },
  clothing:        { type: String },
  timeMissing:     { type: String },
  photos:          [{ type: String }],
  aadhaarNumber:   { type: String },
  aadhaarPhoto:    { type: String },
  familyMembers:   [familyMemberSchema],
  alertLevel:      { type: String, default: "Medium" },
  status:          { type: String, default: "Active" },
  confidenceScore: { type: Number, default: 0 },
  sightings:       [sightingSchema],
  locationHistory: [locationHistorySchema],
  alertsSent:      [alertSentSchema],
}, { timestamps: true });

export default mongoose.model("Case", caseSchema);
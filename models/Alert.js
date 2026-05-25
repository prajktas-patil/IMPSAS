import mongoose from "mongoose";

const alertSchema = new mongoose.Schema({
  caseId:   { type: mongoose.Schema.Types.ObjectId, ref: "Case" },
  message:  String,
  approved: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model("Alert", alertSchema);

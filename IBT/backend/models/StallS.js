import mongoose from "mongoose";

const StallSchema = new mongoose.Schema({
  slotLabel: { type: String, required: true }, // e.g. "A-101"
  floor: { type: String, required: true },     // "Permanent" or "Night Market"
  status: { type: String, default: "Paid" },   // "Paid", "Occupied", "Available"
  tenantId: { type: String },                  // Link to the user who owns it
}, { timestamps: true });

export default mongoose.model("Stall", StallSchema);
import mongoose from "mongoose";

const LostFoundSchema = new mongoose.Schema({
  trackingNo: { type: String, required: true },
  itemType: { type: String },
  location: { type: String, required: true },
  dateTime: { type: Date, required: true },
  status: {
    type: String,
    enum: ["Claimed", "Unclaimed", "Archived"],
    default: "Unclaimed",
  },
  isArchived: { type: Boolean, default: false },

  // Admin-only photo stored in GridFS (uploads bucket)
  photoFilename: { type: String },

  // Claiming details
  claimedBy: { type: String },
  claimEvidence: { type: String },
  claimedAt: { type: Date },
}, { timestamps: true });

export default mongoose.model("LostFound", LostFoundSchema);
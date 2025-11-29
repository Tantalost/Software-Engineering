import mongoose from "mongoose";

const LostFoundSchema = new mongoose.Schema({
  trackingNo: { type: String, required: true },
  description: { type: String, required: true },
  dateTime: { type: Date, required: true },
  status: { 
    type: String, 
    enum: ["Pending", "Claimed", "Unclaimed", "Archived"], 
    default: "Pending" 
  },
  isArchived: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model("LostFound", LostFoundSchema);
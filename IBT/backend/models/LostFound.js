import mongoose from "mongoose";

const LostFoundSchema = new mongoose.Schema({
  trackingNo: { type: String, required: true },
  description: { type: String, required: true },
  location: { type: String, required: true },
  dateTime: { type: Date, required: true },
  status: { 
    type: String, 
    enum: [ "Claimed", "Unclaimed", "Archived"], 
    default: "Unclaimed" 
  },
  isArchived: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model("LostFound", LostFoundSchema);
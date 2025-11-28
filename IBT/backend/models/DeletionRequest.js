import mongoose from "mongoose";

const deletionRequestSchema = new mongoose.Schema({
  itemType: { type: String, required: true }, 
  itemDescription: { type: String, required: true },
  requestedBy: { type: String, required: true },
  reason: { type: String },
  requestDate: { type: Date, default: Date.now },
  status: { type: String, default: "pending" }, 
  originalData: { type: Object }, 
  adminRemarks: { type: String }
}, { timestamps: true });

const DeletionRequest = mongoose.model("DeletionRequest", deletionRequestSchema);
export default DeletionRequest;
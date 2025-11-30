import mongoose from "mongoose";

const archiveSchema = new mongoose.Schema({
  type: { type: String, required: true }, 
  description: { type: String, required: true },
  originalData: { type: Object, required: true }, 
  archivedBy: { type: String, default: "System" },
  dateArchived: { type: Date, default: Date.now }
});

const Archive = mongoose.model("Archive", archiveSchema);
export default Archive;
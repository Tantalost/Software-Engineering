import mongoose from "mongoose"; 
const BusTripSchema = new mongoose.Schema({
  templateNo: { type: String, required: true },
  route: { type: String, required: true },
  time: { type: String, required: true }, 
  date: { type: Date, required: true },
  company: { type: String, required: true },
  status: { type: String, default: "Active" },
  isArchived: { type: Boolean, default: false } 
}, { timestamps: true });

export default mongoose.model("BusTrip", BusTripSchema);
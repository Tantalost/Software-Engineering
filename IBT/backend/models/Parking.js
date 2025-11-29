import mongoose from "mongoose";

const ParkingSchema = new mongoose.Schema({
  ticketNo: { type: String, required: true },
  plateNo: { type: String, required: true }, 
  type: { type: String, required: true },    
  baseRate: { type: Number, required: true }, 
  finalPrice: { type: Number, default: 0 },   
  timeIn: { type: Date, required: true, default: Date.now }, 
  timeOut: { type: Date }, 
  duration: { type: String, default: "" },    
  status: { type: String, default: "Parked" },
  isArchived: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model("Parking", ParkingSchema);
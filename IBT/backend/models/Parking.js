import mongoose from "mongoose";

const ParkingSchema = new mongoose.Schema({
  ticketNo: { type: String, required: true },
  plateNo: { type: String, required: true }, 
  referenceNo: { type: String, default: "-" },
  type: { type: String, required: true },
   pricingType: { 
    type: String, 
    enum: ["hourly", "flat"], 
    default: "hourly" 
  },

  baseRate: { type: Number, required: true }, 
  finalPrice: { type: Number, default: 0 },   

  timeIn: { type: Date, required: true, default: Date.now }, 
  timeOut: { type: Date }, 

  duration: { type: String, default: 0 },   
  status: { type: String, default: "Parked" },
  submitted: {
    type: Boolean,
    default: false,
  },
  submittedAt: {
    type: Date,
    default: null,
  },
  reportId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Report",
    default: null,
  },
  isArchived: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model("Parking", ParkingSchema);